import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

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

    // Fetch subscription
    const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan, status")
        .eq("user_id", user.id)
        .single();

    const userInfo = {
        email: user.email || "",
        fullName: profile?.full_name || user.email?.split("@")[0] || "User",
        plan: (subscription?.plan as "free" | "basic" | "pro") || "free",
    };

    return (
        <div className="min-h-screen bg-background flex">
            {/* Desktop Sidebar */}
            <div className="hidden md:block">
                <Sidebar userInfo={userInfo} />
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col">
                <Header userInfo={userInfo} />
                <main className="flex-1 overflow-hidden h-full relative">
                    {children}
                </main>
            </div>
        </div>
    );
}
