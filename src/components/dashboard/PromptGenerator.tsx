"use client";

import { useState, useTransition } from "react";
import { styles } from "@/config";
import { useDynamicConfig } from "@/hooks/use-config";
import { SupportedTemplate, SupportedAIModel } from "@/types/dynamic-config";
import { generatePrompt } from "@/app/actions/generate-prompt";
import { toast } from "sonner";
import { 
    Loader2, 
    Copy, 
    Check, 
    Sparkles,
    ImageIcon,
    FileText,
    Settings as SettingsIcon,
    VideoIcon,
    HelpCircle,
    Code,
    AlignLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import { ParameterSchema } from "@/types/dynamic-config";
import { LucideIcon } from "lucide-react";

interface PromptGeneratorProps {
    initialTemplates: SupportedTemplate[];
    initialModels: SupportedAIModel[];
}

const categoryIcons: Record<string, LucideIcon> = {
    'Image': ImageIcon,
    'Video': VideoIcon,
    'Text': FileText,
    'Utility': SettingsIcon
};

export function PromptGenerator({ initialTemplates, initialModels }: PromptGeneratorProps) {
    const { templates, models } = useDynamicConfig({
        initialTemplates,
        initialModels
    });

    // State
    const [selectedTemplate, setSelectedTemplate] = useState<SupportedTemplate | null>(initialTemplates[0] || null);
    const [selectedStyle, setSelectedStyle] = useState(styles[0]);
    const [selectedModelId, setSelectedModelId] = useState<string>(initialModels[0]?.model_id || '');
    const [inputPrompt, setInputPrompt] = useState("");
    const [outputPrompt, setOutputPrompt] = useState("");
    const [parameters, setParameters] = useState<Record<string, unknown>>(initialTemplates[0]?.default_params || {});
    const [inputCopied, setInputCopied] = useState(false);
    const [outputCopied, setOutputCopied] = useState(false);
    const [viewMode, setViewMode] = useState<"text" | "json">("text");
    const [isPending, startTransition] = useTransition();

    const handleTemplateSelect = (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(template);
            setParameters(template.default_params || {});
        }
    };

    const handleParamChange = (key: string, value: unknown) => {
        setParameters(prev => ({ ...prev, [key]: value }));
    };

    const handleGenerate = () => {
        if (!inputPrompt.trim()) {
            toast.error("Please describe what you want to create");
            return;
        }
        if (!selectedTemplate) {
            toast.error("Please select a template");
            return;
        }

        startTransition(async () => {
            const result = await generatePrompt({
                topic: inputPrompt,
                templateId: selectedTemplate.id,
                templateStructure: selectedTemplate.structure,
                style: selectedStyle.name,
                modelId: selectedModelId,
                parameters
            });

            if (result.error) {
                toast.error(result.error);
            } else {
                setOutputPrompt(result.content);
                toast.success("Prompt generated successfully!");
            }
        });
    };

    const handleCopyInput = () => {
        navigator.clipboard.writeText(inputPrompt);
        setInputCopied(true);
        setTimeout(() => setInputCopied(false), 2000);
        toast.success("Input copied to clipboard");
    };

    const handleCopyOutput = () => {
        const textToCopy = viewMode === "json" 
            ? JSON.stringify({ prompt: outputPrompt, template: selectedTemplate?.name, style: selectedStyle.name, timestamp: new Date().toISOString() }, null, 2)
            : outputPrompt;
        navigator.clipboard.writeText(textToCopy);
        setOutputCopied(true);
        setTimeout(() => setOutputCopied(false), 2000);
        toast.success("Output copied to clipboard");
    };

    const renderControl = (schema: ParameterSchema) => {
        switch (schema.type) {
            case 'select':
                return (
                    <div key={schema.key} className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                            {schema.label}
                        </Label>
                        <Select
                            value={String(parameters[schema.key] || '')}
                            onValueChange={(val) => handleParamChange(schema.key, val)}
                        >
                            <SelectTrigger className="h-9 bg-muted/50 border-border">
                                <SelectValue placeholder={`Select ${schema.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {schema.options?.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                );
            case 'slider':
                return (
                    <div key={schema.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-medium text-muted-foreground">
                                {schema.label}
                            </Label>
                            <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded">
                                {String(parameters[schema.key] ?? schema.min ?? 0)}
                            </span>
                        </div>
                        <Slider
                            value={[Number(parameters[schema.key] || schema.min || 0)]}
                            min={schema.min}
                            max={schema.max}
                            step={schema.step}
                            onValueChange={(vals) => handleParamChange(schema.key, vals[0])}
                        />
                        {schema.description && (
                            <p className="text-[10px] text-muted-foreground">{schema.description}</p>
                        )}
                    </div>
                );
            default:
                return (
                    <div key={schema.key} className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground">
                            {schema.label}
                        </Label>
                        <Input
                            placeholder={schema.placeholder}
                            value={String(parameters[schema.key] ?? '')}
                            onChange={(e) => handleParamChange(schema.key, e.target.value)}
                            className="h-9 bg-muted/50 border-border"
                        />
                    </div>
                );
        }
    };

    const CategoryIcon = selectedTemplate ? (categoryIcons[selectedTemplate.category] || FileText) : FileText;

    return (
        <div className="h-full flex flex-col lg:flex-row">
            {/* Left Panel - Configuration */}
            <div className="w-full lg:w-80 border-b lg:border-b-0 lg:border-r border-border bg-muted/30 flex-shrink-0 lg:overflow-y-auto">
                <div className="p-4 space-y-6 pb-8">
                        {/* Template Selection */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-sm font-semibold text-foreground">Template</Label>
                                {selectedTemplate?.help_text && (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6">
                                                <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden">
                                            <DialogHeader>
                                                <DialogTitle>{selectedTemplate.name} Guide</DialogTitle>
                                                <DialogDescription>Tips for getting the best results</DialogDescription>
                                            </DialogHeader>
                                            <ScrollArea className="max-h-[50vh] pr-4">
                                                <div className="prose prose-sm dark:prose-invert">
                                                    <ReactMarkdown>{selectedTemplate.help_text}</ReactMarkdown>
                                                </div>
                                            </ScrollArea>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            <Select
                                value={selectedTemplate?.id || ''}
                                onValueChange={handleTemplateSelect}
                            >
                                <SelectTrigger className="h-11 bg-background border-border">
                                    <div className="flex items-center gap-2">
                                        <CategoryIcon className="w-4 h-4 text-primary" />
                                        <SelectValue placeholder="Choose a template" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((template) => {
                                        const Icon = categoryIcons[template.category] || FileText;
                                        return (
                                            <SelectItem key={template.id} value={template.id}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="w-4 h-4 text-muted-foreground" />
                                                    <span>{template.name}</span>
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                            {selectedTemplate && (
                                <p className="text-xs text-muted-foreground">{selectedTemplate.description}</p>
                            )}
                        </div>

                        {/* AI Model Selection */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-foreground">AI Model</Label>
                            <Select value={selectedModelId} onValueChange={setSelectedModelId}>
                                <SelectTrigger className="h-11 bg-background border-border">
                                    <SelectValue placeholder="Choose AI model" />
                                </SelectTrigger>
                                <SelectContent>
                                    {models.map((model) => (
                                        <SelectItem key={model.model_id} value={model.model_id}>
                                            <div className="flex flex-col">
                                                <span>{model.name}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Visual Style */}
                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-foreground">Visual Style</Label>
                            <TooltipProvider>
                                <div className="flex flex-wrap gap-2">
                                    {styles.map((style) => (
                                        <Tooltip key={style.id}>
                                            <TooltipTrigger asChild>
                                                <button
                                                    onClick={() => setSelectedStyle(style)}
                                                    className={cn(
                                                        "w-8 h-8 rounded-lg transition-all border-2",
                                                        style.previewColor ? `bg-gradient-to-br ${style.previewColor}` : "bg-muted",
                                                        selectedStyle.id === style.id
                                                            ? "border-primary ring-2 ring-primary/20 scale-110"
                                                            : "border-transparent hover:border-border hover:scale-105"
                                                    )}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                <p className="font-medium">{style.name}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </div>
                            </TooltipProvider>
                            <p className="text-xs text-muted-foreground">
                                Selected: <span className="font-medium text-foreground">{selectedStyle.name}</span>
                            </p>
                        </div>

                        {/* Template Parameters */}
                        {selectedTemplate?.param_schema && selectedTemplate.param_schema.length > 0 && (
                            <div className="space-y-4 pt-4 border-t border-border">
                                <Label className="text-sm font-semibold text-foreground">Parameters</Label>
                                <div className="space-y-4">
                                    {selectedTemplate.param_schema.map(schema => renderControl(schema))}
                                </div>
                            </div>
                        )}
                    </div>
            </div>

            {/* Center Panel - Input & Output */}
            <div className="flex-1 flex flex-col min-w-0 lg:overflow-y-auto">
                {/* Input Section */}
                <div className="flex-1 p-6 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <Label className="text-sm font-semibold text-foreground">Describe Your Idea</Label>
                            <p className="text-xs text-muted-foreground mt-1">
                                Be specific about what you want. The more detail, the better the result.
                            </p>
                        </div>
                        {inputPrompt.trim() && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCopyInput}
                                className="gap-1.5 text-muted-foreground hover:text-foreground"
                            >
                                {inputCopied ? (
                                    <>
                                        <Check className="w-3.5 h-3.5" />
                                        Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="w-3.5 h-3.5" />
                                        Copy
                                    </>
                                )}
                            </Button>
                        )}
                    </div>
                    
                    <div className="flex-1 min-h-[200px] relative">
                        <Textarea
                            placeholder="Example: A majestic dragon flying over a medieval castle at sunset, with dramatic lighting and epic atmosphere..."
                            value={inputPrompt}
                            onChange={(e) => setInputPrompt(e.target.value)}
                            className="h-full min-h-[200px] resize-none bg-background border-border text-base"
                        />
                    </div>

                    {/* Generate Button */}
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                            {inputPrompt.length > 0 && `${inputPrompt.length} characters`}
                        </p>
                        <Button
                            size="lg"
                            disabled={isPending || !inputPrompt.trim()}
                            onClick={handleGenerate}
                            className="gap-2"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Prompt
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Output Section */}
                {outputPrompt && (
                    <div className="border-t border-border bg-muted/20 p-6">
                        <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-semibold text-foreground">Generated Prompt</Label>
                            <div className="flex items-center gap-2">
                                {/* View Mode Toggle */}
                                <div className="flex items-center rounded-lg border border-border bg-background p-0.5">
                                    <button
                                        onClick={() => setViewMode("text")}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                                            viewMode === "text"
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <AlignLeft className="w-3 h-3" />
                                        Text
                                    </button>
                                    <button
                                        onClick={() => setViewMode("json")}
                                        className={cn(
                                            "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors",
                                            viewMode === "json"
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:text-foreground"
                                        )}
                                    >
                                        <Code className="w-3 h-3" />
                                        JSON
                                    </button>
                                </div>
                                
                                {/* Copy Button */}
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleCopyOutput}
                                    className="gap-1.5"
                                >
                                    {outputCopied ? (
                                        <>
                                            <Check className="w-3.5 h-3.5" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            Copy
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                        <div className="bg-background border border-border rounded-lg p-4 max-h-[300px] overflow-y-auto">
                            {viewMode === "json" ? (
                                <pre className="text-xs font-mono text-foreground leading-relaxed overflow-x-auto">
                                    {JSON.stringify({
                                        prompt: outputPrompt,
                                        template: selectedTemplate?.name,
                                        style: selectedStyle.name,
                                        model: selectedModelId,
                                        timestamp: new Date().toISOString()
                                    }, null, 2)}
                                </pre>
                            ) : (
                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                                    {outputPrompt}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
