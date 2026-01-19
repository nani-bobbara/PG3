import Link from "next/link";
import { Sparkles, ArrowRight, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
    return (
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">AI-Powered Prompt Engineering</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight">
                        Transform Ideas into
                        <br />
                        <span className="gradient-text">Perfect Prompts</span>
                    </h1>

                    {/* Subheadline */}
                    <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                        Generate optimized prompts for Midjourney, DALL·E, Sora, and more.
                        Unlock your creative potential with AI-powered prompt engineering.
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" asChild className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 h-14">
                            <Link href="/auth">
                                <Wand2 className="w-5 h-5 mr-2" />
                                Start Creating Free
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="text-lg px-8 h-14">
                            <a href="#features">
                                See How It Works
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
