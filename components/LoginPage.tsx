
import React, { useState } from 'react';
import { auth } from '../services/firebase';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
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

const LoginPage: React.FC = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLoginView) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      // On successful login/signup, the onAuthStateChanged listener in App.tsx will handle navigation.
    } catch (err: any) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center pt-10">
      <div className="w-full max-w-md bg-white p-8 rounded-lg border border-slate-200 shadow-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900 font-sans">sweetlease</h1>
          <p className="text-slate-500 mt-2">
            {isLoginView ? 'Sign in to manage your leases.' : 'Create an account to get started.'}
          </p>
        </div>

        {error && (
             <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md mb-4 text-sm" role="alert">
                <p>{error}</p>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                placeholder='you@example.com'
              />
            </div>
          </div>

          <div>
            <label htmlFor="password"className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brand-primary hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-secondary transition-colors disabled:bg-slate-400"
            >
              {loading ? 'Processing...' : (isLoginView ? 'Sign in' : 'Create Account')}
            </button>
          </div>
        </form>
        
        <div className="mt-6 text-center">
            <button onClick={() => setIsLoginView(!isLoginView)} className="text-sm text-brand-secondary hover:underline">
                {isLoginView ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;
