"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, LogOut, Settings, User, Sparkles, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sidebar } from "./Sidebar";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface HeaderProps {
    userInfo: {
        email: string;
        fullName: string;
        plan: "free" | "basic" | "pro";
    };
}

export function Header({ userInfo }: HeaderProps) {
    const router = useRouter();
    const supabase = createClient();
    const initials = userInfo.fullName.charAt(0).toUpperCase();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
        toast.success("Safe departure confirmed");
    };

    return (
        <header className="sticky top-0 z-40 bg-background/40 backdrop-blur-3xl border-b border-border/30 h-16 flex items-center justify-between px-6">
            {/* Mobile Menu Toggle */}
            <div className="md:hidden">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
                            <Menu className="w-5 h-5 text-foreground" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-64 border-r border-border/40">
                        <Sidebar userInfo={userInfo} />
                    </SheetContent>
                </Sheet>
            </div>

            {/* Breadcrumb / Context Placeholder */}
            <div className="hidden md:flex items-center gap-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-3 py-1 rounded-full bg-muted/50 border border-border/30">
                    System Active
                </span>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4 ml-auto">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground hover:text-foreground hidden sm:flex">
                    <Bell className="w-4 h-4" />
                </Button>

                <div className="h-6 w-[1px] bg-border/40 hidden sm:block mx-1" />

                {/* Profile Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 p-1 rounded-2xl hover:bg-muted/50 transition-all active:scale-95 group">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary to-accent flex items-center justify-center text-xs font-black text-primary-foreground shadow-lg shadow-primary/10 group-hover:shadow-primary/30 transition-all">
                                {initials}
                            </div>
                            <div className="text-left hidden sm:block">
                                <div className="text-xs font-bold text-foreground leading-none mb-1">{userInfo.fullName}</div>
                                <div className="text-[10px] font-bold text-primary/70 uppercase tracking-tighter leading-none">{userInfo.plan} tier</div>
                            </div>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 p-2 rounded-2xl border-border/40 shadow-2xl mt-2" align="end">
                        <DropdownMenuLabel className="p-3">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-bold text-foreground">{userInfo.fullName}</p>
                                <p className="text-[10px] font-medium text-muted-foreground truncate">{userInfo.email}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/30" />
                        <DropdownMenuItem asChild className="rounded-xl py-3 focus:bg-primary/10 focus:text-primary">
                            <Link href="/dashboard/settings" className="flex items-center cursor-pointer w-full">
                                <Settings className="mr-3 h-4 w-4" />
                                <span className="font-semibold text-sm">Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl py-3 focus:bg-primary/10 focus:text-primary">
                            <Link href="/dashboard/settings" className="flex items-center cursor-pointer w-full">
                                <User className="mr-3 h-4 w-4" />
                                <span className="font-semibold text-sm">Account</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border/30" />
                        <DropdownMenuItem onClick={handleSignOut} className="rounded-xl py-3 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer">
                            <LogOut className="mr-3 h-4 w-4" />
                            <span className="font-semibold text-sm">Sign out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
