
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

const callFirebaseFunction = async (functionName: string, data: any) => {
    try {
        const func = httpsCallable(functions, functionName);
        const response = await func(data);
        return response.data as string;
    } catch (error: any) {
        console.error(`Error calling Firebase Function '${functionName}':`, error);
        // Provide a more user-friendly error message from the callable function error
        throw new Error(error.message || "The AI service is currently unavailable. Please try again later.");
    }
}

export const analyzeLease = (leaseText: string): Promise<string> => {
    if (!leaseText.trim()) {
        throw new Error("Cannot analyze an empty lease document. Text extraction might have failed.");
    }
    return callFirebaseFunction('analyzeLease', { leaseText });
};

export const answerFromLease = (leaseText: string, question: string): Promise<string> => {
    if (!leaseText.trim() || !question.trim()) {
        throw new Error("Lease text and question cannot be empty.");
    }
    return callFirebaseFunction('answerFromLease', { leaseText, question });
};