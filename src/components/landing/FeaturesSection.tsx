import { Layers, Zap, Palette, Sparkles, Wand2, History, Key, Image } from "lucide-react";

const features = [
    {
        icon: Wand2,
        title: "One-Click Magic",
        description: "Describe your idea in plain English — we'll craft the perfect prompt for stunning AI-generated images.",
    },
    {
        icon: Layers,
        title: "Ready-Made Templates",
        description: "Choose from curated templates for Midjourney, DALL·E, marketing copy, and more. Just fill in the blanks.",
    },
    {
        icon: Palette,
        title: "Style Presets",
        description: "Apply beautiful art styles like Cinematic, Cyberpunk, or Watercolor with a single click.",
    },
    {
        icon: Image,
        title: "Works Everywhere",
        description: "Copy your polished prompts directly into Midjourney, DALL·E, Stable Diffusion, or any AI art tool.",
    },
    {
        icon: History,
        title: "Never Lose a Prompt",
        description: "Your entire prompt history is saved automatically. Find and reuse your best creations anytime.",
    },
    {
        icon: Key,
        title: "Use Your Own Keys",
        description: "Bring your own API keys for unlimited generations. Your keys stay encrypted and private.",
    },
];

export function FeaturesSection() {
    return (
        <section id="how-it-works" className="py-24 md:py-32 relative bg-muted/30 dark:bg-muted/10">
            <div className="container mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16 md:mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Why Creators Love Us</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Everything You Need to <span className="text-primary">Create</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Stop struggling with prompt syntax. Focus on your creative vision — we handle the technical details.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative p-8 rounded-2xl bg-card dark:bg-card/60 border border-border/50 dark:border-border/30 hover:border-primary/40 dark:hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 dark:hover:shadow-primary/10"
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center mb-5 group-hover:bg-primary transition-all duration-300">
                                <feature.icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
