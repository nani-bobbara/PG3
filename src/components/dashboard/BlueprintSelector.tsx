"use client";

import { ChevronDown, ImageIcon, VideoIcon, FileText, Settings } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SupportedTemplate } from "@/types/dynamic-config";
import { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
    'Image': ImageIcon,
    'Video': VideoIcon,
    'Text': FileText,
    'Utility': Settings
};

interface BlueprintSelectorProps {
    templates: SupportedTemplate[];
    selectedTemplate: SupportedTemplate | null;
    onSelect: (template: SupportedTemplate) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BlueprintSelector({
    templates,
    selectedTemplate,
    onSelect,
    open,
    onOpenChange
}: BlueprintSelectorProps) {
    if (!selectedTemplate) return null;

    const Icon = iconMap[selectedTemplate.category] || FileText;

    return (
        <DropdownMenu open={open} onOpenChange={onOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="h-10 rounded-full pl-4 pr-3 border-border/50 bg-card/50 hover:bg-card">
                    <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-primary" />
                        <span className="text-sm font-bold tracking-tight">{selectedTemplate.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2 rounded-2xl border-border/40 shadow-2xl" align="center">
                {templates.map((template) => {
                    const ItemIcon = iconMap[template.category] || FileText;
                    return (
                        <DropdownMenuItem
                            key={template.id}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-not-allowed hover:bg-muted/50 focus:bg-primary/10 transition-colors"
                            onClick={() => onSelect(template)}
                        >
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                                <ItemIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold leading-tight">{template.name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{template.category}</span>
                            </div>
                        </DropdownMenuItem>
                    );
                })}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
