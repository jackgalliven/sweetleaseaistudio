
import React from 'react';
import { LeaseAnalysis, User } from '../types';

interface ProfilePageProps {
  user: User;
  savedLeases: LeaseAnalysis[];
  onViewLease: (lease: LeaseAnalysis) => void;
  onSignOut: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ user, savedLeases, onViewLease, onSignOut }) => {
  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 lowercase font-sans">My Saved Leases</h2>
          <p className="text-slate-500">Viewing documents for <span className="font-semibold text-slate-600">{user.email}</span>.</p>
        </div>
        <button
            onClick={onSignOut}
            className="mt-4 sm:mt-0 text-sm font-semibold text-red-600 hover:underline"
        >
            Sign Out
        </button>
      </div>

      <div className="space-y-4">
        {savedLeases.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-slate-900">No saved leases</h3>
            <p className="mt-1 text-sm text-slate-500">Get started by analyzing a new lease agreement.</p>
          </div>
        ) : (
          savedLeases.map(lease => (
            <div key={lease.id} className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-sm transition-shadow">
              <div className="flex-shrink-0 text-brand-secondary">
                 <svg xmlns="http://www.w.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-1 4h-4m2-10V4M5 8h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2z" /></svg>
              </div>
              <div className="flex-1 ml-4">
                <p className="font-semibold text-slate-800">{lease.fileName}</p>
                <p className="text-sm text-slate-500">
                  {lease.leaseData.parties.tenant} / {lease.leaseData.parties.landlord}
                </p>
              </div>
              <button
                onClick={() => onViewLease(lease)}
                className="ml-4 bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-4 border border-slate-300 rounded-lg transition-colors text-sm"
              >
                View Analysis
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProfilePage;