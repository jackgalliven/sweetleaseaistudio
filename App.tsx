import React, { useState, useEffect, useCallback } from 'react';
import { AppState, LeaseData, OcrResult, LeaseAnalysis, User, ToastMessage } from './types';
import FileUpload from './components/FileUpload';
import ProcessingIndicator from './components/ProcessingIndicator';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import ToastNotification from './components/ToastNotification';
import { extractTextFromPdf } from './services/ocrService';
import { analyzeLease } from './services/geminiService';
import { auth, db } from './services/firebase';
import { onAuthStateChanged, signOut, User as FirebaseUser } from 'firebase/auth';
import { collection, query, where, getDocs, addDoc, doc, setDoc, getDoc } from 'firebase/firestore';


const getInitials = (email: string) => {
    if (!email) return '??';
    const parts = email.split('@')[0].split(/[._-]/);
    if (parts.length > 1 && parts[0] && parts[parts.length - 1]) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(AppState.LANDING);
  const [processingMessage, setProcessingMessage] = useState<string>('Starting process...');
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  // Current analysis state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [leaseData, setLeaseData] = useState<LeaseData | null>(null);
  const [fullText, setFullText] = useState<string>('');
  const [currentLeaseId, setCurrentLeaseId] = useState<string | null>(null);

  // User's saved leases
  const [savedLeases, setSavedLeases] = useState<LeaseAnalysis[]>([]);

  const showToast = (message: string, type: 'success' | 'error' = 'error') => {
    setToast({ id: Date.now(), message, type });
  };

  // Effect to listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && firebaseUser.email) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        let user: User;

        if (userDocSnap.exists()) {
            const docData = userDocSnap.data();
            user = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                initials: getInitials(firebaseUser.email),
                role: docData.role || (firebaseUser.email === 'admin@sweetlease.app' ? 'admin' : 'user'),
                subscriptionStatus: docData.subscriptionStatus || 'free',
            };
        } else {
            // New user, create a profile document
            user = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                initials: getInitials(firebaseUser.email),
                role: firebaseUser.email === 'admin@sweetlease.app' ? 'admin' : 'user',
                subscriptionStatus: 'free',
            };
            await setDoc(userDocRef, { 
                uid: user.uid,
                email: user.email,
                role: user.role,
                subscriptionStatus: user.subscriptionStatus,
            });
        }

        setCurrentUser(user);
        setAppState(AppState.UPLOAD);
        await fetchSavedLeases(user.uid);
      } else {
        setCurrentUser(null);
        setAppState(AppState.LANDING);
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
        showToast("Could not load your saved leases.");
    }
  };


  const handleFileUpload = (file: File) => {
    if (currentUser?.subscriptionStatus === 'free' && savedLeases.length >= 3) {
      showToast("You've reached the 3-lease limit for the free plan. Please upgrade.");
      return;
    }
    setSelectedFile(file);
    setAppState(AppState.PROCESSING);
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
      showToast(`Failed to process lease. ${errorMessage}`);
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
    setCurrentLeaseId(null);
  };

  const handleAnalyzeAnother = () => {
    resetAnalysis();
    setAppState(AppState.UPLOAD);
  };

  const handleSignOut = async () => {
    try {
        await signOut(auth);
        // The onAuthStateChanged listener will handle state cleanup and navigation
    } catch (error) {
        console.error("Error signing out: ", error);
        showToast("Failed to sign out. Please try again.");
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
        showToast("Lease saved successfully!", "success");
    } catch (e) {
        console.error("Error adding document to Firestore: ", e);
        showToast("Could not save your lease analysis. Please try again.");
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
        return <ProcessingIndicator message="Loading Sweetlease..." />;
    }
    
    switch (appState) {
      case AppState.LANDING:
        return <LandingPage onNavigateToAuth={() => setAppState(AppState.LOGIN)} />;
      case AppState.LOGIN:
        return <LoginPage onBack={() => setAppState(AppState.LANDING)} showToast={showToast} />;
      case AppState.PROFILE:
        return currentUser && <ProfilePage user={currentUser} savedLeases={savedLeases} onViewLease={handleViewSavedLease} onSignOut={handleSignOut} showToast={showToast} />;
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
        return <FileUpload onFileUpload={handleFileUpload} />;
    }
  };
  
  const showHeader = currentUser && appState !== AppState.LANDING && appState !== AppState.LOGIN;

  return (
    <div className="min-h-screen text-slate-800">
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
      {showHeader && <Header user={currentUser} onNavigateProfile={() => setAppState(AppState.PROFILE)} onNavigateHome={() => setAppState(AppState.UPLOAD)} showToast={showToast} />}
      <main className={showHeader ? "py-8" : ""}>
        <div className={appState === AppState.LANDING ? "w-full max-w-full p-0" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
            {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;