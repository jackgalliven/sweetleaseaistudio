import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    AuthErrorCodes
} from 'firebase/auth';

const getFirebaseErrorMessage = (errorCode: string) => {
    switch (errorCode) {
        case AuthErrorCodes.INVALID_EMAIL:
            return "Please enter a valid email address.";
        case AuthErrorCodes.USER_DELETED:
            return "This user account has been deleted.";
        case AuthErrorCodes.INVALID_PASSWORD:
            return "Incorrect password. Please try again.";
        case AuthErrorCodes.EMAIL_EXISTS:
            return "An account already exists with this email. Please sign in.";
        case "auth/invalid-credential":
             return "Invalid credentials. Please check your email and password.";
        default:
            return "An unexpected error occurred. Please try again.";
    }
}

interface LoginPageProps {
    onBack: () => void;
    showToast: (message: string, type?: 'success' | 'error') => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onBack, showToast }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [isResetView, setIsResetView] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // On successful login/signup, the onAuthStateChanged listener in App.tsx will handle navigation.
    } catch (err: any) {
      showToast(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };
  
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      showToast("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset link sent! Please check your inbox.", 'success');
      setIsResetView(false); // Go back to login view
    } catch (err: any) {
      showToast(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };
  
  const toggleView = (login: boolean, reset: boolean) => {
      setIsLoginView(login);
      setIsResetView(reset);
      setEmail('');
      setPassword('');
  }

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <div className="relative w-full max-w-md bg-white p-8 rounded-lg border border-slate-200 shadow-md">
        {!isResetView && <button onClick={onBack} className="absolute top-4 left-4 text-slate-500 hover:text-slate-800 transition-colors" aria-label="Go back">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
        </button>}

        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900 font-sans">sweetlease</h1>
          <p className="text-slate-500 mt-2">
            {isResetView ? 'Reset your password.' : isLoginView ? 'Sign in to manage your leases.' : 'Create an account to get started.'}
          </p>
        </div>
        
        {isResetView ? (
           <form onSubmit={handleResetSubmit} className="space-y-6">
             <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm" placeholder='you@example.com' />
             </div>
             <div>
                <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors disabled:bg-slate-400">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
             </div>
           </form>
        ) : (
           <form onSubmit={handleAuthSubmit} className="space-y-6">
             <div>
               <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email address</label>
               <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm" placeholder='you@example.com' />
             </div>
             <div>
               <label htmlFor="password"className="block text-sm font-medium text-slate-700">Password</label>
               <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm" placeholder="••••••••" />
             </div>
             <div>
               <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors disabled:bg-slate-400">
                 {loading ? 'Processing...' : (isLoginView ? 'Sign in' : 'Create Account')}
               </button>
             </div>
           </form>
        )}
        
        <div className="mt-6 text-center">
            {isResetView ? (
                <button onClick={() => toggleView(true, false)} className="text-sm text-brand-secondary hover:underline">Back to Sign in</button>
            ) : isLoginView ? (
                <div className="flex justify-between">
                     <button onClick={() => toggleView(false, false)} className="text-sm text-brand-secondary hover:underline">Need an account? Sign up</button>
                     <button onClick={() => toggleView(true, true)} className="text-sm text-slate-500 hover:underline">Forgot password?</button>
                </div>
            ) : (
                 <button onClick={() => toggleView(true, false)} className="text-sm text-brand-secondary hover:underline">Already have an account? Sign in</button>
            )}
        </div>

      </div>
    </div>
  );
};

export default LoginPage;