"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { SupportedTemplate, SupportedAIModel } from "@/types/dynamic-config";

export function useDynamicConfig() {
    const supabase = createClient();

    const templatesQuery = useQuery({
        queryKey: ['supported_templates'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('supported_templates')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: true }); // Order by creation or add a rank column later

            if (error) throw error;
            return data as SupportedTemplate[];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    const modelsQuery = useQuery({
        queryKey: ['supported_ai_models'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('supported_ai_models')
                .select('*')
                .eq('is_active', true)
                .order('name');

            if (error) throw error;
            return data as SupportedAIModel[];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    return {
        templates: templatesQuery.data || [],
        isLoadingTemplates: templatesQuery.isLoading,
        templatesError: templatesQuery.error,

        models: modelsQuery.data || [],
        isLoadingModels: modelsQuery.isLoading,
        modelsError: modelsQuery.error
    };
}
