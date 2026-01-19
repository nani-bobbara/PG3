"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    FileText,
    Image as ImageIcon,
    Video as VideoIcon,
    Settings,
    ArrowRight,
    ArrowLeft,
    Sparkles,
    Megaphone,
    Code,
    PenTool,
    Palette,
    ChevronLeft,
    ChevronRight,
    LucideIcon
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Template {
    id: string;
    category: string;
    name: string;
    description: string;
    structure: string;
    min_tier: string;
}

// Category styling configuration with colors
const categoryConfig: Record<string, { 
    icon: LucideIcon; 
    gradient: string; 
    iconColor: string;
    bgColor: string;
    borderColor: string;
    accentGradient: string;
}> = {
    'Image': { 
        icon: ImageIcon, 
        gradient: 'from-violet-500 to-purple-600',
        iconColor: 'text-violet-600 dark:text-violet-400',
        bgColor: 'bg-violet-100 dark:bg-violet-500/20',
        borderColor: 'border-violet-200 dark:border-violet-500/30',
        accentGradient: 'from-violet-500/20 via-purple-500/10 to-transparent'
    },
    'Video': { 
        icon: VideoIcon, 
        gradient: 'from-rose-500 to-pink-600',
        iconColor: 'text-rose-600 dark:text-rose-400',
        bgColor: 'bg-rose-100 dark:bg-rose-500/20',
        borderColor: 'border-rose-200 dark:border-rose-500/30',
        accentGradient: 'from-rose-500/20 via-pink-500/10 to-transparent'
    },
    'Text': { 
        icon: FileText, 
        gradient: 'from-emerald-500 to-teal-600',
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-500/20',
        borderColor: 'border-emerald-200 dark:border-emerald-500/30',
        accentGradient: 'from-emerald-500/20 via-teal-500/10 to-transparent'
    },
    'Utility': { 
        icon: Settings, 
        gradient: 'from-amber-500 to-orange-600',
        iconColor: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-500/20',
        borderColor: 'border-amber-200 dark:border-amber-500/30',
        accentGradient: 'from-amber-500/20 via-orange-500/10 to-transparent'
    },
    'Marketing': { 
        icon: Megaphone, 
        gradient: 'from-blue-500 to-cyan-600',
        iconColor: 'text-blue-600 dark:text-blue-400',
        bgColor: 'bg-blue-100 dark:bg-blue-500/20',
        borderColor: 'border-blue-200 dark:border-blue-500/30',
        accentGradient: 'from-blue-500/20 via-cyan-500/10 to-transparent'
    },
    'Code': { 
        icon: Code, 
        gradient: 'from-slate-500 to-gray-600',
        iconColor: 'text-slate-600 dark:text-slate-400',
        bgColor: 'bg-slate-100 dark:bg-slate-500/20',
        borderColor: 'border-slate-200 dark:border-slate-500/30',
        accentGradient: 'from-slate-500/20 via-gray-500/10 to-transparent'
    },
    'Design': { 
        icon: PenTool, 
        gradient: 'from-fuchsia-500 to-pink-600',
        iconColor: 'text-fuchsia-600 dark:text-fuchsia-400',
        bgColor: 'bg-fuchsia-100 dark:bg-fuchsia-500/20',
        borderColor: 'border-fuchsia-200 dark:border-fuchsia-500/30',
        accentGradient: 'from-fuchsia-500/20 via-pink-500/10 to-transparent'
    },
};

const defaultConfig = {
    icon: Palette,
    gradient: 'from-primary to-primary/80',
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
    borderColor: 'border-primary/20',
    accentGradient: 'from-primary/20 via-primary/10 to-transparent'
};

export function TemplatesSection() {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch templates from database
    useEffect(() => {
        async function fetchTemplates() {
            const supabase = createClient();
            const { data } = await supabase
                .from('supported_templates')
                .select('id, category, name, description, structure, min_tier')
                .eq('is_active', true)
                .limit(6);
            
            if (data) {
                setTemplates(data);
            }
            setIsLoading(false);
        }
        fetchTemplates();
    }, []);

    // Auto-scroll carousel
    useEffect(() => {
        if (isPaused || templates.length === 0) return;
        
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % templates.length);
        }, 4000);

        return () => clearInterval(interval);
    }, [isPaused, templates.length]);

    const goToSlide = useCallback((index: number) => {
        setActiveIndex(index);
    }, []);

    const goToPrev = useCallback(() => {
        setActiveIndex((prev) => (prev - 1 + templates.length) % templates.length);
    }, [templates.length]);

    const goToNext = useCallback(() => {
        setActiveIndex((prev) => (prev + 1) % templates.length);
    }, [templates.length]);

    if (isLoading) {
        return (
            <section className="py-24 md:py-32 relative overflow-hidden">
                <div className="container mx-auto px-6">
                    <div className="h-[500px] flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                </div>
            </section>
        );
    }

    if (templates.length === 0) return null;

    const activeTemplate = templates[activeIndex];
    const config = categoryConfig[activeTemplate.category] || defaultConfig;
    const Icon = config.icon;
    const isPro = activeTemplate.min_tier === 'pro';
    const isBasic = activeTemplate.min_tier === 'basic';

    return (
        <section 
            id="templates" 
            className="py-24 md:py-32 relative overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Dynamic gradient background based on active template */}
            <div className={`absolute inset-0 bg-gradient-to-br ${config.accentGradient} transition-all duration-700 pointer-events-none`} />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background pointer-events-none" />
            
            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-12 md:mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20 mb-6">
                        <Sparkles className="w-4 h-4 text-violet-500" />
                        <span className="text-xs font-semibold text-foreground">Pro Templates</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Start with <span className="bg-gradient-to-r from-violet-500 to-purple-600 bg-clip-text text-transparent">Expert Templates</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Professionally crafted prompts for every creative need. Just add your idea.
                    </p>
                </div>

                {/* Hero Carousel */}
                <div className="max-w-5xl mx-auto">
                    <div className="relative">
                        {/* Main Carousel Card */}
                        <div 
                            key={activeTemplate.id}
                            className="relative rounded-3xl bg-card dark:bg-card/80 border border-border/40 overflow-hidden shadow-2xl shadow-primary/5 transition-all duration-500"
                        >
                            {/* Gradient accent bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.gradient}`} />
                            
                            <div className="grid md:grid-cols-2 gap-0">
                                {/* Left side - Template Info */}
                                <div className="p-8 md:p-12 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 mb-6">
                                        {/* Colorful icon */}
                                        <div className={`w-14 h-14 rounded-2xl ${config.bgColor} ${config.borderColor} border flex items-center justify-center`}>
                                            <Icon className={`w-7 h-7 ${config.iconColor}`} />
                                        </div>
                                        
                                        {/* Category & tier badges */}
                                        <div className="flex flex-col gap-1">
                                            <span className={`text-xs font-semibold px-3 py-1 rounded-full w-fit ${config.bgColor} ${config.iconColor}`}>
                                                {activeTemplate.category}
                                            </span>
                                            {(isPro || isBasic) && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full w-fit ${
                                                    isPro 
                                                        ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                                                        : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                                }`}>
                                                    {isPro ? 'PRO' : 'BASIC'}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="text-2xl md:text-3xl font-bold mb-4 transition-all duration-500">
                                        {activeTemplate.name}
                                    </h3>
                                    <p className="text-muted-foreground text-base md:text-lg mb-8 leading-relaxed">
                                        {activeTemplate.description}
                                    </p>

                                    <Button size="lg" asChild className={`rounded-full px-8 w-fit bg-gradient-to-r ${config.gradient} hover:opacity-90 text-white font-semibold shadow-lg transition-all`}>
                                        <Link href="/auth" className="flex items-center gap-2">
                                            Try This Template
                                            <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </Button>
                                </div>

                                {/* Right side - Code Preview */}
                                <div className="p-8 md:p-12 bg-muted/30 dark:bg-muted/10 flex items-center">
                                    <div className="w-full">
                                        <div className="flex items-center gap-2 mb-4">
                                            <div className="flex gap-1.5">
                                                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                                                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                                                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                                            </div>
                                            <span className="text-xs text-muted-foreground ml-2 font-mono">template.prompt</span>
                                        </div>
                                        <pre className="text-xs md:text-sm font-mono bg-background/80 dark:bg-background/40 p-6 rounded-xl border border-border/30 text-muted-foreground overflow-hidden max-h-[200px] whitespace-pre-wrap leading-relaxed">
                                            {activeTemplate.structure.substring(0, 300)}
                                            {activeTemplate.structure.length > 300 && '...'}
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Navigation Arrows */}
                        <button
                            onClick={goToPrev}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 w-12 h-12 rounded-full bg-card dark:bg-card/90 border border-border/50 dark:border-border/30 shadow-lg dark:shadow-xl flex items-center justify-center hover:scale-110 hover:border-primary/30 transition-all"
                            aria-label="Previous template"
                        >
                            <ChevronLeft className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        </button>
                        <button
                            onClick={goToNext}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 w-12 h-12 rounded-full bg-card dark:bg-card/90 border border-border/50 dark:border-border/30 shadow-lg dark:shadow-xl flex items-center justify-center hover:scale-110 hover:border-primary/30 transition-all"
                            aria-label="Next template"
                        >
                            <ChevronRight className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
                        </button>
                    </div>

                    {/* Carousel Indicators */}
                    <div className="flex items-center justify-center gap-2 mt-8">
                        {templates.map((template, index) => {
                            const dotConfig = categoryConfig[template.category] || defaultConfig;
                            return (
                                <button
                                    key={template.id}
                                    onClick={() => goToSlide(index)}
                                    className={`group relative h-2 rounded-full transition-all duration-300 ${
                                        index === activeIndex 
                                            ? 'w-8' 
                                            : 'w-2 hover:w-4'
                                    }`}
                                    aria-label={`Go to ${template.name}`}
                                >
                                    <div className={`absolute inset-0 rounded-full transition-all duration-300 ${
                                        index === activeIndex 
                                            ? `bg-gradient-to-r ${dotConfig.gradient}` 
                                            : 'bg-muted-foreground/20 dark:bg-muted-foreground/30 group-hover:bg-muted-foreground/40 dark:group-hover:bg-muted-foreground/50'
                                    }`} />
                                </button>
                            );
                        })}
                    </div>

                    {/* Template Thumbnails */}
                    <div className="flex items-center justify-center gap-3 mt-8 flex-wrap">
                        {templates.map((template, index) => {
                            const thumbConfig = categoryConfig[template.category] || defaultConfig;
                            const ThumbIcon = thumbConfig.icon;
                            return (
                                <button
                                    key={template.id}
                                    onClick={() => goToSlide(index)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
                                        index === activeIndex 
                                            ? `${thumbConfig.bgColor} ${thumbConfig.borderColor} border-2` 
                                            : 'bg-card/50 dark:bg-card/40 border-border/40 dark:border-border/30 hover:border-border dark:hover:border-border/60 hover:bg-muted/50 dark:hover:bg-muted/30'
                                    }`}
                                >
                                    <ThumbIcon className={`w-4 h-4 ${index === activeIndex ? thumbConfig.iconColor : 'text-muted-foreground'}`} />
                                    <span className={`text-xs font-medium ${index === activeIndex ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {template.name.split(' ')[0]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-14 text-center">
                    <Button variant="outline" size="lg" asChild className="rounded-full px-8 border-border/60 dark:border-border/40 hover:border-primary/40 dark:hover:border-primary/50 hover:bg-muted/50 dark:hover:bg-muted/30">
                        <Link href="/auth" className="flex items-center gap-2">
                            Explore All Templates
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </div>
        </section>
    );
}
