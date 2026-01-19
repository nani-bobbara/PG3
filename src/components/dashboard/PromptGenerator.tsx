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
    AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
// import { templates, styles, AI_MODELS, type AIModelId } from "@/config"; // MIGRATED: Styles still static for now
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
    const [selectedModelId, setSelectedModelId] = useState<string>(''); // Dynamic ID
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

    // Update parameters when template changes
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
            toast.error("Please enter a raw concept first");
            return;
        }

        if (!selectedTemplate) {
            toast.error("No template selected");
            return;
        }

        startTransition(async () => {
            const result = await generatePrompt({
                topic: inputPrompt,
                templateId: selectedTemplate.id, // Pass ID to look up structure on server? Or pass structure?
                // For now, let's keep it simple and pass structure, BUT safer to pass ID if we want to rely on DB
                // Let's modify generatePrompt to accept structure directly for now as per previous logic, 
                // but we should pass the dynamic params.
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

    // Render Loading State
    if (isLoadingTemplates || isLoadingModels) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse">Loading configuration...</p>
                </div>
            </div>
        );
    }

    // Render Error State
    if (templatesError || models.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="max-w-md p-6 bg-destructive/10 border border-destructive/20 rounded-lg text-center">
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-destructive mb-2">Configuration Error</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Unable to load templates or models. Has the database migration been applied?
                    </p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    if (!selectedTemplate) return null; // Should be handled by useEffect, but just in case

    return (
        <div className="flex h-full">
            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 lg:pr-80">
                <div className="max-w-4xl mx-auto pb-20">

                    {/* Header Row: Model & Template Selectors */}
                    <div className="flex flex-col md:flex-row gap-4 mb-8">
                        {/* Template Selector */}
                        <div className="relative flex-1">
                            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Template</label>
                            <button
                                onClick={() => setShowTemplates(!showTemplates)}
                                className="w-full flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors h-11"
                            >
                                <div className="flex items-center gap-2 overflow-hidden">
                                    {(() => {
                                        const Icon = iconMap[selectedTemplate.category] || FileText;
                                        return <Icon className="w-4 h-4 text-primary flex-shrink-0" />;
                                    })()}
                                    <span className="font-medium text-foreground text-sm truncate">{selectedTemplate.name}</span>
                                </div>
                                <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showTemplates ? "rotate-180" : ""}`} />
                            </button>

                            {showTemplates && (
                                <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-lg bg-card border border-border shadow-xl z-20 max-h-80 overflow-y-auto">
                                    {templates.map((template) => {
                                        const Icon = iconMap[template.category] || FileText;
                                        return (
                                            <button
                                                key={template.id}
                                                onClick={() => {
                                                    setSelectedTemplate(template);
                                                    setShowTemplates(false);
                                                }}
                                                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${selectedTemplate.id === template.id
                                                    ? "bg-primary/10 text-primary"
                                                    : "hover:bg-secondary text-foreground"
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4 flex-shrink-0" />
                                                <div className="text-left">
                                                    <div className="font-medium text-sm">{template.name}</div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Model Selector */}
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">AI Model</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-full flex items-center justify-between p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors h-11">
                                        <div className="flex items-center gap-2">
                                            <Bot className="w-4 h-4 text-accent" />
                                            <span className="font-medium text-foreground text-sm">{selectedModelConfig?.name || selectedModelId}</span>
                                        </div>
                                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-[200px]" align="end">
                                    {models.map((model) => (
                                        <DropdownMenuItem
                                            key={model.id}
                                            onClick={() => setSelectedModelId(model.model_id)}
                                            className="flex flex-col items-start py-2"
                                        >
                                            <span className="font-medium">{model.name}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    <TooltipProvider>

                        {/* Input Area (Raw Concept) */}
                        <div className="mb-8 p-6 rounded-2xl bg-card/40 border border-border/50 shadow-sm">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="bg-primary/20 p-1.5 rounded-md">
                                    <Wand2 className="w-4 h-4 text-primary" />
                                </div>
                                <h2 className="text-sm font-semibold tracking-wider uppercase text-foreground">Raw Concept</h2>
                            </div>
                            <Textarea
                                placeholder="e.g. A futuristic samurai overlooking a neon Tokyo..."
                                value={inputPrompt}
                                onChange={(e) => setInputPrompt(e.target.value)}
                                className="min-h-[120px] bg-transparent border-none resize-none text-xl md:text-2xl font-medium placeholder:text-muted-foreground/30 focus-visible:ring-0 p-0 leading-relaxed"
                            />
                        </div>

                        {/* Visual Style Blueprints */}
                        <div className="mb-8">
                            <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">Style Blueprints</label>
                            <div className="flex flex-wrap gap-3">
                                {styles.map((style) => (
                                    <Tooltip key={style.id}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={() => setSelectedStyle(style)}
                                                className={`group relative flex items-center gap-3 pl-2 pr-4 py-2 rounded-full border transition-all ${selectedStyle.id === style.id
                                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                                                    : "bg-card border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                                                    }`}
                                            >
                                                <div
                                                    className={`w-6 h-6 rounded-full bg-gradient-to-br ${style.previewColor || 'from-gray-100 to-gray-200'} shadow-sm`}
                                                />
                                                <span className="text-sm font-medium">{style.name}</span>
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{style.description}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                ))}
                            </div>
                        </div>

                        {/* Output Area */}
                        {(outputPrompt || isPending) && (
                            <div className="gradient-border p-[1px] rounded-xl bg-card animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="bg-card rounded-lg overflow-hidden">
                                    <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${isPending ? "bg-primary animate-pulse" : "bg-green-500"}`} />
                                            <span className="text-sm font-medium">Generated Output</span>

                                            {/* View Toggle */}
                                            <div className="flex items-center bg-background rounded-md border border-border p-1 ml-4 shadow-sm">
                                                <button
                                                    onClick={() => setViewMode("text")}
                                                    className={`p-1.5 rounded-sm transition-colors ${viewMode === "text" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                                    title="Plain Text"
                                                >
                                                    <AlignLeft className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    onClick={() => setViewMode("json")}
                                                    className={`p-1.5 rounded-sm transition-colors ${viewMode === "json" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                                                    title="JSON Preview"
                                                >
                                                    <Code className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {outputPrompt && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCopy}
                                                className="text-muted-foreground hover:text-foreground h-8"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="w-4 h-4 mr-1" />
                                                        Copied
                                                    </>
                                                ) : (
                                                    <>
                                                        <Copy className="w-4 h-4 mr-1" />
                                                        Copy
                                                    </>
                                                )}
                                            </Button>
                                        )}
                                    </div>

                                    <div className="p-6 min-h-[150px]">
                                        {isPending ? (
                                            <div className="space-y-3">
                                                <div className="h-4 bg-muted rounded animate-pulse w-full" />
                                                <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
                                                <div className="h-4 bg-muted rounded animate-pulse w-4/5" />
                                                <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                                            </div>
                                        ) : (
                                            <div className="font-mono text-sm leading-relaxed overflow-x-auto">
                                                {viewMode === "json" ? (
                                                    <pre className="text-primary bg-muted/20 p-4 rounded-lg border border-border/50">{JSON.stringify({ prompt: outputPrompt, model: selectedModelId, style: selectedStyle.name, parameters }, null, 2)}</pre>
                                                ) : (
                                                    <p className="whitespace-pre-wrap text-foreground">{outputPrompt}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </TooltipProvider>
                </div>
            </div>

            {/* Right Properties Panel */}
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
