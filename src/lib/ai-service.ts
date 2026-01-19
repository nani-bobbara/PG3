export interface AIProviderResponse {
    content: string;
    error?: string;
}

export interface AIProviderRequest {
    apiKey: string;
    systemPrompt: string;
    userPrompt: string;
    modelId: string;
    endpoint: string;
}

export class AIProviderService {
    static async callGemini(req: AIProviderRequest): Promise<AIProviderResponse> {
        const url = `${req.endpoint}?key=${req.apiKey}`;

        try {
            const response = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        { role: "user", parts: [{ text: `${req.systemPrompt}\n\nTopic: ${req.userPrompt}` }] }
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return { content: "", error: error.error?.message || "Gemini API error" };
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
            return { content };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to contact Gemini";
            return { content: "", error: message };
        }
    }

    static async callOpenAI(req: AIProviderRequest): Promise<AIProviderResponse> {
        try {
            const response = await fetch(req.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${req.apiKey}`,
                },
                body: JSON.stringify({
                    model: req.modelId,
                    messages: [
                        { role: "system", content: req.systemPrompt },
                        { role: "user", content: req.userPrompt },
                    ],
                    temperature: 0.7,
                    max_tokens: 1024,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                return { content: "", error: error.error?.message || "OpenAI API error" };
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || "";
            return { content };
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to contact OpenAI";
            return { content: "", error: message };
        }
    }

    static async generate(provider: string, req: AIProviderRequest): Promise<AIProviderResponse> {
        switch (provider) {
            case 'google':
                return this.callGemini(req);
            case 'openai':
                return this.callOpenAI(req);
            default:
                return { content: "", error: `Unsupported provider: ${provider}` };
        }
    }
}
