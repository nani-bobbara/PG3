// Centralized Subscription Plans Configuration
// Single source of truth for pricing across landing and billing pages

export type PlanId = 'free' | 'basic' | 'pro';

export interface Plan {
    id: PlanId;
    name: string;
    price: string;
    priceMonthly: number; // In cents for Stripe
    period: string;
    description: string;
    features: string[];
    cta: string;
    popular?: boolean;
    stripePriceId: string | null;
}

// Stripe Price IDs should be configured in environment variables
const STRIPE_PRICE_BASIC = process.env.NEXT_PUBLIC_STRIPE_PRICE_BASIC || 'price_basic_id';
const STRIPE_PRICE_PRO = process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || 'price_pro_id';

export const PLANS: Plan[] = [
    {
        id: 'free',
        name: 'Free',
        price: '$0',
        priceMonthly: 0,
        period: 'forever',
        description: 'Perfect for testing the AI prompt engine',
        features: [
            '50 prompts per month',
            'Access to basic templates',
            'Standard AI models',
            'Community support',
        ],
        cta: 'Get Started',
        stripePriceId: null,
    },
    {
        id: 'basic',
        name: 'Basic',
        price: '$2',
        priceMonthly: 200,
        period: 'per month',
        description: 'For consistent high-quality creators',
        features: [
            '200 prompts per month',
            'Intermediate template access',
            'Priority processing',
            '7-day history retention',
        ],
        cta: 'Start Creating',
        popular: true,
        stripePriceId: STRIPE_PRICE_BASIC,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$5',
        priceMonthly: 500,
        period: 'per month',
        description: 'Unlimited potential for power users',
        features: [
            '600 prompts per month',
            'ALL Templates & Styles',
            'BYOK Fallback (Unlimited)',
            'Unlimited history retention',
            'Early access features',
        ],
        cta: 'Go Pro',
        stripePriceId: STRIPE_PRICE_PRO,
    },
];

export const getPlan = (planId: PlanId): Plan | undefined => {
    return PLANS.find(p => p.id === planId);
};

// Plan limits for usage tracking (matches tiers table in DB)
export const PLAN_LIMITS: Record<PlanId, number> = {
    free: 50,
    basic: 200,
    pro: 600,
};
