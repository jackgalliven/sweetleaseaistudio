
import {onCall} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {initializeApp} from "firebase-admin/app";
import {GoogleGenAI, Type} from "@google/genai";

// Initialize Firebase Admin SDK
initializeApp();

// Access secret API key
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  logger.error(
    "GEMINI_API_KEY is not set in environment variables.",
    {structuredData: true},
  );
  throw new Error("API key not configured.");
}

const ai = new GoogleGenAI({apiKey: GEMINI_API_KEY});

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

  logger.info("Analyzing lease for user: " + request.auth.uid,
    {structuredData: true});

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

  logger.info(`Answering question for user: ${request.auth.uid}`,
    {structuredData: true});

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
