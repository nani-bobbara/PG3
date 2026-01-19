"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
    Menu, 
    Settings, 
    LogOut, 
    Bell, 
    ChevronRight,
    Sparkles,
    Sun,
    Moon,
    Monitor,
    Home
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "./Sidebar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

interface HeaderProps {
    userInfo: {
        email: string;
        fullName: string;
        plan: "free" | "basic" | "pro";
        quotaUsed?: number;
        quotaLimit?: number;
    };
}

// Breadcrumb config
const breadcrumbLabels: Record<string, string> = {
    "/dashboard": "Create",
    "/dashboard/history": "Archive",
    "/dashboard/settings": "Settings",
};

export function Header({ userInfo }: HeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();
    const { setTheme, theme } = useTheme();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
    };

    const initials = userInfo.fullName
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || userInfo.email.charAt(0).toUpperCase();

    const quotaUsed = userInfo.quotaUsed || 0;
    const quotaLimit = userInfo.quotaLimit || 50;
    const remaining = quotaLimit - quotaUsed;
    const usagePercent = Math.min((quotaUsed / quotaLimit) * 100, 100);

    // Build breadcrumb
    const currentPage = breadcrumbLabels[pathname] || "Dashboard";

    // Plan colors
    const planColors = {
        free: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        basic: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        pro: "bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700 dark:from-amber-900/50 dark:to-orange-900/50 dark:text-amber-300",
    };

    return (
        <header className="sticky top-0 z-40 bg-background/70 backdrop-blur-xl border-b border-border/40 shadow-sm h-14 flex items-center px-4 md:px-6">
            {/* Mobile Menu Toggle */}
            <div className="md:hidden mr-3">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Menu className="w-5 h-5" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-20">
                        <Sidebar userInfo={userInfo} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-1.5 text-sm">
                <Link 
                    href="/dashboard" 
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                >
                    <Home className="w-4 h-4" />
                </Link>
                {currentPage !== "Create" && (
                    <>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="font-medium text-foreground">{currentPage}</span>
                    </>
                )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 ml-auto">
                {/* Usage/Plan Badge */}
                <div className="hidden sm:flex items-center">
                    <div className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
                        planColors[userInfo.plan]
                    )}>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="capitalize">{userInfo.plan}</span>
                        <span className="opacity-60">•</span>
                        <span>{quotaUsed}/{quotaLimit}</span>
                    </div>
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <Bell className="w-4 h-4" />
                    {/* Notification dot */}
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                </Button>

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-2 p-1 rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary via-primary to-primary/60 flex items-center justify-center text-xs font-bold text-primary-foreground ring-2 ring-background">
                                {initials}
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2" align="end" sideOffset={8}>
                        {/* User Info Header */}
                        <div className="px-2 py-3 mb-1">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-sm font-bold text-primary-foreground">
                                    {initials}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-foreground truncate">{userInfo.fullName}</p>
                                    <p className="text-xs text-muted-foreground truncate">{userInfo.email}</p>
                                </div>
                            </div>
                            {/* Mobile usage display */}
                            <div className="sm:hidden mt-3 flex items-center gap-2 text-xs">
                                <span className={cn(
                                    "px-2 py-0.5 rounded-full font-medium capitalize",
                                    planColors[userInfo.plan]
                                )}>
                                    {userInfo.plan}
                                </span>
                                <span className="text-muted-foreground">{remaining} credits left</span>
                            </div>
                        </div>
                        
                        <DropdownMenuSeparator className="my-1" />
                        
                        {/* Theme Submenu */}
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="rounded-lg">
                                <div className="flex items-center gap-2">
                                    {theme === "dark" ? (
                                        <Moon className="w-4 h-4" />
                                    ) : theme === "light" ? (
                                        <Sun className="w-4 h-4" />
                                    ) : (
                                        <Monitor className="w-4 h-4" />
                                    )}
                                    <span>Theme</span>
                                </div>
                            </DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="min-w-[140px]">
                                    <DropdownMenuItem 
                                        onClick={() => setTheme("light")}
                                        className={cn("rounded-lg", theme === "light" && "bg-muted")}
                                    >
                                        <Sun className="mr-2 h-4 w-4" />
                                        Light
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => setTheme("dark")}
                                        className={cn("rounded-lg", theme === "dark" && "bg-muted")}
                                    >
                                        <Moon className="mr-2 h-4 w-4" />
                                        Dark
                                    </DropdownMenuItem>
                                    <DropdownMenuItem 
                                        onClick={() => setTheme("system")}
                                        className={cn("rounded-lg", theme === "system" && "bg-muted")}
                                    >
                                        <Monitor className="mr-2 h-4 w-4" />
                                        System
                                    </DropdownMenuItem>
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>

                        <DropdownMenuItem asChild className="rounded-lg">
                            <Link href="/dashboard/settings" className="cursor-pointer">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Link>
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="my-1" />
                        
                        <DropdownMenuItem 
                            onClick={handleSignOut} 
                            className="rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
