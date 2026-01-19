"use server";

import { createClient } from "@/lib/supabase/server";
import { SupportedAIModel } from "@/types/dynamic-config";

// Use a flexible input type since we are now fully dynamic
interface GeneratePromptInput {
    topic: string;
    templateId?: string; // Optional for tracking
    templateStructure?: string; // The raw template string
    style?: string;
    modelId: string; // Dynamic ID now
    parameters?: Record<string, any>;
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

    // 1. Fetch Model Config from DB instead of static file
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

    // 2. Fetch User Subscription & Tier
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select(`
            *,
            tiers:current_tier (
                id,
                quota,
                name
            )
        `)
        .eq("user_id", user.id)
        .single();

    // Default to free tier if no subscription found
    const currentTier = subscription?.tiers || { id: 'free', quota: 50, name: 'Free' };
    const quotaUsed = subscription?.quota_used || 0;

    // 3. Quota & BYOK Logic
    let useSystemKey = true;

    // Check if over quota
    if (quotaUsed >= currentTier.quota) {
        // Check for BYOK eligibility (Fallback)
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

    // 4. Construct system prompt with Interpolation
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
        // Fetch user key
        const { data: userKey } = await supabase
            .from("user_api_keys")
            .select("encrypted_key")
            .eq("user_id", user.id)
            .eq("provider", modelConfig.provider)
            .single();
        apiKey = userKey?.encrypted_key;
    }

    if (!apiKey) {
        return {
            content: "",
            error: `Configuration Error: No API key found for ${modelConfig.name}.`
        };
    }

    try {
        let content: string;

        // Dynamic Provider Logic
        if (modelConfig.provider === "google") {
            content = await callGemini(apiKey, systemPrompt, input.topic, modelConfig.endpoint);
        } else if (modelConfig.provider === "openai") {
            content = await callOpenAI(apiKey, modelConfig.model_id, systemPrompt, input.topic, modelConfig.endpoint);
        } else {
            return { content: "", error: `Unsupported provider: ${modelConfig.provider}` };
        }

        // 6. Increment Usage (Only if using System Key)
        if (useSystemKey) {
            // We use direct update for simplicity in MVP. 
            // Ideally RPC "increment_usage" handles concurrency.
            // Using the existing 'daily_requests_count' RPC or similar is option,
            // but we want 'quota_used'.
            const { error: updateError } = await supabase
                .from('subscriptions')
                .update({ quota_used: quotaUsed + 1 })
                .eq('user_id', user.id);

            if (updateError) console.error("Quota update failed", updateError);
        }

        // 7. Save to history
        await supabase.from("prompts").insert({
            user_id: user.id,
            template_type: input.modelId,
            input_prompt: input.topic,
            output_prompt: content,
        });

        return { content };
    } catch (error: any) {
        console.error("AI Generation Error:", error);
        return { content: "", error: error.message || "Generation failed" };
    }
}

function buildDynamicPrompt(template: string, topic: string, style?: string, params?: Record<string, any>): string {
    let prompt = template || "";

    // A. Interpolate Parameters
    if (params) {
        Object.keys(params).forEach(key => {
            const val = params[key];
            prompt = prompt.replace(new RegExp(`{{${key}}}`, 'g'), String(val));
        });
    }

    // B. Interpolate Topic/Subject into placeholders if present
    const topicPlaceholders = ['topic', 'subject', 'details', 'input'];
    let topicInjected = false;

    topicPlaceholders.forEach(ph => {
        if (prompt.includes(`{{${ph}}}`)) {
            prompt = prompt.replace(new RegExp(`{{${ph}}}`, 'g'), topic);
            topicInjected = true;
        }
    });

    // C. Handle Style
    if (style) {
        if (prompt.includes('{{style}}')) {
            prompt = prompt.replace(/{{style}}/g, style);
        } else {
            prompt += `\n\nVisual Style: ${style}`;
        }
    }

    return prompt + `\n\nRespond ONLY with the generated prompt, no explanations.`;
}

// Updated Provider Calls to accept dynamic endpoint

async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string, endpoint: string): Promise<string> {
    const url = `${endpoint}?key=${apiKey}`;

    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            contents: [
                { role: "user", parts: [{ text: `${systemPrompt}\n\nTopic: ${userPrompt}` }] }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 1024,
            },
        }),
    }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Gemini API error");
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

async function callOpenAI(apiKey: string, model: string, systemPrompt: string, userPrompt: string, endpoint: string): Promise<string> {
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
            max_tokens: 1024,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
}
