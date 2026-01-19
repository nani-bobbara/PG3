"use client";

import { useState, useTransition, useMemo } from "react";
import { User, Key, Loader2, Check, Trash2, AlertCircle, CreditCard, Shield, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { saveApiKey, deleteApiKey } from "@/app/actions/manage-api-keys";
import { createCheckoutSession, createPortalSession } from "@/app/actions/stripe";
import { toast } from "sonner";
import { useDynamicConfig } from "@/hooks/use-config";

interface SettingsClientProps {
    userEmail: string;
    userName: string;
    keyStatus: { [key: string]: boolean };
    subscription: {
        tierName: string;
        quotaUsed: number;
        quotaLimit: number;
    };
}

export function SettingsClient({ userEmail, userName, keyStatus, subscription }: SettingsClientProps) {
    const { models, isLoadingModels, modelsError } = useDynamicConfig();
    const [keys, setKeys] = useState<{ [key: string]: string }>({});
    const [isPending, startTransition] = useTransition();
    const [savingProvider, setSavingProvider] = useState<string | null>(null);

    // Calculate usage percentage
    const usagePercent = Math.min(100, Math.round((subscription.quotaUsed / subscription.quotaLimit) * 100));

    // Derive unique providers from supported AI models
    const uniqueProviders = useMemo(() => {
        const providers = new Map<string, { id: string, label: string }>();

        models.forEach(model => {
            if (!providers.has(model.provider)) {
                const label = model.provider.charAt(0).toUpperCase() + model.provider.slice(1);
                providers.set(model.provider, {
                    id: model.provider,
                    label: label
                });
            }
        });

        return Array.from(providers.values());
    }, [models]);

    const handleSaveKey = (provider: string) => {
        const apiKey = keys[provider];
        if (!apiKey) return;

        setSavingProvider(provider);
        startTransition(async () => {
            const result = await saveApiKey({ provider, apiKey });
            if (result.success) {
                toast.success(`${provider} key saved securely`);
                setKeys(prev => ({ ...prev, [provider]: "" }));
            } else {
                toast.error(result.error || "Failed to save key");
            }
            setSavingProvider(null);
        });
    };

    const handleDeleteKey = (provider: string) => {
        startTransition(async () => {
            const result = await deleteApiKey(provider);
            if (result.success) {
                toast.success("API key deleted");
            } else {
                toast.error(result.error || "Failed to delete key");
            }
        });
    };

    return (
        <div className="h-full overflow-y-auto p-6 md:p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
                        <p className="text-muted-foreground">Manage your account preferences and integrations.</p>
                    </div>
                    <Badge variant="outline" className="text-sm px-3 py-1 font-mono uppercase">
                        {subscription.tierName} Plan
                    </Badge>
                </div>

                <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 mb-8">
                        <TabsTrigger value="profile" className="gap-2">
                            <User className="w-4 h-4" /> Profile
                        </TabsTrigger>
                        <TabsTrigger value="api-keys" className="gap-2">
                            <Key className="w-4 h-4" /> API Keys
                        </TabsTrigger>
                        <TabsTrigger value="billing" className="gap-2">
                            <CreditCard className="w-4 h-4" /> Billing
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Profile Information</CardTitle>
                                <CardDescription>
                                    View your account details.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" value={userEmail} disabled className="bg-muted" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Display Name</Label>
                                    <Input id="name" value={userName} disabled className="bg-muted" />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* API Keys Tab */}
                    <TabsContent value="api-keys" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <CardTitle>BYOK Configuration</CardTitle>
                                        <CardDescription>
                                            Securely store your API keys for direct model access.
                                        </CardDescription>
                                    </div>
                                    <Shield className="w-5 h-5 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="bg-primary/10 border border-primary/20 rounded-md p-4 flex gap-3 text-sm text-primary mb-4">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold mb-1">Why add your own keys?</p>
                                        <p className="text-muted-foreground">
                                            If you exceed your monthly plan limit, the system will automatically use your personal API keys to continue generating prompts without interruption.
                                        </p>
                                    </div>
                                </div>

                                {isLoadingModels ? (
                                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                                        Loading providers...
                                    </div>
                                ) : modelsError ? (
                                    <div className="p-4 rounded-md bg-destructive/10 text-destructive text-sm text-center">
                                        Failed to load supported models. Is the database migrated?
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {uniqueProviders.length === 0 && (
                                            <p className="text-sm text-muted-foreground italic text-center py-4">
                                                No providers configured in the system.
                                            </p>
                                        )}

                                        {uniqueProviders.map((provider) => (
                                            <div key={provider.id} className="group p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <Label htmlFor={provider.id} className="text-base font-medium flex items-center gap-2">
                                                        {provider.label}
                                                        {keyStatus[provider.id] && (
                                                            <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold flex items-center gap-1">
                                                                <Check className="w-3 h-3" /> Active
                                                            </span>
                                                        )}
                                                    </Label>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id={provider.id}
                                                        type="password"
                                                        value={keys[provider.id] || ""}
                                                        onChange={(e) => setKeys(prev => ({ ...prev, [provider.id]: e.target.value }))}
                                                        placeholder={`Enter ${provider.label} API Key`}
                                                        className="font-mono"
                                                    />
                                                    <Button
                                                        onClick={() => handleSaveKey(provider.id)}
                                                        disabled={isPending || !keys[provider.id]}
                                                    >
                                                        {savingProvider === provider.id ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            "Save"
                                                        )}
                                                    </Button>
                                                    {keyStatus[provider.id] && (
                                                        <Button
                                                            variant="destructive"
                                                            size="icon"
                                                            onClick={() => handleDeleteKey(provider.id)}
                                                            disabled={isPending}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Billing Tab */}
                    <TabsContent value="billing" className="space-y-6">
                        {/* Usage Card */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-accent" />
                                    Monthly Usage
                                </CardTitle>
                                <CardDescription>
                                    Your prompt generation usage for this month.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {subscription.quotaUsed} / {subscription.quotaLimit} prompts
                                        </span>
                                        <span className="font-medium text-foreground">
                                            {usagePercent}%
                                        </span>
                                    </div>
                                    <Progress value={usagePercent} className="h-2" />
                                    <p className="text-xs text-muted-foreground pt-2">
                                        Resets on {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                        {/* TODO: Use actual reset date from DB */}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Plan Card */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle>Current Plan: {subscription.tierName}</CardTitle>
                                        <CardDescription>
                                            Manage your subscription and billing details.
                                        </CardDescription>
                                    </div>
                                    {subscription.tierName === 'Free' ? (
                                        <Button onClick={() => {
                                            toast.promise(createCheckoutSession('price_pro_placeholder_id'), {
                                                loading: 'Redirecting to checkout...',
                                                error: 'Failed to start checkout'
                                            });
                                        }}>
                                            Upgrade to Pro
                                        </Button>
                                    ) : (
                                        <Button variant="outline" onClick={() => {
                                            toast.promise(createPortalSession(), {
                                                loading: 'Opening billing portal...',
                                                error: 'Failed to open portal'
                                            });
                                        }}>
                                            Manage Subscription
                                        </Button>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-4 md:grid-cols-3">
                                    {/* Free Plan */}
                                    <div className={`p-4 rounded-lg border ${subscription.tierName === 'Free' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <h4 className="font-bold mb-2">Free</h4>
                                        <p className="text-2xl font-bold mb-4">$0<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                        <ul className="text-sm space-y-2 mb-4">
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 50 Prompts/mo</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> Basic Patterns</li>
                                        </ul>
                                    </div>

                                    {/* Basic Plan */}
                                    <div className={`p-4 rounded-lg border ${subscription.tierName === 'Basic' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <h4 className="font-bold mb-2">Basic</h4>
                                        <p className="text-2xl font-bold mb-4">$2<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                        <ul className="text-sm space-y-2 mb-4">
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 200 Prompts/mo</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> More Patterns</li>
                                        </ul>
                                    </div>

                                    {/* Pro Plan */}
                                    <div className={`p-4 rounded-lg border ${subscription.tierName === 'Pro' ? 'border-primary bg-primary/5' : 'border-border'}`}>
                                        <h4 className="font-bold mb-2">Pro</h4>
                                        <p className="text-2xl font-bold mb-4">$5<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                                        <ul className="text-sm space-y-2 mb-4">
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> 600 Prompts/mo</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> All Patterns</li>
                                            <li className="flex items-center gap-2"><Check className="w-4 h-4 text-green-500" /> BYOK Fallback</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
