export interface Template {
    id: string;
    name: string;
    description: string;
    category: 'Image' | 'Video' | 'Text' | 'Utility';
    structure: string;
    help_text?: string;
    default_params?: Record<string, any>;
}

export const templates: Template[] = [
    {
        id: 'midjourney-v6',
        name: 'Midjourney v6 Cinematic',
        description: 'Optimized for high-end photography and cinematic lighting.',
        category: 'Image',
        structure: '{{topic}} --ar 16:9 --style raw --v 6.0'
    },
    {
        id: 'dalle-3-descriptive',
        name: 'DALL·E 3 Storyboard',
        description: 'Best for detailed, illustrative storyboards and concepts.',
        category: 'Image',
        structure: 'A detailed illustration of {{topic}} in the style of...'
    },
    {
        id: 'marketing-copy-gen',
        name: 'Marketing Copy Engine',
        description: 'Generate conversion-focused headlines and body text.',
        category: 'Text',
        structure: 'Write a high-converting {{platform}} post about {{topic}}...'
    }
];
