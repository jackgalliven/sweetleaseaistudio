import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

// This will read from your .env.local file in a Vite project.
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_STRIPE_PUBLISHABLE_KEY";

const createCheckoutSessionCallable = httpsCallable(functions, 'createCheckoutSession');

let stripeInstance: any = null;

const getStripe = () => {
  if (!stripeInstance && (window as any).Stripe && !STRIPE_PUBLISHABLE_KEY.includes("YOUR_")) {
    // @ts-ignore
    stripeInstance = window.Stripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripeInstance;
};

export const redirectToCheckout = async (priceId: string) => {
    if (STRIPE_PUBLISHABLE_KEY.includes("YOUR_")) {
        throw new Error("Stripe is not configured. Please add your VITE_STRIPE_PUBLISHABLE_KEY to your .env.local file.");
    }

    try {
        const { data } = await createCheckoutSessionCallable({ priceId });
        const sessionId = (data as any).sessionId;

        if (!sessionId) {
            throw new Error("Could not retrieve a checkout session from the backend.");
        }
        
        const stripe = getStripe();
        if (stripe) {
            const { error } = await stripe.redirectToCheckout({ sessionId });
            if (error) {
                console.error("Stripe redirection error:", error);
                throw new Error("Failed to redirect to payment page. Please try again.");
            }
        } else {
            throw new Error("Stripe.js has not loaded or is misconfigured. Please check your connection and try again.");
        }
    } catch (error) {
        console.error("Error creating checkout session:", error);
        // Re-throw the error to be caught by the calling component's UI
        throw error;
    }
};