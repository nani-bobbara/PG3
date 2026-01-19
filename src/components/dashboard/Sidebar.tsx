"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Sparkles,
    Wand2,
    History,
    Settings,
    CreditCard,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LIMITS } from "@/config";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SidebarProps {
    userInfo: {
        email: string;
        fullName: string;
        plan: "free" | "basic" | "pro";
    };
}

const navItems = [
    { label: "Dashboard", icon: Wand2, href: "/dashboard" },
    { label: "History", icon: History, href: "/dashboard/history" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar({ userInfo }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const dailyLimit = userInfo.plan === 'pro' ? -1 : PLAN_LIMITS[userInfo.plan];

    return (
        <aside
            className={cn(
                "h-screen border-r border-border bg-sidebar p-4 flex flex-col transition-all duration-300 sticky top-0",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo */}
            <div className="flex items-center justify-between mb-8 px-2">
                <Link href="/" className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {!collapsed && <span className="text-xl font-bold text-foreground">PromptGen</span>}
                </Link>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="p-1 rounded-md hover:bg-sidebar-accent text-muted-foreground hidden md:block"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                            )}
                        >
                            <item.icon className="w-5 h-5 flex-shrink-0" />
                            {!collapsed && <span className="font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Plan Badge */}
            {!collapsed && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
                    <div className="text-xs text-muted-foreground mb-1">Current Plan</div>
                    <div className="font-semibold text-foreground capitalize">{userInfo.plan} Plan</div>
                    <div className="text-xs text-muted-foreground mt-1">
                        {dailyLimit === -1 ? "Unlimited prompts" : `${dailyLimit} prompts/day`}
                    </div>
                    {userInfo.plan === "free" && (
                        <Button size="sm" className="w-full mt-3 bg-gradient-to-r from-primary to-accent" asChild>
                            <Link href="/dashboard/billing">Upgrade</Link>
                        </Button>
                    )}
                </div>
            )}
            {collapsed && userInfo.plan === "free" && (
                <Link href="/dashboard/billing" className="flex items-center justify-center p-2 rounded-lg hover:bg-sidebar-accent/50">
                    <CreditCard className="w-5 h-5 text-primary" />
                </Link>
            )}
        </aside>
    );
}
