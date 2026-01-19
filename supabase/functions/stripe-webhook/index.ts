import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.12.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2023-10-16",
    httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";

serve(async (req) => {
    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(body, signature!, endpointSecret);
    } catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 400 });
    }

    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    try {
        switch (event.type) {
            case "checkout.session.completed": {
                const session = event.data.object as Stripe.Checkout.Session;
                const userId = session.subscription
                    ? (await stripe.subscriptions.retrieve(session.subscription as string)).metadata.supabase_user_id
                    : session.metadata?.supabase_user_id;

                if (userId) {
                    const subscriptionId = session.subscription as string;
                    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = stripeSubscription.items.data[0].price.id;

                    // Determine plan based on priceId (you'll map this to your Stripe prices)
                    let plan: "creator" | "pro" = "creator";
                    if (priceId.includes("pro")) plan = "pro"; // Simplified check

                    await supabaseAdmin
                        .from("subscriptions")
                        .update({
                            plan,
                            status: "active",
                            stripe_subscription_id: subscriptionId,
                            stripe_customer_id: session.customer as string,
                            current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
                        })
                        .eq("user_id", userId);
                }
                break;
            }

            case "customer.subscription.updated": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata.supabase_user_id;

                if (userId) {
                    const priceId = subscription.items.data[0].price.id;
                    let plan: "creator" | "pro" | "free" = "creator";
                    if (priceId.includes("pro")) plan = "pro";

                    await supabaseAdmin
                        .from("subscriptions")
                        .update({
                            plan,
                            status: subscription.status === "active" ? "active" : "past_due",
                            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                        })
                        .eq("user_id", userId);
                }
                break;
            }

            case "customer.subscription.deleted": {
                const subscription = event.data.object as Stripe.Subscription;
                const userId = subscription.metadata.supabase_user_id;

                if (userId) {
                    await supabaseAdmin
                        .from("subscriptions")
                        .update({
                            plan: "free",
                            status: "canceled",
                            stripe_subscription_id: null,
                            current_period_start: null,
                            current_period_end: null,
                        })
                        .eq("user_id", userId);
                }
                break;
            }
        }

        return new Response(JSON.stringify({ received: true }), { status: 200 });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
});
