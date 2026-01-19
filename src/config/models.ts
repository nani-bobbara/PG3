export interface AIModelConfig {
    id: string;
    name: string;
    provider: 'google' | 'openai' | 'anthropic';
    description: string;
}

export const AI_MODELS: AIModelConfig[] = [
    {
        id: 'gemini-1.5-pro',
        name: 'Gemini 1.5 Pro',
        provider: 'google',
        description: 'Google\'s most capable model for reasoning and creativity.'
    },
    {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        description: 'OpenAI\'s flagship multimodal model.'
    }
];
