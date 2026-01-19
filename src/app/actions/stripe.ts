"use server";

import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export async function createCheckoutSession(priceId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error("Unauthorized");
    }

    // Get the base URL - usually Vercel URL or localhost
    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
        customer_email: user.email,
        client_reference_id: user.id,
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: "subscription",
        success_url: `${origin}/dashboard/settings?success=true`,
        cancel_url: `${origin}/dashboard/settings?canceled=true`,
        metadata: {
            userId: user.id,
        }
    });

    if (!session.url) {
        throw new Error("Failed to create checkout session");
    }

    redirect(session.url);
}

export async function createPortalSession() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error("Unauthorized");

    const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id')
        .eq('user_id', user.id)
        .single();

    if (!subscription?.stripe_customer_id) {
        throw new Error("No subscription found");
    }

    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";

    const session = await stripe.billingPortal.sessions.create({
        customer: subscription.stripe_customer_id,
        return_url: `${origin}/dashboard/settings`,
    });

    redirect(session.url);
}
