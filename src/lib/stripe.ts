import Stripe from 'stripe';

// Ensure the key exists or use a dummy for build time to prevent crashes.
// In production, this should cause an error if missing.
const apiKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key_for_build';

export const stripe = new Stripe(apiKey, {
    typescript: true,
});

export const getStripeSession = async (_priceId: string, _customerId?: string) => {
    // Implementation for creating checkout sessions
};
