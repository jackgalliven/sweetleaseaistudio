
import React from 'react';

interface ProcessingIndicatorProps {
  message: string;
}

const ProcessingIndicator: React.FC<ProcessingIndicatorProps> = ({ message }) => {
  return (
    <div className="w-full max-w-md mx-auto bg-white p-8 rounded-lg border border-slate-200 flex flex-col items-center justify-center text-center">
        <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-12 w-12 mb-4 animate-spin" style={{borderTopColor: '#3b82f6'}}></div>
        <h2 className="text-xl font-bold text-slate-900 mb-2 lowercase font-sans">processing document...</h2>
        <p className="text-slate-500">{message}</p>
    </div>
  );
};

export default ProcessingIndicator;