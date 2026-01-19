"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { 
    Zap, 
    ArrowRight, 
    Sparkles, 
    Wand2, 
    Image as ImageIcon, 
    Layers, 
    Clock, 
    Palette,
    ChevronLeft,
    ChevronRight,
    LucideIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSlide {
    id: number;
    badge: string;
    badgeIcon: LucideIcon;
    headline: string;
    highlightedText: string;
    description: string;
    gradient: string;
    accentGradient: string;
}

const heroSlides: HeroSlide[] = [
    {
        id: 1,
        badge: "AI-Powered Prompt Studio",
        badgeIcon: Wand2,
        headline: "Create Better AI Art",
        highlightedText: "In Seconds",
        description: "Turn simple ideas into stunning prompts for Midjourney, DALL·E, and more. No prompt engineering skills needed.",
        gradient: "from-primary via-violet-500 to-primary",
        accentGradient: "from-primary/10 to-violet-500/10"
    },
    {
        id: 2,
        badge: "Expert Templates",
        badgeIcon: Layers,
        headline: "Pro-Level Prompts",
        highlightedText: "One Click Away",
        description: "Choose from professionally crafted templates for photography, illustration, 3D art, and more. Just add your idea.",
        gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
        accentGradient: "from-violet-500/10 to-purple-500/10"
    },
    {
        id: 3,
        badge: "Speed & Precision",
        badgeIcon: Clock,
        headline: "From Concept to Prompt",
        highlightedText: "In 10 Seconds",
        description: "Stop spending hours tweaking prompts. Our AI understands what makes images stunning and does the work for you.",
        gradient: "from-emerald-500 via-teal-500 to-cyan-500",
        accentGradient: "from-emerald-500/10 to-teal-500/10"
    },
    {
        id: 4,
        badge: "Any Style, Any Platform",
        badgeIcon: Palette,
        headline: "Unlimited Creative",
        highlightedText: "Possibilities",
        description: "Cyberpunk, watercolor, cinematic, minimalist — master every visual style across Midjourney, DALL·E, and Stable Diffusion.",
        gradient: "from-rose-500 via-pink-500 to-orange-500",
        accentGradient: "from-rose-500/10 to-pink-500/10"
    }
];

export function HeroSection() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);

    // Auto-rotate slides
    useEffect(() => {
        if (isPaused) return;
        
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % heroSlides.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [isPaused]);

    const goToSlide = useCallback((index: number) => {
        setActiveIndex(index);
    }, []);

    const goToPrev = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    }, []);

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % heroSlides.length);
    }, []);

    const activeSlide = heroSlides[activeIndex];
    const BadgeIcon = activeSlide.badgeIcon;

    return (
        <section 
            className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-16 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Dynamic Ambient Background */}
            <div className="absolute inset-0 pointer-events-none transition-all duration-1000">
                <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-gradient-to-br ${activeSlide.accentGradient} rounded-full blur-[120px] animate-pulse`} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-gradient-to-br ${activeSlide.accentGradient} rounded-full blur-[120px] animate-pulse delay-1000`} />
            </div>

            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Animated Badge */}
                    <div 
                        key={`badge-${activeSlide.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 dark:bg-primary/15 border border-primary/20 mb-8 animate-in fade-in slide-in-from-top-4 duration-500"
                    >
                        <BadgeIcon className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">{activeSlide.badge}</span>
                    </div>

                    {/* Animated Headline */}
                    <h1 
                        key={`headline-${activeSlide.id}`}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        {activeSlide.headline} <br />
                        <span className={`bg-gradient-to-r ${activeSlide.gradient} bg-clip-text text-transparent`}>
                            {activeSlide.highlightedText}
                        </span>
                    </h1>

                    {/* Animated Description */}
                    <p 
                        key={`desc-${activeSlide.id}`}
                        className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500"
                    >
                        {activeSlide.description}
                    </p>

                    {/* Social Proof - Static */}
                    <div className="flex items-center justify-center gap-6 mb-10">
                        <div className="flex -space-x-2">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-violet-500/20 border-2 border-background flex items-center justify-center">
                                    <Sparkles className="w-3 h-3 text-primary/60" />
                                </div>
                            ))}
                        </div>
                        <p className="text-sm text-muted-foreground">
                            <strong className="text-foreground">1,000+</strong> creators already using Promptify
                        </p>
                    </div>

                    {/* CTAs - Static */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button size="lg" asChild className="rounded-full px-8 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:scale-105 hover:shadow-xl hover:shadow-primary/30 active:scale-95 group">
                            <Link href="/auth">
                                <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                                Start Creating — It&apos;s Free
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild className="rounded-full px-8 h-14 text-base font-semibold border-border/60 hover:bg-muted/50 hover:border-primary/30">
                            <a href="#how-it-works" className="flex items-center">
                                See How It Works
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </a>
                        </Button>
                    </div>

                    {/* Carousel Indicators */}
                    <div className="flex items-center justify-center gap-3 mt-12">
                        {/* Prev Arrow */}
                        <button
                            onClick={goToPrev}
                            className="w-8 h-8 rounded-full bg-card dark:bg-card/80 hover:bg-muted dark:hover:bg-muted/50 border border-border/50 dark:border-border/30 flex items-center justify-center transition-all hover:scale-110 hover:border-primary/30 shadow-sm"
                            aria-label="Previous slide"
                        >
                            <ChevronLeft className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>

                        {/* Dots */}
                        <div className="flex items-center gap-2">
                            {heroSlides.map((slide, index) => (
                                <button
                                    key={slide.id}
                                    onClick={() => goToSlide(index)}
                                    className={`relative h-2 rounded-full transition-all duration-300 ${
                                        index === activeIndex 
                                            ? 'w-10' 
                                            : 'w-2 hover:w-4'
                                    }`}
                                    aria-label={`Go to slide ${index + 1}`}
                                >
                                    <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
                                        index === activeIndex 
                                            ? `bg-gradient-to-r ${slide.gradient}` 
                                            : 'bg-muted-foreground/20 dark:bg-muted-foreground/30 hover:bg-muted-foreground/40 dark:hover:bg-muted-foreground/50'
                                    }`} />
                                </button>
                            ))}
                        </div>

                        {/* Next Arrow */}
                        <button
                            onClick={goToNext}
                            className="w-8 h-8 rounded-full bg-card dark:bg-card/80 hover:bg-muted dark:hover:bg-muted/50 border border-border/50 dark:border-border/30 flex items-center justify-center transition-all hover:scale-110 hover:border-primary/30 shadow-sm"
                            aria-label="Next slide"
                        >
                            <ChevronRight className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                        </button>
                    </div>

                    {/* Trust indicators */}
                    <p className="mt-8 text-xs text-muted-foreground">
                        ✓ No credit card required · ✓ 50 free prompts/month · ✓ Works with any AI image tool
                    </p>
                </div>
            </div>
        </section>
    );
}
