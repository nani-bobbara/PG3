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
import { Loader2, Wand2, Info, HelpCircle, Sliders, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

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
        const labelEl = (
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-3 block">
                {schema.label}
            </label>
        );

        switch (schema.type) {
            case 'select':
                return (
                    <div key={schema.key} className="space-y-1">
                        {labelEl}
                        <Select
                            value={String(parameters[schema.key] || '')}
                            onValueChange={(val) => onParamChange(schema.key, val)}
                        >
                            <SelectTrigger className="w-full h-11 bg-muted/40 border-border/40 hover:border-primary/50 transition-all rounded-xl shadow-sm">
                                <SelectValue placeholder={`Select ${schema.label}`} />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-border/50 shadow-2xl">
                                {schema.options?.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="rounded-lg py-2.5">{opt.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {schema.description && <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium mt-2">{schema.description}</p>}
                    </div>
                );
            case 'slider':
                return (
                    <div key={schema.key} className="space-y-4">
                        <div className="flex items-center justify-between">
                            {labelEl}
                            <span className="text-[10px] font-mono text-primary font-bold bg-primary/10 px-2 py-0.5 rounded-full">{parameters[schema.key]}</span>
                        </div>
                        <div className="px-1">
                            <Slider
                                value={[Number(parameters[schema.key] || schema.min || 0)]}
                                min={schema.min}
                                max={schema.max}
                                step={schema.step}
                                onValueChange={(vals) => onParamChange(schema.key, vals[0])}
                                className="py-2"
                            />
                        </div>
                        {schema.description && <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium">{schema.description}</p>}
                    </div>
                );
            case 'input':
            default:
                return (
                    <div key={schema.key} className="space-y-1">
                        {labelEl}
                        <Input
                            placeholder={schema.placeholder}
                            value={parameters[schema.key] || ''}
                            onChange={(e) => onParamChange(schema.key, e.target.value)}
                            className="h-11 bg-muted/40 border-border/40 hover:border-primary/50 transition-all rounded-xl shadow-sm font-medium"
                        />
                        {schema.description && <p className="text-[10px] text-muted-foreground/60 leading-relaxed font-medium mt-2">{schema.description}</p>}
                    </div>
                );
        }
    };

    return (
        <aside className="fixed right-0 top-16 bottom-0 w-80 border-l border-border bg-background/60 backdrop-blur-3xl hidden lg:flex flex-col z-30 animate-in slide-in-from-right duration-500">
            {/* Header section with help dialog */}
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sliders className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-xs font-bold tracking-[0.1em] text-foreground uppercase leading-none">Settings</h2>
                </div>

                {template.help_text && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all rounded-full">
                                <HelpCircle className="w-4 h-4" />
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-xl max-h-[85vh] p-0 overflow-hidden border-border/40 shadow-2xl rounded-3xl">
                            <DialogHeader className="p-8 border-b border-border/50 bg-muted/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocol Optimization</span>
                                </div>
                                <DialogTitle className="text-3xl font-black tracking-tight">{template.name}</DialogTitle>
                                <DialogDescription className="text-base font-medium">
                                    Unlock the full creative potential of this blueprint.
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[50vh] p-8">
                                <div className="prose prose-sm dark:prose-invert max-w-none prose-p:font-medium prose-p:leading-relaxed">
                                    <ReactMarkdown
                                        components={{
                                            h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-4 text-primary" {...props} />,
                                            h2: ({ node, ...props }) => <h2 className="text-sm font-bold mt-8 mb-4 text-foreground uppercase tracking-widest border-l-2 border-primary pl-4" {...props} />,
                                            h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-4 mb-2 text-foreground" {...props} />,
                                            p: ({ node, ...props }) => <p className="text-muted-foreground/80 leading-relaxed mb-6" {...props} />,
                                            ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-6 space-y-3" {...props} />,
                                            li: ({ node, ...props }) => <li className="text-muted-foreground/80 font-medium" {...props} />,
                                            code: ({ node, ...props }) => <code className="bg-primary/10 px-1.5 py-0.5 rounded text-primary font-mono text-xs font-bold" {...props} />,
                                        }}
                                    >
                                        {template.help_text}
                                    </ReactMarkdown>
                                </div>
                            </ScrollArea>
                            <div className="p-6 bg-muted/10 border-t border-border/50 flex items-center justify-center">
                                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Promptify Alpha Protocol v1.2</p>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Scrollable controls area */}
            <ScrollArea className="flex-1">
                <div className="p-6 space-y-10 pb-32">
                    {/* Dynamic Controls */}
                    <div className="space-y-10">
                        {template.param_schema && template.param_schema.length > 0 ? (
                            template.param_schema.map(schema => renderControl(schema))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 rounded-2xl border-2 border-dashed border-border/40 bg-muted/5">
                                <div className="w-12 h-12 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                                    <Info className="w-6 h-6 text-muted-foreground/20" />
                                </div>
                                <p className="text-[11px] font-bold text-muted-foreground/50 uppercase text-center leading-loose tracking-widest">
                                    No parameters <br /> required for <br /> this protocol
                                </p>
                            </div>
                        )}
                    </div>

                    <Separator className="bg-border/20" />

                    {/* Active State Summary */}
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Blueprint</span>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                                <div className="w-2 h-2 rounded-full bg-primary" />
                                <span className="text-sm font-bold text-foreground">{template.name}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Signature</span>
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 border border-border/30">
                                <div className={cn("w-3 h-3 rounded-full bg-gradient-to-br", style.previewColor || 'from-gray-400 to-gray-600')} />
                                <span className="text-sm font-bold text-foreground">{style.name}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Fixed footer: Bottom CTA for redundancy and ease of use */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12">
                <Button
                    size="lg"
                    onClick={onGenerate}
                    disabled={isPending}
                    className="w-full h-14 rounded-2xl bg-foreground hover:bg-foreground/90 text-background font-black tracking-tight shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98] group"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin mr-3" />
                            Architecting...
                        </>
                    ) : (
                        <>
                            Architect Prompt
                            <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </>
                    )}
                </Button>
            </div>
        </aside>
    );
}
