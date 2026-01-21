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
        .from("user_profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

    // Fetch subscription details with tier information
    const { data: rawSubscription } = await supabase
        .from("user_subscriptions")
        .select(`
             *,
             tier:subscription_tiers!tier_id (*)
        `)
        .eq("user_id", user.id)
        .single();

    // Default to free tier if no subscription found
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentTier: any = rawSubscription?.tier || { id: 'free', name: 'Free', monthly_quota: 10, features: [] };
    const quotaUsed = rawSubscription?.monthly_usage_count || 0;
    const quotaLimit = rawSubscription?.monthly_quota_limit || 10;

    // Parse features to check for BYOK capability
    const features = Array.isArray(currentTier.features) ? currentTier.features : [];
    const byokEnabled = features.some((f: string) =>
        typeof f === 'string' && (f.toLowerCase().includes('own key') || f.toLowerCase().includes('byok'))
    );

    // Feature flag for personal key default
    const usePersonalDefault = false;

    // Fetch all subscription tiers to get dynamic prices and IDs
    const { data: tiers } = await supabase
        .from("subscription_tiers")
        .select("id, name, monthly_quota, features, stripe_monthly_price_id, stripe_yearly_price_id, monthly_price_in_cents, yearly_price_in_cents")
        .eq("is_active", true);

    const basicTier = tiers?.find(t => t.id === 'basic');
    const proTier = tiers?.find(t => t.id === 'pro');

    const keyStatus = await getApiKeyStatus();

    return (
        <SettingsClient
            userEmail={user.email || ""}
            userName={profile?.full_name || user.email?.split("@")[0] || "User"}
            keyStatus={keyStatus}
            tiers={{
                basic: {
                    monthlyPriceId: basicTier?.stripe_monthly_price_id || "",
                    yearlyPriceId: basicTier?.stripe_yearly_price_id || "",
                    monthlyPriceInCents: basicTier?.monthly_price_in_cents || 2000,
                    yearlyPriceInCents: basicTier?.yearly_price_in_cents || 0,
                    quota: basicTier?.monthly_quota || 200
                },
                pro: {
                    monthlyPriceId: proTier?.stripe_monthly_price_id || "",
                    yearlyPriceId: proTier?.stripe_yearly_price_id || "",
                    monthlyPriceInCents: proTier?.monthly_price_in_cents || 5000,
                    yearlyPriceInCents: proTier?.yearly_price_in_cents || 0,
                    quota: proTier?.monthly_quota || 600
                }
            }}
            subscription={{
                tierName: currentTier.name,
                quotaUsed: quotaUsed,
                quotaLimit: quotaLimit,
                tierFeatures: {
                    byok_enabled: byokEnabled
                },
                usePersonalDefault: usePersonalDefault
            }}
        />
    );
}
