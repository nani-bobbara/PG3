"use client";

import Link from "next/link";
import { Sparkles, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/30">
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary/30 transition-all">
                            <Sparkles className="w-5 h-5 text-primary-foreground" />
                        </div>
                        <span className="text-xl font-bold text-foreground">PromptGen</span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
                            Features
                        </a>
                        <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                            Pricing
                        </a>
                    </div>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-3">
                        <Button variant="ghost" asChild>
                            <Link href="/auth">Sign In</Link>
                        </Button>
                        <Button asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                            <Link href="/auth">Get Started Free</Link>
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-foreground"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>

                {/* Mobile Menu */}
                {isOpen && (
                    <div className="md:hidden mt-4 pb-4 space-y-4">
                        <a href="#features" className="block text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                            Features
                        </a>
                        <a href="#pricing" className="block text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>
                            Pricing
                        </a>
                        <div className="flex flex-col gap-2 pt-4 border-t border-border">
                            <Button variant="ghost" asChild>
                                <Link href="/auth">Sign In</Link>
                            </Button>
                            <Button asChild className="bg-gradient-to-r from-primary to-accent">
                                <Link href="/auth">Get Started Free</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
