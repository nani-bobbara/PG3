import { Stripe } from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';
import { stripe } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = await createClient();

    if (event.type === 'checkout.session.completed') {
        const subscriptionResponse = await stripe.subscriptions.retrieve(session.subscription as string);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const subscriptionData = subscriptionResponse as any;
        const priceId = subscriptionData.items.data[0].price.id;

        // Find tier by price_id
        const { data: tier } = await supabase
            .from('tiers')
            .select('id, quota')
            .eq('stripe_price_id', priceId)
            .single();

        if (tier) {
            const periodEnd = subscriptionData.current_period_end 
                ? new Date(subscriptionData.current_period_end * 1000).toISOString()
                : null;
            await supabase
                .from('subscriptions')
                .update({
                    stripe_subscription_id: subscriptionData.id,
                    stripe_customer_id: subscriptionData.customer as string,
                    current_tier: tier.id,
                    status: 'active',
                    quota_reset_at: periodEnd
                })
                .eq('user_id', session.client_reference_id);
        }
    }

    if (event.type === 'customer.subscription.deleted') {
        // Downgrade to free
        await supabase
            .from('subscriptions')
            .update({
                current_tier: 'free',
                status: 'canceled',
                quota_reset_at: null
            })
            .eq('stripe_customer_id', session.customer as string);
    }

    return new NextResponse(null, { status: 200 });
}
