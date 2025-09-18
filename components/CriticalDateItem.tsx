
import React, { useState } from 'react';

interface CriticalDateInfo {
  date: string;
  description: string;
  category: 'Rent' | 'Notice' | 'Compliance' | 'Other';
}

interface CriticalDateItemProps {
  dateInfo: CriticalDateInfo;
}

const CategoryIcon: React.FC<{ category: CriticalDateInfo['category'] }> = ({ category }) => {
  const baseClasses = "w-6 h-6 mr-4";
  switch (category) {
    case 'Rent':
      return <svg className={baseClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>;
    case 'Notice':
      return <svg className={baseClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.144-6.363m5.561-1.442a3 3 0 00-5.561 1.442" /></svg>;
    case 'Compliance':
      return <svg className={baseClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    default:
      return <svg className={baseClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
  }
};

const CategoryBadge: React.FC<{ category: CriticalDateInfo['category'] }> = ({ category }) => {
  const baseClasses = "text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full";
  switch (category) {
    case 'Rent':
      return <span className={`${baseClasses} bg-green-100 text-green-800`}>Rent Payment</span>;
    case 'Notice':
      return <span className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Notice Period</span>;
    case 'Compliance':
      return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Compliance</span>;
    default:
      return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>General</span>;
  }
};


const CriticalDateItem: React.FC<CriticalDateItemProps> = ({ dateInfo }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reminderPeriod, setReminderPeriod] = useState('1m');

  const handleDownloadInvite = () => {
    // 1. Calculate reminder date
    const originalDate = new Date(dateInfo.date);
    const reminderDate = new Date(originalDate);

    switch (reminderPeriod) {
        case '1w': reminderDate.setDate(originalDate.getDate() - 7); break;
        case '2w': reminderDate.setDate(originalDate.getDate() - 14); break;
        case '1m': reminderDate.setMonth(originalDate.getMonth() - 1); break;
        case '3m': reminderDate.setMonth(originalDate.getMonth() - 3); break;
        case '6m': reminderDate.setMonth(originalDate.getMonth() - 6); break;
    }

    const eventEndDate = new Date(reminderDate);
    eventEndDate.setDate(eventEndDate.getDate() + 1);

    const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '');
    const icsStartDate = formatDate(reminderDate);
    const icsEndDate = formatDate(eventEndDate);
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '') + 'Z';

    const title = `Reminder: ${dateInfo.description}`;
    const description = `This is a reminder for the upcoming critical date: '${dateInfo.description}' scheduled for ${dateInfo.date}. Please ensure necessary actions are taken.`;

    const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Sweetlease//AI Lease Extractor//EN',
        'BEGIN:VEVENT',
        `UID:${timestamp}@sweetlease.app`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${icsStartDate}`,
        `DTEND;VALUE=DATE:${icsEndDate}`,
        `SUMMARY:${title}`,
        `DESCRIPTION:${description}`,
        'END:VEVENT',
        'END:VCALENDAR'
    ].join('\r\n');

    // 3. Trigger download
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reminder_${dateInfo.description.toLowerCase().replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setIsModalOpen(false);
  };

  return (
    <div className="flex items-center p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow">
      <div className="text-brand-secondary flex-shrink-0">
        <CategoryIcon category={dateInfo.category} />
      </div>
      <div className="flex-1">
        <div className="flex justify-between items-center">
          <p className="font-semibold text-slate-800">{dateInfo.description}</p>
          <p className="text-sm font-medium text-brand-primary whitespace-nowrap pl-4">{dateInfo.date}</p>
        </div>
        <div className="mt-1">
          <CategoryBadge category={dateInfo.category} />
        </div>
      </div>
      <div className="relative ml-4 flex-shrink-0">
        <button
            onClick={() => setIsModalOpen(prev => !prev)}
            title="Add to calendar"
            className="p-2 bg-slate-200 text-slate-600 hover:bg-brand-secondary hover:text-white rounded-lg transition-colors duration-200"
        >
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        </button>
        {isModalOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white p-3 rounded-lg shadow-2xl border z-10">
                <h6 className="text-sm font-semibold text-slate-800 mb-2 font-sans">Set Reminder</h6>
                <select 
                    value={reminderPeriod} 
                    onChange={(e) => setReminderPeriod(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                >
                    <option value="1w">1 week before</option>
                    <option value="2w">2 weeks before</option>
                    <option value="1m">1 month before</option>
                    <option value="3m">3 months before</option>
                    <option value="6m">6 months before</option>
                </select>
                <button 
                    onClick={handleDownloadInvite}
                    className="w-full mt-3 bg-brand-secondary hover:bg-blue-700 text-white font-bold py-2 px-3 text-sm rounded-md transition-colors"
                >
                    Download Invite
                </button>
                <button 
                    onClick={() => setIsModalOpen(false)}
                    className="w-full mt-1 text-xs text-slate-500 hover:text-slate-700"
                >
                    Cancel
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default CriticalDateItem;