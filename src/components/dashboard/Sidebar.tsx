"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    PenLine,
    Archive,
    Settings,
    Zap,
    HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
    userInfo: {
        email: string;
        fullName: string;
        plan: "free" | "basic" | "pro";
        quotaUsed?: number;
        quotaLimit?: number;
    };
}

const navItems = [
    { 
        label: "Create", 
        icon: PenLine, 
        href: "/dashboard"
    },
    { 
        label: "Archive", 
        icon: Archive, 
        href: "/dashboard/history"
    },
];

const bottomNavItems = [
    { 
        label: "Settings", 
        icon: Settings, 
        href: "/dashboard/settings"
    },
    { 
        label: "Help", 
        icon: HelpCircle, 
        href: "#",
        external: true
    },
];

export function Sidebar({ }: SidebarProps) {
    const pathname = usePathname();

    const isActive = (href: string) => {
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(href);
    };

    return (
        <TooltipProvider delayDuration={0}>
            <aside className="h-full w-20 bg-background/80 backdrop-blur-xl border-r border-border flex flex-col items-center py-4">
                {/* Logo */}
                <Link href="/" className="mb-6">
                    <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-sm">
                        <Zap className="w-5 h-5 text-primary-foreground" />
                    </div>
                </Link>

                {/* Main Navigation */}
                <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
                    {navItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Tooltip key={item.href + item.label}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "w-full flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all group",
                                            active
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "w-5 h-5 mb-1",
                                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-medium leading-tight",
                                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                            {item.label}
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-medium">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}
                </nav>

                {/* Bottom Navigation */}
                <div className="flex flex-col items-center gap-1 w-full px-2 mt-auto">
                    {bottomNavItems.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Tooltip key={item.href + item.label}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className={cn(
                                            "w-full flex flex-col items-center justify-center py-3 px-2 rounded-xl transition-all group",
                                            active
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <item.icon className={cn(
                                            "w-5 h-5 mb-1",
                                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )} />
                                        <span className={cn(
                                            "text-[10px] font-medium leading-tight",
                                            active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                        )}>
                                            {item.label}
                                        </span>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-medium">
                                    {item.label}
                                </TooltipContent>
                            </Tooltip>
                        );
                    })}

                </div>
            </aside>
        </TooltipProvider>
    );
}
