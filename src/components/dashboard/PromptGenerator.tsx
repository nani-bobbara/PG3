"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Wand2,
    ChevronDown,
    Copy,
    Check,
    Loader2,
    Image as ImageIcon,
    Video as VideoIcon,
    FileText,
    Settings,
    Bot,
    Code,
    AlignLeft,
    AlertCircle,
    Sparkles,
    Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { styles } from "@/config";
import { useDynamicConfig } from "@/hooks/use-config";
import { SupportedTemplate } from "@/types/dynamic-config";
import { generatePrompt } from "@/app/actions/generate-prompt";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { PropertiesPanel } from "@/components/dashboard/PropertiesPanel";
import { cn } from "@/lib/utils";

const iconMap: Record<string, any> = {
    'Image': ImageIcon,
    'Video': VideoIcon,
    'Text': FileText,
    'Utility': Settings
};

export function PromptGenerator() {
    const { templates, models, isLoadingTemplates, isLoadingModels, templatesError } = useDynamicConfig();

    // State
    const [selectedTemplate, setSelectedTemplate] = useState<SupportedTemplate | null>(null);
    const [selectedStyle, setSelectedStyle] = useState(styles[0]);
    const [selectedModelId, setSelectedModelId] = useState<string>('');
    const [inputPrompt, setInputPrompt] = useState("");
    const [outputPrompt, setOutputPrompt] = useState("");
    const [parameters, setParameters] = useState<Record<string, any>>({});
    const [copied, setCopied] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);
    const [viewMode, setViewMode] = useState<"text" | "json">("text");
    const [isPending, startTransition] = useTransition();

    // Initialize defaults when data loads
    useEffect(() => {
        if (templates.length > 0 && !selectedTemplate) {
            setSelectedTemplate(templates[0]);
            setParameters(templates[0].default_params || {});
        }
    }, [templates, selectedTemplate]);

    useEffect(() => {
        if (models.length > 0 && !selectedModelId) {
            setSelectedModelId(models[0].model_id);
        }
    }, [models, selectedModelId]);

    useEffect(() => {
        if (selectedTemplate) {
            setParameters(selectedTemplate.default_params || {});
        }
    }, [selectedTemplate?.id]);

    const handleParamChange = (key: string, value: any) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = () => {
        if (!inputPrompt.trim()) {
            toast.error("Enter your concept in the creative canvas");
            return;
        }

        if (!selectedTemplate) {
            toast.error("Select a blueprint first");
            return;
        }

        startTransition(async () => {
            const result = await generatePrompt({
                topic: inputPrompt,
                templateId: selectedTemplate.id,
                templateStructure: selectedTemplate.structure,
                style: selectedStyle.id !== 'none' ? selectedStyle.description : undefined,
                modelId: selectedModelId,
                parameters: parameters,
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                setOutputPrompt(result.content);
            }
        });
    };

    const handleCopy = () => {
        const contentToCopy = viewMode === "json"
            ? JSON.stringify({ prompt: outputPrompt }, null, 2)
            : outputPrompt;

        navigator.clipboard.writeText(contentToCopy);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const selectedModelConfig = models.find(m => m.model_id === selectedModelId);

    if (isLoadingTemplates || isLoadingModels) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground animate-pulse tracking-widest uppercase">Synchronizing Engine...</p>
                </div>
            </div>
        );
    }

    if (templatesError || models.length === 0) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <div className="max-w-md w-full p-8 bg-card border border-border rounded-2xl shadow-2xl text-center">
                    <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-2">Engine Disconnect</h3>
                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        We couldn't synchronize the prompt blueprints. Please ensure your database is active and schema is current.
                    </p>
                    <Button size="lg" variant="outline" className="w-full" onClick={() => window.location.reload()}>Re-Initialize</Button>
                </div>
            </div>
        );
    }

    if (!selectedTemplate) return null;

    return (
        <div className="flex h-full bg-background overflow-hidden">
            {/* Main Content: The Creative Canvas */}
            <div className="flex-1 overflow-y-auto relative lg:pr-80">
                <div className="max-w-4xl mx-auto px-6 py-10 lg:py-16 space-y-12">

                    {/* Centered Selectors */}
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        {/* Blueprint Selector */}
                        <div className="relative">
                            <DropdownMenu open={showTemplates} onOpenChange={setShowTemplates}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" className="h-10 rounded-full pl-4 pr-3 border-border/50 bg-card/50 hover:bg-card">
                                        <div className="flex items-center gap-2">
                                            {(() => {
                                                const Icon = iconMap[selectedTemplate.category] || FileText;
                                                return <Icon className="w-3.5 h-3.5 text-primary" />;
                                            })()}
                                            <span className="text-sm font-bold tracking-tight">{selectedTemplate.name}</span>
                                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-64 p-2" align="center">
                                    <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 mb-1 uppercase tracking-widest">Active Blueprints</div>
                                    {templates.map((template) => {
                                        const Icon = iconMap[template.category] || FileText;
                                        return (
                                            <DropdownMenuItem
                                                key={template.id}
                                                onClick={() => setSelectedTemplate(template)}
                                                className={cn(
                                                    "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                                                    selectedTemplate.id === template.id ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                                )}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span className="font-semibold text-sm">{template.name}</span>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Model Selector */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="h-10 rounded-full pl-4 pr-3 border-border/50 bg-card/50 hover:bg-card">
                                    <div className="flex items-center gap-2">
                                        <Bot className="w-3.5 h-3.5 text-accent" />
                                        <span className="text-sm font-bold tracking-tight">{selectedModelConfig?.name || selectedModelId}</span>
                                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56 p-2" align="center">
                                <div className="text-[10px] font-bold text-muted-foreground px-2 py-1 mb-1 uppercase tracking-widest">Intelligence Layers</div>
                                {models.map((model) => (
                                    <DropdownMenuItem
                                        key={model.id}
                                        onClick={() => setSelectedModelId(model.model_id)}
                                        className={cn(
                                            "flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all",
                                            selectedModelId === model.model_id ? "bg-accent/10 text-accent" : "hover:bg-muted"
                                        )}
                                    >
                                        <Bot className="w-4 h-4" />
                                        <span className="font-semibold text-sm">{model.name}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Creative Canvas: Input */}
                    <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-1000"></div>
                        <div className="relative bg-card rounded-3xl border border-border/50 p-8 shadow-2xl backdrop-blur-sm">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-primary" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Creative Concept</span>
                                </div>
                                <div className="text-[10px] font-medium text-muted-foreground/40">{inputPrompt.length} chars</div>
                            </div>

                            <Textarea
                                placeholder="Describe the soul of your prompt..."
                                value={inputPrompt}
                                onChange={(e) => setInputPrompt(e.target.value)}
                                className="min-h-[160px] bg-transparent border-none resize-none text-2xl md:text-3xl font-bold placeholder:text-muted-foreground/10 focus-visible:ring-0 p-0 leading-tight mb-8"
                            />

                            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-border/30">
                                {/* Compact Styles */}
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mr-2">Signature:</span>
                                    <div className="flex -space-x-2">
                                        {styles.map((style) => (
                                            <TooltipProvider key={style.id}>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => setSelectedStyle(style)}
                                                            className={cn(
                                                                "w-9 h-9 rounded-full border-2 border-card overflow-hidden transition-all hover:translate-y-[-4px] hover:z-10",
                                                                selectedStyle.id === style.id ? "ring-2 ring-primary ring-offset-2 ring-offset-card z-20 scale-110" : "grayscale-[0.5] hover:grayscale-0"
                                                            )}
                                                        >
                                                            <div className={cn("w-full h-full bg-gradient-to-br", style.previewColor || 'from-gray-400 to-gray-600')} />
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent side="bottom" className="text-[10px] font-bold uppercase tracking-widest">
                                                        {style.name}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        ))}
                                    </div>
                                    <span className="text-xs font-bold text-foreground/80 ml-4 hidden sm:inline-block truncate max-w-[100px]">{selectedStyle.name}</span>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={handleGenerate}
                                    disabled={isPending}
                                    className="rounded-2xl px-8 h-14 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 transition-all active:scale-95 group"
                                >
                                    {isPending ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Zap className="w-4 h-4 mr-2 group-hover:animate-pulse" />
                                            Architect
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Output Area: The Result */}
                    {(outputPrompt || isPending) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className={cn("w-1.5 h-1.5 rounded-full", isPending ? "bg-primary animate-pulse" : "bg-green-500")} />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Constructed Prompt</span>
                                </div>

                                <div className="flex items-center gap-2">
                                    <div className="flex items-center bg-muted/40 rounded-lg p-1 border border-border/50">
                                        <button
                                            onClick={() => setViewMode("text")}
                                            className={cn("p-1.5 rounded-md transition-all", viewMode === "text" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            <AlignLeft className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={() => setViewMode("json")}
                                            className={cn("p-1.5 rounded-md transition-all", viewMode === "json" ? "bg-card text-primary shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            <Code className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 rounded-lg text-[10px] font-bold bg-card/50">
                                        {copied ? <Check className="w-3.5 h-3.5 mr-1" /> : <Copy className="w-3.5 h-3.5 mr-1" />}
                                        {copied ? "COPIED" : "COPY"}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-card/30 border border-border/50 rounded-2xl p-6 backdrop-blur-sm min-h-[140px] relative overflow-hidden group">
                                {isPending ? (
                                    <div className="space-y-4">
                                        <div className="h-4 bg-primary/10 rounded-full animate-pulse w-full" />
                                        <div className="h-4 bg-primary/10 rounded-full animate-pulse w-5/6" />
                                        <div className="h-4 bg-primary/10 rounded-full animate-pulse w-2/3" />
                                    </div>
                                ) : (
                                    <div className="font-mono text-base leading-relaxed text-foreground/90 whitespace-pre-wrap selection:bg-primary/20">
                                        {viewMode === "json" ? (
                                            <pre className="text-xs text-primary/80">{JSON.stringify({ prompt: outputPrompt, model: selectedModelId, style: selectedStyle.name, params: parameters }, null, 2)}</pre>
                                        ) : (
                                            outputPrompt
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Sidecar: Properties */}
            <PropertiesPanel
                template={selectedTemplate}
                style={selectedStyle}
                parameters={parameters}
                onParamChange={handleParamChange}
                onGenerate={handleGenerate}
                isPending={isPending}
            />
        </div>
    );
}
