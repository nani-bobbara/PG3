import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";
import { PLAN_LIMITS } from "@/config/plans";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", user.id)
        .single();

    // Fetch subscription with quota info
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, status, quota_used")
        .eq("user_id", user.id)
        .single();

    const plan = (subscription?.plan as "free" | "basic" | "pro") || "free";
    const quotaUsed = subscription?.quota_used || 0;
    const quotaLimit = PLAN_LIMITS[plan] || 50;

    const userInfo = {
        email: user.email || "",
        fullName: profile?.full_name || user.email?.split("@")[0] || "User",
        plan,
        quotaUsed,
        quotaLimit,
    };

    return (
        <div className="h-screen bg-background flex overflow-hidden">
            {/* Desktop Sidebar - Fixed */}
            <aside className="hidden md:block fixed left-0 top-0 bottom-0 z-50">
                <Sidebar userInfo={userInfo} />
            </aside>

            {/* Main Area - Offset by sidebar width */}
            <div className="flex-1 flex flex-col md:ml-20 min-h-screen">
                {/* Header - Fixed */}
                <Header userInfo={userInfo} />
                
                {/* Scrollable Content */}
                <main className="flex-1 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}
