
export enum AppState {
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
