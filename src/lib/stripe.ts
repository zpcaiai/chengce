import Stripe from "stripe";

let client: Stripe | null = null;
export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Stripe is not configured");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true });
  return client;
}

export const priceForPlan = (plan: "DIAGNOSTIC" | "DELIVERY" | "CONTINUITY") => {
  const prices = { DIAGNOSTIC: process.env.STRIPE_PRICE_DIAGNOSTIC, DELIVERY: process.env.STRIPE_PRICE_DELIVERY, CONTINUITY: process.env.STRIPE_PRICE_CONTINUITY };
  const price = prices[plan];
  if (!price) throw new Error(`No Stripe price configured for ${plan}`);
  return price;
};
