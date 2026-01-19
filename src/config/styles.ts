// Centralized Styles Configuration
// Visual aesthetics that can be applied to any prompt

export type StyleCategory = 'Cinematic' | 'Artistic' | 'Digital' | 'Photography' | 'General';

export interface Style {
    id: string;
    name: string;
    description: string;
    category: StyleCategory;
    previewColor?: string;
}

export const styles: Style[] = [
    {
        id: 'none',
        name: 'No Style',
        description: 'Direct and unformatted output.',
        category: 'General',
    },
    {
        id: 'cinematic',
        name: 'Cinematic',
        description: 'Movie-like, dramatic lighting, high depth of field.',
        category: 'Cinematic',
        previewColor: 'from-amber-500 to-orange-700'
    },
    {
        id: 'cyberpunk',
        name: 'Cyberpunk',
        description: 'Neon lights, futuristic, high contrast, tech-noir.',
        category: 'Digital',
        previewColor: 'from-pink-500 to-violet-700'
    },
    {
        id: 'photoreal',
        name: 'Photorealistic',
        description: '8k resolution, highly detailed, sharp focus, raw style.',
        category: 'Photography',
        previewColor: 'from-blue-400 to-emerald-600'
    },
    {
        id: 'anime',
        name: 'Anime / Manga',
        description: 'Japanese animation style, cel shaded, vibrant colors.',
        category: 'Artistic',
        previewColor: 'from-rose-400 to-pink-500'
    },
    {
        id: 'oil-painting',
        name: 'Oil Painting',
        description: 'Textured, brush strokes, classical art style.',
        category: 'Artistic',
        previewColor: 'from-yellow-600 to-amber-800'
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        description: 'Clean lines, simple shapes, flat colors, negative space.',
        category: 'Artistic',
        previewColor: 'from-gray-200 to-gray-400'
    },
    {
        id: '3d-render',
        name: '3D Render',
        description: 'Unreal Engine 5, Octane Render, Ray Tracing.',
        category: 'Digital',
        previewColor: 'from-indigo-500 to-cyan-500'
    }
];
