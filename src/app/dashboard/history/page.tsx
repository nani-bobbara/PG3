import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Trash2, Copy, Check, Clock } from "lucide-react";
import { format } from "date-fns";

export default async function HistoryPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth");
    }

    const { data: prompts } = await supabase
        .from("prompts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

    return (
        <div className="h-full overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Prompt History</h1>
                    <p className="text-muted-foreground">Review and reuse your previously generated prompts.</p>
                </div>

                {prompts && prompts.length > 0 ? (
                    <div className="space-y-4">
                        {prompts.map((prompt) => (
                            <div
                                key={prompt.id}
                                className="bg-card border border-border rounded-lg p-4"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                                            {prompt.template_type}
                                        </span>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {format(new Date(prompt.created_at), "MMM d, yyyy 'at' h:mm a")}
                                        </span>
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <p className="text-xs text-muted-foreground mb-1">Input</p>
                                    <p className="text-sm text-foreground">{prompt.input_prompt}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground mb-1">Output</p>
                                    <p className="text-sm text-foreground font-mono whitespace-pre-wrap line-clamp-4">
                                        {prompt.output_prompt}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-muted-foreground">No prompts yet. Start creating!</p>
                    </div>
                )}
            </div>
        </div>
    );
}
