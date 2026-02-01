import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature",
};

// Verify Lemonsqueezy webhook signature
async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSignature === signature;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get("LEMONSQUEEZY_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!webhookSecret || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    // Get signature from headers
    const signature = req.headers.get("x-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get raw body for signature verification
    const rawBody = await req.text();

    // Verify signature
    const isValid = await verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const data = payload.data;
    const attributes = data.attributes;

    console.log(`Received Lemonsqueezy event: ${eventName}`);

    // Initialize Supabase client with service role
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract user email from custom data or customer email
    const customData = payload.meta.custom_data || {};
    const userId = customData.user_id;

    if (!userId) {
      console.error("No user_id in custom_data");
      return new Response(JSON.stringify({ error: "Missing user_id in custom_data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle different webhook events
    switch (eventName) {
      case "subscription_created": {
        const { error } = await supabase
          .from("subscriptions")
          .upsert({
            user_id: userId,
            lemonsqueezy_customer_id: String(attributes.customer_id),
            lemonsqueezy_subscription_id: String(data.id),
            lemonsqueezy_order_id: String(attributes.order_id),
            lemonsqueezy_product_id: String(attributes.product_id),
            lemonsqueezy_variant_id: String(attributes.variant_id),
            status: mapStatus(attributes.status),
            plan_name: attributes.product_name || "premium",
            billing_interval: attributes.billing_anchor === 1 ? "monthly" : "yearly",
            current_period_start: attributes.current_period_start,
            current_period_end: attributes.renews_at,
          }, { onConflict: "user_id" });

        if (error) {
          console.error("Error creating subscription:", error);
          throw error;
        }
        console.log(`Subscription created for user ${userId}`);
        break;
      }

      case "subscription_updated": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: mapStatus(attributes.status),
            current_period_start: attributes.current_period_start,
            current_period_end: attributes.renews_at,
            cancelled_at: attributes.cancelled ? attributes.updated_at : null,
            ends_at: attributes.ends_at,
          })
          .eq("lemonsqueezy_subscription_id", String(data.id));

        if (error) {
          console.error("Error updating subscription:", error);
          throw error;
        }
        console.log(`Subscription updated for subscription ${data.id}`);
        break;
      }

      case "subscription_cancelled": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "cancelled",
            cancelled_at: new Date().toISOString(),
            ends_at: attributes.ends_at,
          })
          .eq("lemonsqueezy_subscription_id", String(data.id));

        if (error) {
          console.error("Error cancelling subscription:", error);
          throw error;
        }
        console.log(`Subscription cancelled for subscription ${data.id}`);
        break;
      }

      case "subscription_resumed": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            cancelled_at: null,
            ends_at: null,
          })
          .eq("lemonsqueezy_subscription_id", String(data.id));

        if (error) {
          console.error("Error resuming subscription:", error);
          throw error;
        }
        console.log(`Subscription resumed for subscription ${data.id}`);
        break;
      }

      case "subscription_expired": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "expired",
          })
          .eq("lemonsqueezy_subscription_id", String(data.id));

        if (error) {
          console.error("Error expiring subscription:", error);
          throw error;
        }
        console.log(`Subscription expired for subscription ${data.id}`);
        break;
      }

      case "subscription_payment_success": {
        // Update the subscription period on successful payment
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: attributes.current_period_start,
            current_period_end: attributes.renews_at,
          })
          .eq("lemonsqueezy_subscription_id", String(attributes.subscription_id));

        if (error) {
          console.error("Error updating subscription after payment:", error);
          throw error;
        }
        console.log(`Payment successful for subscription ${attributes.subscription_id}`);
        break;
      }

      case "subscription_payment_failed": {
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
          })
          .eq("lemonsqueezy_subscription_id", String(attributes.subscription_id));

        if (error) {
          console.error("Error updating subscription after failed payment:", error);
          throw error;
        }
        console.log(`Payment failed for subscription ${attributes.subscription_id}`);
        break;
      }

      default:
        console.log(`Unhandled event: ${eventName}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Map Lemonsqueezy status to our status
function mapStatus(lsStatus: string): string {
  const statusMap: Record<string, string> = {
    "active": "active",
    "cancelled": "cancelled",
    "expired": "expired",
    "past_due": "past_due",
    "paused": "paused",
    "on_trial": "active",
    "unpaid": "past_due",
  };
  return statusMap[lsStatus] || "inactive";
}
