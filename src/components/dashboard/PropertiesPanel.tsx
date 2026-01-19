"use client";

import { SupportedTemplate, ParameterSchema } from "@/types/dynamic-config";
import { Style } from "@/config";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Loader2, Wand2, Info, HelpCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

interface PropertiesPanelProps {
    template: SupportedTemplate;
    style: Style;
    parameters: Record<string, any>;
    onParamChange: (key: string, value: any) => void;
    onGenerate: () => void;
    isPending: boolean;
}

export function PropertiesPanel({
    template,
    style,
    parameters,
    onParamChange,
    onGenerate,
    isPending
}: PropertiesPanelProps) {
    const renderControl = (schema: ParameterSchema) => {
        switch (schema.type) {
            case 'select':
                return (
                    <div key={schema.key} className="space-y-2">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-widest">{schema.label}</label>
                        <Select
                            value={String(parameters[schema.key] || '')}
                            onValueChange={(val) => onParamChange(schema.key, val)}
                        >
                            <SelectTrigger className="w-full bg-background/40 border-border/50 hover:border-primary/30 transition-colors">
                                <SelectValue placeholder={`Select ${schema.label}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {schema.options?.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {schema.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{schema.description}</p>}
                    </div>
                );
            case 'slider':
                return (
                    <div key={schema.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-foreground uppercase tracking-widest">{schema.label}</label>
                            <span className="text-xs font-mono text-primary font-bold">{parameters[schema.key]}</span>
                        </div>
                        <Slider
                            value={[Number(parameters[schema.key] || schema.min || 0)]}
                            min={schema.min}
                            max={schema.max}
                            step={schema.step}
                            onValueChange={(vals) => onParamChange(schema.key, vals[0])}
                            className="py-1"
                        />
                        {schema.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{schema.description}</p>}
                    </div>
                );
            case 'input':
            default:
                return (
                    <div key={schema.key} className="space-y-2">
                        <label className="text-xs font-semibold text-foreground uppercase tracking-widest">{schema.label}</label>
                        <Input
                            placeholder={schema.placeholder}
                            value={parameters[schema.key] || ''}
                            onChange={(e) => onParamChange(schema.key, e.target.value)}
                            className="bg-background/40 border-border/50 hover:border-primary/30 transition-colors"
                        />
                        {schema.description && <p className="text-[10px] text-muted-foreground leading-relaxed">{schema.description}</p>}
                    </div>
                );
        }
    };

    return (
        <aside className="fixed right-0 top-16 bottom-0 w-80 border-l border-border bg-card/60 backdrop-blur-xl hidden lg:flex flex-col z-10">
            {/* Header section with help dialog */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between bg-card/40">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-primary rounded-full"></div>
                    <h2 className="text-sm font-bold tracking-widest text-foreground uppercase leading-none">Parameters</h2>
                </div>

                {template.help_text && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-full">
                                <HelpCircle className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[85vh] p-0 overflow-hidden border-border/40 shadow-2xl">
                            <DialogHeader className="p-6 border-b border-border/50 bg-muted/20">
                                <DialogTitle className="text-2xl font-bold">{template.name} Best Practices</DialogTitle>
                                <DialogDescription className="text-base">
                                    Maximize the potential of this template with expert advice.
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh] p-6 lg:p-8">
                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-4 text-primary" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-6 mb-3 text-foreground border-b border-border/30 pb-1" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-4 mb-2 text-foreground" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-muted-foreground leading-relaxed mb-4" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-4 space-y-2" {...props} />,
                                            li: ({ node, ...props }) => <li className="text-muted-foreground" {...props} />,
                                            code: ({ node, ...props }) => <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-xs" {...props} />,
                                        }}
                                    >
                                        {template.help_text}
                                    </ReactMarkdown>
                                </div>
                            </ScrollArea>
                            <div className="p-4 bg-muted/10 border-t border-border/50 text-center">
                                <p className="text-xs text-muted-foreground">Prompt Engine Intelligence v1.0</p>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Scrollable controls area */}
            <ScrollArea className="flex-1">
                <div className="p-6 space-y-8">
                    {/* Dynamic Controls */}
                    <div className="space-y-7">
                        {template.param_schema && template.param_schema.length > 0 ? (
                            template.param_schema.map(schema => renderControl(schema))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed border-border/40 bg-muted/5">
                                <Info className="w-8 h-8 text-muted-foreground/30 mb-3" />
                                <p className="text-xs text-muted-foreground italic text-center leading-relaxed">
                                    No configurable parameters <br /> detected for this blueprint.
                                </p>
                            </div>
                        )}
                    </div>

                    <Separator className="bg-border/40" />

                    {/* Meta Info summary */}
                    <div className="space-y-5 bg-muted/10 p-4 rounded-xl border border-border/40">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Active Template</label>
                            <p className="text-sm font-semibold text-foreground">{template.name}</p>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Visual Signature</label>
                            <div className="flex items-center gap-2.5">
                                <div className={`w-3.5 h-3.5 rounded-full bg-gradient-to-br ${style.previewColor || 'from-gray-400 to-gray-600'} border border-white/10`} />
                                <p className="text-sm font-semibold text-foreground">{style.name}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Fixed footer with primary action button */}
            <div className="p-6 border-t border-border/50 bg-card shadow-[0_-10px_20px_rgba(0,0,0,0.02)]">
                <Button
                    size="lg"
                    onClick={onGenerate}
                    disabled={isPending}
                    className="w-full h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-2.5" />
                            Architecting...
                        </>
                    ) : (
                        <>
                            <Wand2 className="w-5 h-5 mr-2.5" />
                            Architect Prompt
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
