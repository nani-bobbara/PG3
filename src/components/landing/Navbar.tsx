"use client";

import Link from "next/link";
import { Zap, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRANDING } from "@/config";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 dark:bg-background/90 backdrop-blur-lg border-b border-border/40">
            <div className="container mx-auto px-6 py-3">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                            <Zap className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="text-lg font-bold text-foreground">
                            {BRANDING.logo.text.slice(0, -BRANDING.logo.highlight.length)}
                            <span className="text-primary">{BRANDING.logo.highlight}</span>
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#how-it-works" className="text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors">
                            Features
                        </a>
                        <a href="#templates" className="text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors">
                            Templates
                        </a>
                        <a href="#pricing" className="text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-foreground transition-colors">
                            Pricing
                        </a>
                    </div>

                    {/* Desktop CTA & Theme */}
                    <div className="hidden md:flex items-center gap-3">
                        <ThemeToggle />
                        <Button variant="ghost" asChild className="font-medium">
                            <Link href="/auth">Sign In</Link>
                        </Button>
                        <Button asChild className="rounded-full px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium">
                            <Link href="/auth">Get Started Free</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button & Theme */}
                    <div className="flex items-center gap-2 md:hidden">
                        <ThemeToggle />
                        <button
                            className="text-foreground p-2"
                            onClick={() => setIsOpen(!isOpen)}
                        >
                            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <a href="#how-it-works" className="block text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-foreground py-2 transition-colors" onClick={() => setIsOpen(false)}>
                            Features
                        </a>
                        <a href="#templates" className="block text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-foreground py-2 transition-colors" onClick={() => setIsOpen(false)}>
                            Templates
                        </a>
                        <a href="#pricing" className="block text-sm font-medium text-muted-foreground hover:text-foreground dark:hover:text-foreground py-2 transition-colors" onClick={() => setIsOpen(false)}>
                            Pricing
                        </a>
                        <div className="flex flex-col gap-2 pt-4 border-t border-border/40 dark:border-border/30">
                            <Button variant="ghost" asChild className="w-full font-medium hover:bg-muted/50 dark:hover:bg-muted/30">
                                <Link href="/auth">Sign In</Link>
                            </Button>
                            <Button asChild className="w-full rounded-full bg-primary hover:bg-primary/90 font-medium">
                                <Link href="/auth">Get Started Free</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
