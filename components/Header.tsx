import React from 'react';
import { User } from '../types';

interface HeaderProps {
  user: User;
  onNavigateProfile: () => void;
  onNavigateHome: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onNavigateProfile, onNavigateHome }) => {
  return (
    <header className="bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left section: Logo and Nav */}
          <div className="flex items-center space-x-8">
            <div className="flex-shrink-0 flex items-center space-x-2">
               <button onClick={onNavigateHome} className="text-2xl font-bold text-slate-900 font-sans">sweetlease</button>
               {user.role === 'admin' && (
                  <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">Admin</span>
               )}
            </div>
            <nav className="hidden md:flex items-center space-x-6">
              <button onClick={onNavigateHome} className="text-sm font-semibold text-slate-900 border-b-2 border-slate-900 pb-1">dashboard</button>
            </nav>
          </div>
          
          {/* Right section: Search and Profile */}
          <div className="flex items-center space-x-4">
            <div className="relative">
                <input
                    type="text"
                    placeholder="ask ai about your property..."
                    className="hidden lg:block w-72 pl-4 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:ring-brand-secondary focus:border-brand-secondary"
                />
            </div>
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