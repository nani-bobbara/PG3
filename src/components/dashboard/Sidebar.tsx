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
    ChevronRight,
    LayoutDashboard,
    Zap
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
    { label: "Architect", icon: Wand2, href: "/dashboard" },
    { label: "Archive", icon: History, href: "/dashboard/history" },
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export function Sidebar({ userInfo }: SidebarProps) {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const dailyLimit = userInfo.plan === 'pro' ? -1 : PLAN_LIMITS[userInfo.plan];

    return (
        <aside
            className={cn(
                "h-screen border-r border-border/50 bg-background flex flex-col transition-all duration-300 sticky top-0 z-50",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo Section */}
            <div className="h-16 flex items-center shrink-0 px-6 border-b border-border/30">
                <Link href="/" className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                        <Zap className="w-4 h-4 text-primary-foreground fill-current" />
                    </div>
                    {!collapsed && (
                        <span className="text-lg font-black tracking-tighter text-foreground">
                            PROMPT<span className="text-primary">IFY</span>
                        </span>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 py-8 px-4 space-y-8 overflow-y-auto">
                <div className="space-y-1.5">
                    {!collapsed && (
                        <div className="px-4 mb-4 text-[10px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">
                            Menu
                        </div>
                    )}
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                                    isActive
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 shrink-0 transition-transform group-hover:scale-110",
                                    isActive ? "text-primary" : "text-muted-foreground/60"
                                )} />
                                {!collapsed && <span className="text-sm font-bold tracking-tight">{item.label}</span>}
                                {isActive && (
                                    <div className="absolute left-0 w-1 h-5 bg-primary rounded-r-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Plan Status */}
                {!collapsed && (
                    <div className="px-2">
                        <div className="p-5 rounded-2xl bg-muted/30 border border-border/40 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                                <Sparkles className="w-12 h-12 text-primary" />
                            </div>
                            <div className="relative space-y-4">
                                <div>
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Status</div>
                                    <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider border border-primary/20">
                                        {userInfo.plan}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Usage Quota</div>
                                    <div className="text-xs font-bold text-foreground">
                                        {dailyLimit === -1 ? "Unlimited Protocol" : `${dailyLimit} ops / mo`}
                                    </div>
                                </div>
                                {userInfo.plan === "free" && (
                                    <Button size="sm" className="w-full h-9 rounded-xl font-bold text-[10px] tracking-widest uppercase bg-foreground text-background hover:bg-foreground/90 transition-all" asChild>
                                        <Link href="/dashboard/settings">Upgrade</Link>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Collapse Toggle */}
            <div className="p-4 border-t border-border/30">
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center h-10 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                >
                    {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>
        </aside>
    );
}
