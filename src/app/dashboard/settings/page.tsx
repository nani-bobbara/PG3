import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "@/components/dashboard/SettingsClient";
import { getApiKeyStatus } from "@/app/actions/manage-api-keys";

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

    // Fetch subscription details
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select(`
            *,
            tiers:current_tier (
                id,
                name,
                quota
            )
        `)
        .eq("user_id", user.id)
        .single();

    const currentTier = subscription?.tiers || { id: 'free', name: 'Free', quota: 50 };
    const quotaUsed = subscription?.quota_used || 0;

    const keyStatus = await getApiKeyStatus();

    return (
        <SettingsClient
            userEmail={user.email || ""}
            userName={profile?.full_name || user.email?.split("@")[0] || "User"}
            keyStatus={keyStatus}
            subscription={{
                tierName: currentTier.name,
                quotaUsed: quotaUsed,
                quotaLimit: currentTier.quota
            }}
        />
    );
}
