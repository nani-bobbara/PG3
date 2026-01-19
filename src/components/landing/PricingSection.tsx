import Link from "next/link";
import { Check, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/config";
import { cn } from "@/lib/utils";

export function PricingSection() {
    return (
        <section id="pricing" className="py-24 md:py-32 relative overflow-hidden">
            <div className="container mx-auto px-6 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16 md:mb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                        <Zap className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-foreground">Simple Pricing</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
                        Choose Your <span className="text-primary">Plan</span>
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Start free and upgrade as you grow. No hidden fees, cancel anytime.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="grid lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {PLANS.map((plan) => (
                        <div
                            key={plan.id}
                            className={cn(
                                "group relative p-8 rounded-2xl transition-all duration-300",
                                plan.popular
                                    ? "bg-card dark:bg-card/80 border-2 border-primary shadow-xl shadow-primary/10 dark:shadow-primary/20 scale-[1.02] z-10"
                                    : "bg-card dark:bg-card/60 border border-border/50 dark:border-border/30 hover:border-primary/40 dark:hover:border-primary/50 hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-primary/10"
                            )}
                        >
                            {/* Popular badge */}
                            {plan.popular && (
                                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                    <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold shadow-lg">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        Most Popular
                                    </div>
                                </div>
                            )}

                            {/* Plan details */}
                            <div className="mb-6">
                                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                                <p className="text-sm text-muted-foreground">{plan.description}</p>
                            </div>

                            {/* Price */}
                            <div className="mb-6 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                                {plan.price !== "$0" && (
                                    <span className="text-sm text-muted-foreground">/{plan.period}</span>
                                )}
                            </div>

                            <div className="h-px w-full bg-border/50 mb-6" />

                            {/* Features */}
                            <ul className="space-y-3 mb-8">
                                {plan.features.map((feature, featureIndex) => (
                                    <li key={featureIndex} className="flex items-start gap-3">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                                            <Check className="w-3 h-3 text-primary" />
                                        </div>
                                        <span className="text-sm text-foreground">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            {/* CTA */}
                            <Button
                                size="lg"
                                className={cn(
                                    "w-full h-12 rounded-full font-semibold transition-all",
                                    plan.popular
                                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                        : "bg-muted dark:bg-muted/50 hover:bg-muted/80 dark:hover:bg-muted/70 text-foreground border border-transparent hover:border-primary/20"
                                )}
                                asChild
                            >
                                <Link href="/auth">{plan.cta}</Link>
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Trust note */}
                <p className="mt-12 text-center text-sm text-muted-foreground">
                    💳 Secure payments via Stripe · 🔒 Your data is always encrypted
                </p>
            </div>

            {/* Subtle background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[400px] bg-primary/3 dark:bg-primary/5 rounded-full blur-[160px] pointer-events-none" />
        </section>
    );
}
