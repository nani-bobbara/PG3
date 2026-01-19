import { templates } from "@/config/templates";
import { Template } from "@/config";
import {
    FileText,
    Image as ImageIcon,
    Video as VideoIcon,
    Settings,
    ArrowRight
} from "lucide-react";

const localIconMap: Record<string, any> = {
    'Image': ImageIcon,
    'Video': VideoIcon,
    'Text': FileText,
    'Utility': Settings
};

export function TemplatesSection() {
    return (
        <section id="templates" className="py-24 bg-secondary/30">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Curated <span className="gradient-text">Templates</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Jumpstart your creativity with optimized structures for every use case.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {templates.slice(0, 6).map((template) => {
                        const Icon = localIconMap[template.category] || FileText;
                        return (
                            <div
                                key={template.id}
                                className="group p-6 rounded-xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <Icon className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground border border-border">
                                        {template.category}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold mb-2">{template.name}</h3>
                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                    {template.description}
                                </p>

                                <div className="text-xs font-mono bg-muted p-3 rounded-md border border-border text-muted-foreground/70 truncate group-hover:text-muted-foreground transition-colors">
                                    {template.structure}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <a href="/auth" className="inline-flex items-center text-primary hover:underline font-medium">
                        View all templates <ArrowRight className="w-4 h-4 ml-1" />
                    </a>
                </div>
            </div>
        </section>
    );
}
