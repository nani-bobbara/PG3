"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface SaveApiKeyInput {
    provider: string; // Made dynamic
    apiKey: string;
}

interface ApiKeyResult {
    success: boolean;
    error?: string;
}

export async function saveApiKey(input: SaveApiKeyInput): Promise<ApiKeyResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    if (!input.apiKey || input.apiKey.trim().length < 10) {
        return { success: false, error: "Invalid API key" };
    }

    // In production, encrypt the key before storing
    // For now, we store it directly (Supabase RLS protects access)
    // TODO: Add encryption using a server-side secret
    const encryptedKey = input.apiKey; // Should be encrypted

    const { error } = await supabase
        .from("user_api_keys")
        .upsert(
            {
                user_id: user.id,
                provider: input.provider,
                encrypted_key: encryptedKey,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,provider" }
        );

    if (error) {
        console.error("Save API key error:", error);
        return { success: false, error: "Failed to save API key" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function deleteApiKey(provider: string): Promise<ApiKeyResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("user_api_keys")
        .delete()
        .eq("user_id", user.id)
        .eq("provider", provider);

    if (error) {
        console.error("Delete API key error:", error);
        return { success: false, error: "Failed to delete API key" };
    }

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function getApiKeyStatus(): Promise<{ [key: string]: boolean }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return {};
    }

    const { data: keys } = await supabase
        .from("user_api_keys")
        .select("provider")
        .eq("user_id", user.id);

    const status: { [key: string]: boolean } = {};
    keys?.forEach(k => {
        status[k.provider] = true;
    });

    return status;
}
