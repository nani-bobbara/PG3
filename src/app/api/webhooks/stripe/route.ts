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
    } catch (error: any) {
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const supabase = await createClient();

    if (event.type === 'checkout.session.completed') {
        // Cast to any to avoid strict type issues with the SDK version
        const subscription: any = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0].price.id;

        // Find tier by price_id
        const { data: tier } = await supabase
            .from('tiers')
            .select('id, quota')
            .eq('stripe_price_id', priceId)
            .single();

        if (tier) {
            await supabase
                .from('subscriptions')
                .update({
                    stripe_subscription_id: subscription.id,
                    stripe_customer_id: subscription.customer as string,
                    current_tier: tier.id,
                    status: 'active',
                    quota_reset_at: new Date(subscription.current_period_end * 1000).toISOString()
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
