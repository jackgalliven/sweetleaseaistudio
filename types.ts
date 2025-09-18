// Fix for Vite env variables typescript error since a new .d.ts file cannot be added.
// This informs TypeScript about the shape of import.meta.env provided by Vite.
// Reference: https://vitejs.dev/guide/env-and-mode.html#intellisense-for-typescript
interface ImportMetaEnv {
  readonly VITE_STRIPE_PRO_PRICE_ID: string;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export enum AppState {
  LANDING,
  LOGIN,
  UPLOAD,
  PROCESSING,
  RESULTS,
  PROFILE,
}

export interface User {
  uid: string;
  email: string;
  initials: string;
  role: 'user' | 'admin';
  subscriptionStatus: 'free' | 'pro';
}

export interface LeaseData {
  summary: string;
  parties: {
    tenant: string;
    landlord: string;
  };
  dates: {
    commencementDate: string;
    term: string;
    expirationDate: string;
  };
  rent: {
    amount: string;
    frequency: string;
    nextDueDate: string;
  };
  clauses: {
    breakClause: string;
    permittedUse: string;
  };
  criticalDates: {
    date: string;
    description: string;
    category: 'Rent' | 'Notice' | 'Compliance' | 'Other';
  }[];
  ocrConfidence?: number;
}

export interface OcrResult {
  fullText: string;
  pageConfidence: number[];
  overallConfidence: number;
}

export interface ChatMessage {
  role: 'user' | 'model' | 'error';
  text: string;
}

export interface LeaseAnalysis {
  id: string;
  userId: string;
  fileName: string;
  leaseData: LeaseData;
  fullText: string;
}

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error';
}
