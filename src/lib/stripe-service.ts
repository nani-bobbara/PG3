import { Stripe } from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export class StripeService {
    /**
     * Handles 'checkout.session.completed'
     * Provisions the subscription in `user_subscriptions`
     */
    static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const supabase = createAdminClient();
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        const userId = session.client_reference_id as string;

        if (!subscriptionId || !userId) {
            console.error('[StripeService] Missing subscriptionId or userId in session');
            return;
        }

        // Retrieve full subscription details from Stripe
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;

        // Find internal tier by matching stripe_monthly_price_id or stripe_yearly_price_id
        const { data: tier } = await supabase
            .from('subscription_tiers')
            .select('id, monthly_quota')
            .or(`stripe_monthly_price_id.eq.${priceId},stripe_yearly_price_id.eq.${priceId}`)
            .single();

        if (!tier) {
            console.error(`[StripeService] No tier found for priceId: ${priceId}`);
            return;
        }

        // Provision Subscription
        const { error } = await supabase
            .from('user_subscriptions')
            .upsert({
                user_id: userId,
                tier_id: tier.id,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                status: 'active',
                monthly_quota_limit: tier.monthly_quota,
                monthly_usage_count: 0, // Reset usage on new sub
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end
            }, { onConflict: 'user_id' });

        if (error) {
            console.error('[StripeService] Failed to upsert subscription:', error);
        }
    }

    /**
     * Handles 'customer.subscription.updated'
     * Updates status, syncs periods, handles renewals/cancellations
     */
    static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
        const supabase = createAdminClient();
        const priceId = subscription.items.data[0].price.id;

        // Get Tier
        const { data: tier } = await supabase
            .from('subscription_tiers')
            .select('id, monthly_quota')
            .or(`stripe_monthly_price_id.eq.${priceId},stripe_yearly_price_id.eq.${priceId}`)
            .single();

        if (!tier) {
            console.error(`[StripeService] Tier not found for update, price: ${priceId}`);
            // Fallback: Just update status if possible, or ignore
            return;
        }

        // Update Subscription
        // Note: For renewals, we strictly trust Stripe's period_end.
        // If current_period_end changes (renewal), we should reset usage? 
        // Logic: if new period_end > stored period_end, reset.
        // For simplicity in this sync: just update columns. Reset logic can be a separate check or DB trigger.

        await supabase
            .from('user_subscriptions')
            .update({
                tier_id: tier.id,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                status: subscription.status as any,
                monthly_quota_limit: tier.monthly_quota,
                // Cast to any because Stripe types might be slightly mismatched or nested
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end
            })
            .eq('stripe_subscription_id', subscription.id);
    }

    /**
     * Handles 'customer.subscription.deleted'
     */
    static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
        const supabase = createAdminClient();

        // Revert to Free Tier
        const { data: freeTier } = await supabase
            .from('subscription_tiers')
            .select('id, monthly_quota')
            .eq('id', 'free')
            .single();

        if (!freeTier) return;

        await supabase
            .from('user_subscriptions')
            .update({
                tier_id: freeTier.id,
                status: 'canceled',
                monthly_quota_limit: freeTier.monthly_quota,
                stripe_subscription_id: null, // Optional: keep for history?
                cancel_at_period_end: false
            })
            .eq('stripe_subscription_id', subscription.id);
    }

    /**
     * Handles 'product.*' and 'price.*' events
     * Caches Stripe data into `subscription_tiers` to avoid runtime API calls
     */
    static async handleProductOrPriceUpdate(event: Stripe.Event) {
        const supabase = createAdminClient();

        if (event.type.startsWith('product.')) {
            const product = event.data.object as Stripe.Product;
            await supabase
                .from('subscription_tiers')
                .update({
                    name: product.name,
                    description: product.description,
                    features: product.metadata.features ? JSON.parse(product.metadata.features) : undefined // Expect JSON string in metadata
                })
                .eq('stripe_product_id', product.id);
        }

        if (event.type.startsWith('price.')) {
            const price = event.data.object as Stripe.Price;
            const productId = typeof price.product === 'string' ? price.product : price.product.id;
            const interval = price.recurring?.interval;

            const updateData: Record<string, any> = {
                currency: price.currency,
            };

            // Optional: Update quota from metadata if present
            if (price.metadata?.monthly_quota) {
                updateData.monthly_quota = parseInt(price.metadata.monthly_quota);
            }

            if (interval === 'month') {
                updateData.stripe_monthly_price_id = price.id;
                updateData.monthly_price_in_cents = price.unit_amount || 0;
            } else if (interval === 'year') {
                updateData.stripe_yearly_price_id = price.id;
                updateData.yearly_price_in_cents = price.unit_amount || 0;
            }

            await supabase
                .from('subscription_tiers')
                .update(updateData)
                .eq('stripe_product_id', productId);
        }
    }
}
