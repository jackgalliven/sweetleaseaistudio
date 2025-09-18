
import React from 'react';

interface SummaryCardProps {
  title: string;
  children: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white p-5 rounded-lg border border-slate-200 h-full">
      <h4 className="text-base font-semibold text-slate-800 mb-3 lowercase font-sans">{title}</h4>
      <div className="text-slate-700 space-y-1 text-sm">
        {children}
      </div>
    </div>
  );
};

export default SummaryCard;