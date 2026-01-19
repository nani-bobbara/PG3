"use server";

import { createClient } from "@/lib/supabase/server";
import { SupportedAIModel } from "@/types/dynamic-config";
import { AIProviderService } from "@/lib/ai-service";

interface GeneratePromptInput {
    topic: string;
    templateId?: string;
    templateStructure?: string;
    style?: string;
    modelId: string;
    parameters?: Record<string, unknown>;
}

interface GeneratePromptResult {
    content: string;
    error?: string;
}

export async function generatePrompt(input: GeneratePromptInput): Promise<GeneratePromptResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { content: "", error: "Unauthorized" };
    }

    // 1. Fetch Model Config
    const { data: modelData } = await supabase
        .from('supported_ai_models')
        .select('*')
        .eq('model_id', input.modelId)
        .eq('is_active', true)
        .single();

    const modelConfig = modelData as SupportedAIModel;
    if (!modelConfig) {
        return { content: "", error: `Invalid or disabled model: ${input.modelId}` };
    }

    // 2. Fetch User Subscription & Quota
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("*, tiers:current_tier (id, quota, name)")
        .eq("user_id", user.id)
        .single();

    const currentTier = subscription?.tiers || { id: 'free', quota: 50, name: 'Free' };
    const quotaUsed = subscription?.quota_used || 0;

    // 3. Quota & BYOK Logic
    let useSystemKey = true;
    if (quotaUsed >= currentTier.quota) {
        const { data: userKeys } = await supabase
            .from("user_api_keys")
            .select("encrypted_key")
            .eq("user_id", user.id)
            .eq("provider", modelConfig.provider)
            .single();

        if (userKeys) {
            useSystemKey = false;
        } else {
            return {
                content: "",
                error: `Monthly limit of ${currentTier.quota} prompts reached. Upgrade plan or add a personal API Key in Settings to continue.`
            };
        }
    }

    // 4. Construct system prompt
    const systemPrompt = buildDynamicPrompt(
        input.templateStructure || "",
        input.topic,
        input.style,
        input.parameters
    );

    // 5. Determine API Key
    let apiKey: string | undefined;
    if (useSystemKey) {
        apiKey = process.env[modelConfig.env_key];
    } else {
        const { data: userKey } = await supabase
            .from("user_api_keys")
            .select("encrypted_key")
            .eq("user_id", user.id)
            .eq("provider", modelConfig.provider)
            .single();
        apiKey = userKey?.encrypted_key;
    }

    if (!apiKey) {
        return { content: "", error: `Configuration Error: No API key found for ${modelConfig.provider}.` };
    }

    // 6. Execute AI Generation via Service Layer
    const result = await AIProviderService.generate(modelConfig.provider, {
        apiKey,
        systemPrompt,
        userPrompt: input.topic,
        modelId: modelConfig.model_id,
        endpoint: modelConfig.endpoint
    });

    if (result.error) return result;

    // 7. Post-Processing: Update Usage & History
    if (useSystemKey) {
        await supabase
            .from('subscriptions')
            .update({ quota_used: quotaUsed + 1 })
            .eq('user_id', user.id);
    }

    await supabase.from("prompts").insert({
        user_id: user.id,
        template_type: input.modelId,
        input_prompt: input.topic,
        output_prompt: result.content,
    });

    return result;
}

function buildDynamicPrompt(template: string, topic: string, style?: string, params?: Record<string, unknown>): string {
    let prompt = template || "";

    if (params) {
        Object.keys(params).forEach(key => {
            const val = params[key];
            prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
        });
    }

    const topicPlaceholders = ['topic', 'subject', 'details', 'input'];
    topicPlaceholders.forEach(ph => {
        if (prompt.includes(`{{${ph}}}`)) {
            prompt = prompt.replace(new RegExp(`{{${ph}}}`, 'g'), topic);
        }
    });

    if (style) {
        if (prompt.includes('{{style}}')) {
            prompt = prompt.replace(/{{style}}/g, style);
        } else {
            prompt += `\n\nVisual Style: ${style}`;
        }
    }

    return prompt + `\n\nRespond ONLY with the generated prompt, no explanations.`;
}
