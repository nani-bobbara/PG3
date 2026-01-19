import { Wand2, Layers, Zap, Shield, Sparkles, Bot } from "lucide-react";

const features = [
    {
        icon: Bot,
        title: "Dual AI Intelligence",
        description: "Choose between Gemini Pro and GPT-4 to craft the perfect prompt for your needs.",
    },
    {
        icon: Layers,
        title: "Category Templates",
        description: "Specialized templates for Midjourney, DALL·E, Sora, Runway, and more.",
    },
    {
        icon: Sparkles,
        title: "Visual Styles",
        description: "Apply cinematic, cyberpunk, anime, and other aesthetic styles to your prompts.",
    },
    {
        icon: Wand2,
        title: "Smart Optimization",
        description: "AI analyzes and enhances your prompts for maximum impact and clarity.",
    },
    {
        icon: Zap,
        title: "Instant Results",
        description: "Generate professional-grade prompts in seconds, not hours.",
    },
    {
        icon: Shield,
        title: "Secure BYOK",
        description: "Bring your own API keys with enterprise-grade encryption.",
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="py-24 relative">
            <div className="container mx-auto px-6">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Everything You Need to <span className="gradient-text">Create</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Powerful features designed to help you craft the perfect prompts for any AI platform.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
                        >
                            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                                <feature.icon className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
