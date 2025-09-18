import React, { useState, useRef } from 'react';
import { LeaseData, ChatMessage } from '../types';
import SummaryCard from './SummaryCard';
import CriticalDateItem from './CriticalDateItem';
import { answerFromLease } from '../services/geminiService';

interface DashboardProps {
  leaseData: LeaseData;
  fullText: string;
  onReset: () => void;
  onSaveLease: () => void;
  isSaved: boolean;
}

enum Tab {
  Summary,
  FullText,
  CriticalDates,
}

const Dashboard: React.FC<DashboardProps> = ({ leaseData, fullText, onReset, onSaveLease, isSaved }) => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.Summary);
  const [searchTerm, setSearchTerm] = useState('');
  const summaryRef = useRef<HTMLDivElement>(null);

  // State for chat feature
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);

  const handleDownloadStyledSummary = async () => {
    if (activeTab !== Tab.Summary) {
      alert("Please switch to the Summary tab to download the PDF.");
      return;
    }
    if (!summaryRef.current) {
        alert("Could not find summary content to download.");
        return;
    }

    const pdfContainer = document.createElement('div');
    pdfContainer.style.position = 'absolute';
    pdfContainer.style.left = '-9999px';
    pdfContainer.style.width = summaryRef.current.clientWidth + 'px';
    pdfContainer.style.padding = '24px';
    pdfContainer.style.backgroundColor = 'white';
    pdfContainer.style.fontFamily = '"Roboto Mono", monospace';


    const header = document.createElement('div');
    header.innerHTML = `
      <h1 style="font-family: 'Archivo Black', sans-serif; font-size: 24px; color: #1e3a8a; margin: 0;">sweetlease</h1>
      <p style="font-family: 'Roboto Mono', monospace; font-size: 14px; color: #64748b; margin-top: 4px;">Lease Analysis Summary</p>
      <hr style="border-top: 1px solid #e2e8f0; margin: 16px 0;" />
    `;
    
    const summaryContent = summaryRef.current.cloneNode(true) as HTMLElement;

    pdfContainer.appendChild(header);
    pdfContainer.appendChild(summaryContent);

    document.body.appendChild(pdfContainer);

    // @ts-ignore
    const canvas = await window.html2canvas(pdfContainer, {
      scale: 2,
      useCORS: true,
    });

    document.body.removeChild(pdfContainer);

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    
    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'px',
      format: 'a4',
    });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save('sweetlease_summary.pdf');
  };

  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    const question = currentQuestion.trim();
    if (!question || isAnswering) return;

    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', text: question }];
    setChatHistory(newHistory);
    setCurrentQuestion('');
    setIsAnswering(true);

    try {
      const answer = await answerFromLease(fullText, question);
      setChatHistory([...newHistory, { role: 'model', text: answer }]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setChatHistory([...newHistory, { role: 'error', text: `Sorry, I couldn't get an answer. ${errorMessage}` }]);
    } finally {
      setIsAnswering(false);
    }
  };


  const renderTabContent = () => {
    switch (activeTab) {
      case Tab.CriticalDates:
        return (
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-slate-900 mb-4 lowercase font-sans">Critical Dates & Notifications</h3>
            {leaseData.criticalDates.length > 0 ? (
                leaseData.criticalDates.map((date, index) => <CriticalDateItem key={index} dateInfo={date} />)
            ) : (
                <p className="text-slate-500">No critical dates were identified.</p>
            )}
          </div>
        );
      case Tab.FullText:
        const highlightedText = searchTerm ? 
          fullText.replace(new RegExp(searchTerm, 'gi'), match => `<mark class="bg-brand-accent/50 rounded">${match}</mark>`)
          : fullText;
        return (
          <div className="flex flex-col h-[75vh]">
             <div className="flex flex-col gap-6 flex-grow min-h-0">
              
              {/* AI Chat Section */}
              <div className="flex flex-col bg-white rounded-lg border border-slate-200 flex-shrink-0">
                <div className="p-4 border-b">
                  <h4 className="font-bold text-slate-800 lowercase font-sans">Ask AI About This Document</h4>
                  <p className="text-sm text-slate-500">Get quick answers from the lease text.</p>
                </div>
                {/* Chat History */}
                <div className="flex-grow p-4 space-y-4 overflow-y-auto max-h-48">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-slate-400 text-sm mt-4">
                      <p>Ask a question to get started.</p>
                      <p className="mt-2 text-xs">e.g., "What is the commencement date?"</p>
                    </div>
                  )}
                  {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md p-3 rounded-xl ${
                          msg.role === 'user' ? 'bg-brand-secondary text-white' :
                          msg.role === 'model' ? 'bg-slate-100 text-slate-800' :
                          'bg-red-100 text-red-700'
                      }`}>
                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {isAnswering && (
                    <div className="flex justify-start">
                      <div className="max-w-md p-3 rounded-xl bg-slate-100 text-slate-800">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse delay-75"></div>
                          <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse delay-150"></div>
                          <div className="w-2 h-2 bg-brand-secondary rounded-full animate-pulse delay-300"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                {/* Input Form */}
                <div className="p-4 border-t flex-shrink-0">
                  <form onSubmit={handleAskQuestion} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={currentQuestion}
                      onChange={(e) => setCurrentQuestion(e.target.value)}
                      placeholder="Ask a question..."
                      className="flex-grow p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent disabled:bg-slate-100"
                      disabled={isAnswering}
                      aria-label="Ask a question about the lease"
                    />
                    <button 
                      type="submit"
                      disabled={isAnswering || !currentQuestion.trim()}
                      className="bg-brand-primary text-white p-2 rounded-lg hover:bg-blue-800 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
                      aria-label="Submit question"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </button>
                  </form>
                </div>
              </div>

              {/* Full Text Viewer */}
              <div className="flex flex-col flex-grow min-h-0">
                <h3 className="text-2xl font-bold text-slate-900 mb-4 flex-shrink-0 lowercase font-sans">Full Extracted Text</h3>
                <div className="relative mb-4 flex-shrink-0">
                  <input 
                    type="text"
                    placeholder="Search within document..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-10 border border-slate-300 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent"
                  />
                  <svg className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg flex-grow overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-relaxed border" dangerouslySetInnerHTML={{ __html: highlightedText }} />
              </div>

            </div>
          </div>
        );
      case Tab.Summary:
      default:
        return (
          <div ref={summaryRef}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="md:col-span-2 lg:col-span-3">
                <SummaryCard title="AI Summary">
                  <p className="text-slate-600">{leaseData.summary}</p>
                </SummaryCard>
              </div>
              <SummaryCard title="Parties">
                <p><strong>Tenant:</strong> {leaseData.parties.tenant}</p>
                <p><strong>Landlord:</strong> {leaseData.parties.landlord}</p>
              </SummaryCard>
              <SummaryCard title="Key Dates">
                <p><strong>Commencement:</strong> {leaseData.dates.commencementDate}</p>
                <p><strong>Expiration:</strong> {leaseData.dates.expirationDate}</p>
                <p><strong>Term:</strong> {leaseData.dates.term}</p>
              </SummaryCard>
              <SummaryCard title="Rent Details">
                <p><strong>Amount:</strong> {leaseData.rent.amount}</p>
                <p><strong>Frequency:</strong> {leaseData.rent.frequency}</p>
                <p><strong>Next Due:</strong> {leaseData.rent.nextDueDate}</p>
              </SummaryCard>
              <SummaryCard title="Permitted Use">
                <p className="text-slate-600">{leaseData.clauses.permittedUse}</p>
              </SummaryCard>
              <SummaryCard title="Break Clause">
                <p className="text-slate-600">{leaseData.clauses.breakClause}</p>
              </SummaryCard>
              <SummaryCard title="Extraction Confidence">
                  <div className="w-full bg-slate-200 rounded-full h-4">
                    <div 
                      className="bg-brand-secondary h-4 rounded-full text-center text-white text-xs flex items-center justify-center" 
                      style={{width: `${leaseData.ocrConfidence || 0}%`}}
                    >
                      <span className="text-xs">{leaseData.ocrConfidence?.toFixed(1) || 0}%</span>
                    </div>
                  </div>
              </SummaryCard>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 lowercase font-sans">Lease Analysis</h2>
          <p className="text-slate-500">Extracted terms and insights from your document.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-4 sm:mt-0">
            <button
                onClick={handleDownloadStyledSummary}
                className="text-sm font-semibold text-brand-primary hover:underline"
                disabled={activeTab !== Tab.Summary}
                title={activeTab !== Tab.Summary ? "Switch to Summary tab to download" : "Download Summary as PDF"}
            >
                Download PDF
            </button>
            <button
                onClick={onSaveLease}
                disabled={isSaved}
                className="text-sm font-semibold text-brand-primary hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
            >
                {isSaved ? 'Saved' : 'Save Lease'}
            </button>
            <button
                onClick={onReset}
                className="bg-brand-primary hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-lg transition-colors text-sm"
            >
                Analyze Another
            </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex space-x-4 border-b border-slate-200">
          {[
            { label: 'Summary', tab: Tab.Summary },
            { label: 'Full Text', tab: Tab.FullText },
            { label: 'Critical Dates', tab: Tab.CriticalDates }
          ].map(({ label, tab }) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-1 py-2 text-sm font-semibold transition-colors duration-200 border-b-2
                ${activeTab === tab 
                  ? 'border-brand-primary text-slate-900' 
                  : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default Dashboard;