

// Fix: Explicitly import Request and Response to fix type inference issues where properties on req and res were not found.
// `Response` is imported from `express`, not `firebase-functions/v2/https`.
import {onCall, onRequest, Request} from "firebase-functions/v2/https";
import type {Response} from "express";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {getFirestore} from "firebase-admin/firestore";
import {GoogleGenAI, Type} from "@google/genai";
import Stripe from "stripe";

// Initialize Firebase Admin SDK
initializeApp();
const db = getFirestore();

// Access secret API keys from environment variables
const GEMINI_API_KEY = process.env.API_KEY;
if (!GEMINI_API_KEY) {
  logger.error("API_KEY is not set in environment variables.");
  throw new Error("Gemini API key not configured.");
}

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  logger.error("STRIPE_SECRET_KEY is not set in environment variables.");
  throw new Error("Stripe secret key not configured.");
}

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});
const stripe = new Stripe(STRIPE_SECRET_KEY);

const leaseSchema = {
  type: Type.OBJECT,
  properties: {
    summary: {
      type: Type.STRING,
      description: "A concise, one-paragraph summary of the lease agreement.",
    },
    parties: {
      type: Type.OBJECT,
      properties: {
        tenant: {type: Type.STRING, description: "Full legal name of Tenant."},
        landlord: {
          type: Type.STRING,
          description: "Full legal name of Landlord.",
        },
      },
    },
    dates: {
      type: Type.OBJECT,
      properties: {
        commencementDate: {
          type: Type.STRING,
          description: "Start date in 'DD Month YYYY' format (e.g., '01 Jan 2024').",
        },
        term: {
          type: Type.STRING,
          description: "Total duration of the lease (e.g., '5 years').",
        },
        expirationDate: {
          type: Type.STRING,
          description: "End date in 'DD Month YYYY' format (e.g., '31 Dec 2029').",
        },
      },
    },
    rent: {
      type: Type.OBJECT,
      properties: {
        amount: {
          type: Type.STRING,
          description: "Rent amount with currency (e.g., '£5,000').",
        },
        frequency: {
          type: Type.STRING,
          description: "How often rent is paid (e.g., 'Per Calendar Month').",
        },
        nextDueDate: {
          type: Type.STRING,
          description: "Next rent due date in 'DD Month YYYY' format.",
        },
      },
    },
    clauses: {
      type: Type.OBJECT,
      properties: {
        breakClause: {
          type: Type.STRING,
          description: "Summarize break clause. If none, state 'No break clause found'.",
        },
        permittedUse: {
          type: Type.STRING,
          description: "Describe the permitted use of the property.",
        },
      },
    },
    criticalDates: {
      type: Type.ARRAY,
      description: "A list of critical dates from the lease.",
      items: {
        type: Type.OBJECT,
        properties: {
          date: {
            type: Type.STRING,
            description: "Date in 'DD Month YYYY' format (e.g., '29 Sep 2026').",
          },
          description: {
            type: Type.STRING,
            description: "What the date is for (e.g., 'Rent review date').",
          },
          category: {
            type: Type.STRING,
            enum: ["Rent", "Notice", "Compliance", "Other"],
            description: "The type of event.",
          },
        },
      },
    },
  },
};

export const analyzeLease = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required.");
  }
  const {leaseText} = request.data;
  if (!leaseText || typeof leaseText !== "string") {
    throw new Error("Invalid request: leaseText is required.");
  }

  logger.info("Analyzing lease for user: " + request.auth.uid);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze this property lease agreement and extract key information. Ensure all dates are formatted as 'DD Month YYYY'.\n\nLEASE TEXT:\n${leaseText}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: leaseSchema,
      },
    });

    return response.text;
  } catch (error) {
    logger.error("Gemini API error in analyzeLease:", error);
    throw new Error("The AI model could not process the document.");
  }
});


export const answerFromLease = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required.");
  }

  const {leaseText, question} = request.data;
  if (!leaseText || !question || typeof leaseText !== "string" ||
      typeof question !== "string") {
    throw new Error("Invalid request: leaseText and question are required.");
  }

  logger.info(`Answering question for user: ${request.auth.uid}`);

  const prompt = `
    You are a helpful legal assistant. Answer the user's question based ONLY 
    on the provided lease text. When you mention a date, format it as 
    'DD Month YYYY'. If the answer is not in the text, state that clearly.
    Keep answers concise.

    LEASE TEXT:
    ---
    ${leaseText}
    ---

    USER'S QUESTION:
    "${question}"
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    logger.error("Gemini API error in answerFromLease:", error);
    throw new Error("The AI model could not answer the question.");
  }
});


export const createCheckoutSession = onCall(async (request) => {
  if (!request.auth) {
    throw new Error("Authentication required to create checkout session.");
  }
  const uid = request.auth.uid;
  const {priceId} = request.data;
  const appUrl = process.env.APP_URL;

  if (!priceId) {
    throw new Error("Price ID is required.");
  }
  if (!appUrl) {
      logger.error("APP_URL is not set in environment variables.");
      throw new Error("Application URL is not configured.");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: `${appUrl}/profile`,
      cancel_url: `${appUrl}/profile`,
      client_reference_id: uid, // Pass the Firebase UID to the session
    });
    return {sessionId: session.id};
  } catch (e) {
    logger.error("Stripe checkout session creation failed", e);
    throw new Error("Failed to create Stripe session.");
  }
});

export const stripeWebhook = onRequest(
  {secrets: ["STRIPE_WEBHOOK_SECRET"]},
  // Fix: Explicitly type req and res parameters to resolve errors with accessing their properties.
  async (req: Request, res: Response) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
    } catch (err: any) {
      logger.error("Webhook signature verification failed.", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;

      if (!userId) {
        logger.error("No userId in checkout session", {id: session.id});
        res.status(400).send("Webhook Error: Missing client_reference_id");
        return;
      }

      try {
        const userRef = db.collection("users").doc(userId);
        await userRef.update({subscriptionStatus: "pro"});
        logger.info(`Successfully updated user ${userId} to pro plan.`);
      } catch (err) {
        logger.error(`Failed to update user ${userId} subscription.`, err);
        res.status(500).send("Internal Server Error");
        return;
      }
    }

    res.status(200).send();
  });
