
import React, { useState, useEffect, useCallback } from 'react';
import { AppState, LeaseData, OcrResult, LeaseAnalysis, User } from './types';
import FileUpload from './components/FileUpload';
import ProcessingIndicator from './components/ProcessingIndicator';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import { extractTextFromPdf } from './services/ocrService';
import { analyzeLease, answerFromLease } from './services/geminiService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, setDoc } from 'firebase/firestore';


const getInitials = (email: string) => {
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.LOGIN);
  const [processingMessage, setProcessingMessage] = useState<string>('Starting process...');
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Current analysis state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [leaseData, setLeaseData] = useState<LeaseData | null>(null);
  const [fullText, setFullText] = useState<string>('');
  const [currentLeaseId, setCurrentLeaseId] = useState<string | null>(null);

  // User's saved leases
  const [savedLeases, setSavedLeases] = useState<LeaseAnalysis[]>([]);

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        const user: User = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            initials: getInitials(firebaseUser.email),
            // In a real app, you might get the role from custom claims or Firestore
            role: firebaseUser.email === 'admin@sweetlease.app' ? 'admin' : 'user',
        };
        setCurrentUser(user);
        setAppState(AppState.UPLOAD);
        await fetchSavedLeases(user.uid);
      } else {
        setCurrentUser(null);
        setAppState(AppState.LOGIN);
        setSavedLeases([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const fetchSavedLeases = async (userId: string) => {
    try {
        const leasesRef = collection(db, 'leases');
        const q = query(leasesRef, where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const leases: LeaseAnalysis[] = [];
        querySnapshot.forEach((doc) => {
            leases.push({ id: doc.id, ...doc.data() } as LeaseAnalysis);
        });
        setSavedLeases(leases);
    } catch (e) {
        console.error("Error fetching leases from Firestore: ", e);
        setError("Could not load your saved leases.");
    }
  };


  const handleFileUpload = (file: File) => {
    setSelectedFile(file);
    setAppState(AppState.PROCESSING);
    setError(null);
    setCurrentLeaseId(null); // It's a new analysis
  };
  
  const processLease = useCallback(async () => {
    if (!selectedFile) return;

    try {
      setProcessingMessage('Extracting text from PDF...');
      const ocrResult: OcrResult = await extractTextFromPdf(selectedFile);
      setFullText(ocrResult.fullText);

      setProcessingMessage('Analyzing lease with AI...');
      const analysisResult = await analyzeLease(ocrResult.fullText);
      
      const parsedLeaseData = JSON.parse(analysisResult);
      parsedLeaseData.ocrConfidence = ocrResult.overallConfidence;
      
      setLeaseData(parsedLeaseData);
      setAppState(AppState.RESULTS);

    } catch (err) {
      console.error("Processing failed:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during processing.";
      setError(`Failed to process lease. ${errorMessage}`);
      setAppState(AppState.UPLOAD);
    }
  }, [selectedFile]);

  useEffect(() => {
    if (appState === AppState.PROCESSING && selectedFile) {
      processLease();
    }
  }, [appState, selectedFile, processLease]);

  const resetAnalysis = () => {
    setSelectedFile(null);
    setLeaseData(null);
    setFullText('');
    setError(null);
    setCurrentLeaseId(null);
  };

  const handleAnalyzeAnother = () => {
    resetAnalysis();
    setAppState(AppState.UPLOAD);
  };

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        // The onAuthStateChanged listener will handle state cleanup
    } catch (error) {
        console.error("Error signing out: ", error);
        setError("Failed to sign out. Please try again.");
    }
  };

  const handleSaveLease = async () => {
    if (!leaseData || !fullText || !selectedFile || !currentUser) return;
    const newLease: Omit<LeaseAnalysis, 'id'> = {
      userId: currentUser.uid,
      fileName: selectedFile.name,
      leaseData,
      fullText,
    };
    try {
        const docRef = await addDoc(collection(db, "leases"), newLease);
        setSavedLeases(prev => [...prev, { ...newLease, id: docRef.id }]);
        setCurrentLeaseId(docRef.id);
    } catch (e) {
        console.error("Error adding document to Firestore: ", e);
        setError("Could not save your lease analysis. Please try again.");
    }
  };

  const handleViewSavedLease = (lease: LeaseAnalysis) => {
    setLeaseData(lease.leaseData);
    setFullText(lease.fullText);
    setSelectedFile(new File([], lease.fileName)); // Mock file for filename display
    setCurrentLeaseId(lease.id);
    setAppState(AppState.RESULTS);
  };
  
  const renderContent = () => {
    if (authLoading) {
        return <ProcessingIndicator message="Authenticating..." />;
    }
    if (!currentUser) {
      return <LoginPage />;
    }
    
    switch (appState) {
      case AppState.PROFILE:
        return <ProfilePage user={currentUser} savedLeases={savedLeases} onViewLease={handleViewSavedLease} onSignOut={handleSignOut} />;
      case AppState.PROCESSING:
        return <ProcessingIndicator message={processingMessage} />;
      case AppState.RESULTS:
        const isSaved = currentLeaseId ? savedLeases.some(l => l.id === currentLeaseId) : false;
        return leaseData && (
          <Dashboard 
            leaseData={leaseData} 
            fullText={fullText} 
            onReset={handleAnalyzeAnother}
            onSaveLease={handleSaveLease}
            isSaved={isSaved}
          />
        );
      case AppState.UPLOAD:
      default:
        return <FileUpload onFileUpload={handleFileUpload} error={error} />;
    }
  };

  return (
    <div className="min-h-screen text-slate-800">
      {currentUser && <Header user={currentUser} onNavigateProfile={() => setAppState(AppState.PROFILE)} onNavigateHome={() => setAppState(AppState.UPLOAD)} />}
      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
