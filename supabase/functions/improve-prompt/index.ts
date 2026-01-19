import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Blocked content patterns for content moderation
const BLOCKED_PATTERNS = [
  /\b(porn|pornograph|xxx|nsfw|nude|naked|sex(?:ual)?|explicit|erotic|hentai)\b/i,
  /\b(child|minor|underage|kid|teen).*\b(sex|nude|naked|explicit)\b/i,
  /\b(gore|mutilation|torture|dismember|beheading)\b/i,
  /\b(self.?harm|suicide|kill.?yourself)\b/i,
  /\b(terror(?:ist|ism)?|bomb.?making|explosives?.?recipe)\b/i,
  /\b(drugs?.?recipe|meth.?lab|cocaine.?synthesis)\b/i,
  /\b(hack(?:ing)?.?tutorial|malware|ransomware|phishing.?kit)\b/i,
];

// Input validation schema
interface ValidatedInput {
  topic: string;
  templateName: string;
  templateStructure: string;
  styleName: string;
  styleDescription: string;
}

function validateAndSanitizeInput(body: any): { valid: boolean; data?: ValidatedInput; error?: string } {
  // Check required fields
  if (!body.topic || typeof body.topic !== "string") {
    return { valid: false, error: "Topic is required and must be a string" };
  }

  // Trim and validate length
  const topic = body.topic.trim();
  if (topic.length === 0) {
    return { valid: false, error: "Topic cannot be empty" };
  }
  if (topic.length > 2000) {
    return { valid: false, error: "Topic exceeds maximum length of 2000 characters" };
  }

  // Validate template
  const templateName = typeof body.templateName === "string" ? body.templateName.trim().slice(0, 100) : "General";
  const templateStructure = typeof body.templateStructure === "string" ? body.templateStructure.trim().slice(0, 2000) : "";

  // Validate style
  const styleName = typeof body.styleName === "string" ? body.styleName.trim().slice(0, 100) : "None";
  const styleDescription = typeof body.styleDescription === "string" ? body.styleDescription.trim().slice(0, 500) : "";

  return {
    valid: true,
    data: {
      topic,
      templateName,
      templateStructure,
      styleName,
      styleDescription,
    },
  };
}

function containsBlockedContent(text: string): boolean {
  const lowerText = text.toLowerCase();
  return BLOCKED_PATTERNS.some((pattern) => pattern.test(lowerText));
}

function buildSystemPrompt(input: ValidatedInput): string {
  let prompt = `You are an expert AI Prompt Engineer. Your task is to transform user topics into highly effective, structured, production-ready prompts for generative AI models.

RULES:
1. Return ONLY the improved prompt text - no explanations, no markdown formatting, no quotes
2. Make the prompt specific, detailed, and actionable
3. Include relevant technical parameters when applicable
4. Maintain professional, appropriate content at all times
5. Never include harmful, explicit, or inappropriate content

`;

  if (input.styleName && input.styleName !== "None" && input.styleName !== "No Style") {
    prompt += `STYLE DIRECTIVE: Apply the "${input.styleName}" aesthetic style. ${input.styleDescription}\n\n`;
  }

  if (input.templateStructure) {
    prompt += `TEMPLATE STRUCTURE: Follow this format:\n${input.templateStructure}\n\n`;
  }

  prompt += `USER'S TOPIC: "${input.topic}"

Generate a single, production-ready prompt based on the topic above.`;

  return prompt;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify JWT and get user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing request for user: ${user.id}`);

    // Parse and validate input
    const body = await req.json();
    const validation = validateAndSanitizeInput(body);

    if (!validation.valid) {
      console.error("Validation failed:", validation.error);
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const input = validation.data!;

    // Content moderation check
    if (containsBlockedContent(input.topic)) {
      console.warn(`Blocked content detected from user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Your prompt contains content that violates our usage policy. Please revise and try again." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check user subscription and daily limits
    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subError || !subscription) {
      console.error("Subscription error:", subError?.message);
      return new Response(JSON.stringify({ error: "Subscription not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Define limits per plan
    const planLimits: Record<string, number> = {
      free: 10,
      creator: 100,
      pro: 999999,
    };

    const dailyLimit = planLimits[subscription.plan] || 10;

    // Check if reset is needed
    const resetAt = subscription.daily_prompts_reset_at ? new Date(subscription.daily_prompts_reset_at) : new Date(0);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

    let dailyUsed = subscription.daily_prompts_used;

    if (hoursSinceReset >= 24) {
      // Reset daily counter
      dailyUsed = 0;
      await supabase
        .from("subscriptions")
        .update({
          daily_prompts_used: 0,
          daily_prompts_reset_at: now.toISOString(),
        })
        .eq("user_id", user.id);
    }

    if (dailyUsed >= dailyLimit) {
      console.log(`User ${user.id} exceeded daily limit: ${dailyUsed}/${dailyLimit}`);
      return new Response(
        JSON.stringify({ error: "Daily prompt limit reached. Upgrade your plan for more prompts." }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Call Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(input);
    console.log(`Calling AI gateway for template: ${input.templateName}, style: ${input.styleName}`);

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Create an improved prompt for: ${input.topic}` },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        console.error("AI Gateway rate limited");
        return new Response(JSON.stringify({ error: "AI service is temporarily busy. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        console.error("AI Gateway payment required");
        return new Response(JSON.stringify({ error: "AI service quota exceeded. Please try again later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await aiResponse.text();
      console.error("AI Gateway error:", aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to generate prompt" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const improvedPrompt = aiData.choices?.[0]?.message?.content?.trim() || "";

    if (!improvedPrompt) {
      console.error("Empty response from AI");
      return new Response(JSON.stringify({ error: "AI returned empty response" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify output doesn't contain blocked content
    if (containsBlockedContent(improvedPrompt)) {
      console.warn(`AI output blocked for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Generated content was flagged. Please try a different topic." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Save to prompt history
    const { error: insertError } = await supabase.from("prompts").insert({
      user_id: user.id,
      input_prompt: input.topic,
      output_prompt: improvedPrompt,
      template_type: input.templateName,
    });

    if (insertError) {
      console.error("Failed to save prompt history:", insertError.message);
      // Don't fail the request, just log it
    }

    // Increment daily usage
    await supabase
      .from("subscriptions")
      .update({
        daily_prompts_used: dailyUsed + 1,
      })
      .eq("user_id", user.id);

    console.log(`Successfully generated prompt for user ${user.id}. Daily usage: ${dailyUsed + 1}/${dailyLimit}`);

    return new Response(
      JSON.stringify({
        content: improvedPrompt,
        usage: {
          daily_used: dailyUsed + 1,
          daily_limit: dailyLimit,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
