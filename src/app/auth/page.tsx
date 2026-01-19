"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap, Loader2, Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { BRANDING } from "@/config";

const benefits = [
    "50 free AI prompts every month",
    "Access to all starter templates",
    "Works with Midjourney, DALL·E & more",
    "No credit card required",
];

export default function AuthPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");

    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { full_name: fullName },
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                    },
                });
                if (error) throw error;
                toast.success("Check your email to confirm your account!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/dashboard");
                router.refresh();
            }
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Something went wrong";
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/dashboard`,
            },
        });
        if (error) toast.error(error.message);
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Panel - Branding & Benefits */}
            <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-primary/5 via-background to-accent/5 dark:from-primary/10 dark:via-background dark:to-accent/10">
                {/* Decorative elements */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-1/4 -left-20 w-[400px] h-[400px] bg-primary/10 dark:bg-primary/20 rounded-full blur-[100px]" />
                    <div className="absolute bottom-1/4 right-0 w-[300px] h-[300px] bg-accent/10 dark:bg-accent/20 rounded-full blur-[80px]" />
                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
                </div>

                <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 py-12">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3 mb-16">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-xl shadow-primary/25">
                            <Zap className="w-6 h-6 text-primary-foreground fill-current" />
                        </div>
                        <span className="text-2xl font-black tracking-tight text-foreground">
                            {BRANDING.logo.text.slice(0, -BRANDING.logo.highlight.length)}
                            <span className="text-primary">{BRANDING.logo.highlight}</span>
                        </span>
                    </Link>

                    {/* Main headline */}
                    <div className="mb-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 dark:bg-primary/20 border border-primary/20 mb-6">
                            <Sparkles className="w-3.5 h-3.5 text-primary" />
                            <span className="text-xs font-semibold text-primary">Start creating in seconds</span>
                        </div>
                        <h1 className="text-4xl xl:text-5xl font-bold tracking-tight text-foreground mb-4 leading-tight">
                            Turn ideas into<br />
                            <span className="bg-gradient-to-r from-primary via-violet-500 to-accent bg-clip-text text-transparent">stunning AI prompts</span>
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-md">
                            Join thousands of creators using Promptify to generate professional prompts for Midjourney, DALL·E, and more.
                        </p>
                    </div>

                    {/* Benefits list */}
                    <div className="space-y-4 mb-12">
                        {benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="w-6 h-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-foreground">{benefit}</span>
                            </div>
                        ))}
                    </div>

                    {/* Social proof */}
                    <div className="flex items-center gap-4 pt-8 border-t border-border/30">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-accent/30 border-2 border-background flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5 text-primary/60" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Loved by 1,000+ creators</p>
                            <p className="text-xs text-muted-foreground">Join the community today</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Auth Form */}
            <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12 bg-background relative">
                {/* Mobile background effects */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden lg:hidden">
                    <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-accent/5 dark:bg-accent/10 rounded-full blur-[80px]" />
                </div>

                <div className="w-full max-w-[400px] relative z-10">
                    {/* Mobile Logo */}
                    <Link href="/" className="flex lg:hidden items-center justify-center gap-3 mb-10">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center shadow-lg shadow-primary/20">
                            <Zap className="w-5 h-5 text-primary-foreground fill-current" />
                        </div>
                        <span className="text-xl font-black tracking-tight text-foreground">
                            {BRANDING.logo.text.slice(0, -BRANDING.logo.highlight.length)}
                            <span className="text-primary">{BRANDING.logo.highlight}</span>
                        </span>
                    </Link>

                    {/* Auth Card */}
                    <div className="bg-card dark:bg-card/60 border border-border/50 dark:border-border/30 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl dark:shadow-primary/5">
                        <div className="text-center mb-6">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mb-1">
                                {isSignUp ? "Create your account" : "Welcome back"}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {isSignUp ? "Start creating amazing AI prompts" : "Sign in to continue"}
                            </p>
                        </div>

                        {/* Google Sign In */}
                        <Button
                            variant="outline"
                            className="w-full h-11 rounded-xl mb-5 border-border/50 dark:border-border/30 hover:bg-muted/50 dark:hover:bg-muted/30 hover:border-primary/30 font-medium transition-all"
                            onClick={handleGoogleSignIn}
                        >
                            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="relative mb-5">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-border/40 dark:border-border/30" />
                            </div>
                            <div className="relative flex justify-center text-xs text-muted-foreground">
                                <span className="bg-card dark:bg-transparent px-3">or</span>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-3">
                            {isSignUp && (
                                <div className="space-y-1.5">
                                    <Label htmlFor="fullName" className="text-xs font-medium text-foreground">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={fullName}
                                        onChange={(e) => setFullName(e.target.value)}
                                        placeholder="John Doe"
                                        required={isSignUp}
                                        className="h-10 rounded-lg bg-muted/30 dark:bg-muted/20 border-border/40 dark:border-border/30 focus:border-primary/50 text-sm"
                                    />
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <Label htmlFor="email" className="text-xs font-medium text-foreground">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    required
                                    className="h-10 rounded-lg bg-muted/30 dark:bg-muted/20 border-border/40 dark:border-border/30 focus:border-primary/50 text-sm"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password" className="text-xs font-medium text-foreground">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className="h-10 rounded-lg bg-muted/30 dark:bg-muted/20 border-border/40 dark:border-border/30 focus:border-primary/50 text-sm"
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full h-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md shadow-primary/20 transition-all hover:shadow-lg hover:shadow-primary/25 active:scale-[0.98] mt-1 group text-sm"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        {isSignUp ? "Create Account" : "Sign In"}
                                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-5 text-center">
                            <p className="text-sm text-muted-foreground">
                                {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
                                <button
                                    onClick={() => setIsSignUp(!isSignUp)}
                                    className="text-primary font-semibold hover:underline underline-offset-2"
                                >
                                    {isSignUp ? "Sign in" : "Sign up"}
                                </button>
                            </p>
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        By continuing, you agree to our{" "}
                        <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Terms of Service</a>
                        {" "}and{" "}
                        <a href="#" className="underline underline-offset-2 hover:text-foreground transition-colors">Privacy Policy</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
