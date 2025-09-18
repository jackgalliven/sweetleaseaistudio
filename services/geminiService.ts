
import { functions } from './firebase';
import { httpsCallable } from 'firebase/functions';

const callFirebaseFunction = async (functionName: string, data: any) => {
    try {
        const func = httpsCallable(functions, functionName);
        const response = await func(data);
        // The callable function returns an object with a 'data' property.
        return response.data as string;
    } catch (error) {
        console.error(`Error calling Firebase Function '${functionName}':`, error);
        // Provide a more user-friendly error message
        throw new Error("The AI service is currently unavailable. Please try again later.");
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
