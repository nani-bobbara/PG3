export type ParameterType = 'select' | 'input' | 'slider';

export interface ParameterSchema {
    key: string;
    type: ParameterType;
    label: string;
    description?: string;
    // For Select
    options?: { label: string; value: string }[];
    // For Slider
    min?: number;
    max?: number;
    step?: number;
    // For Input
    placeholder?: string;
}

export interface SupportedTemplate {
    id: string;
    category: 'Image' | 'Video' | 'Text' | 'Utility';
    name: string;
    description: string;
    structure: string;
    default_params: Record<string, any>;
    param_schema: ParameterSchema[];
    help_text?: string;
    is_active: boolean;
}

export interface SupportedAIModel {
    id: string;
    model_id: string;
    name: string;
    provider: string;
    description: string;
    endpoint: string;
    env_key: string;
    is_active: boolean;
}
