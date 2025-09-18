import React from 'react';
import { User } from '../types';
import { redirectToCheckout } from '../services/stripeService';

// This will read from your .env.local file in a Vite project.
const STRIPE_PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "price_YOUR_PRO_PRICE_ID";

interface HeaderProps {
  user: User;
  onNavigateProfile: () => void;
  onNavigateHome: () => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNavigateProfile, onNavigateHome, showToast }) => {
    
  const handleUpgradeClick = async () => {
    if (STRIPE_PRO_PRICE_ID.includes("YOUR_")) {
      showToast("Upgrade functionality is not configured. Please add VITE_STRIPE_PRO_PRICE_ID to your .env.local file.");
      return;
    }
    try {
      await redirectToCheckout(STRIPE_PRO_PRICE_ID);
    } catch (error) {
      console.error(error);
      showToast((error as Error).message);
    }
  };

  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo and Nav */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0 flex items-center space-x-2">
               <button onClick={onNavigateHome} className="text-2xl font-bold text-slate-900 font-sans">sweetlease</button>
               {user.subscriptionStatus === 'pro' && (
                  <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Pro</span>
               )}
               {user.role === 'admin' && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Admin</span>
               )}
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button onClick={onNavigateHome} className="text-sm font-semibold text-slate-900 border-b-2 border-slate-900 pb-1">dashboard</button>
            </nav>
          </div>
          
          {/* Right section: Profile and Upgrade */}
          <div className="flex items-center space-x-4">
            {user.subscriptionStatus === 'free' && user.role !== 'admin' && (
              <button
                onClick={handleUpgradeClick}
                className="hidden sm:block bg-brand-accent hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
              >
                Upgrade
              </button>
            )}
            <div className="flex-shrink-0">
              <button 
                onClick={onNavigateProfile}
                className="bg-slate-800 text-white w-10 h-10 flex items-center justify-center rounded-full font-bold text-sm hover:bg-slate-700 transition-colors"
                aria-label="View Profile"
              >
                {user.initials}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;