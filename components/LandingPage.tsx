import React from 'react';
import { redirectToCheckout } from '../services/stripeService';

// This will read from your .env.local file in a Vite project.
const STRIPE_PRO_PRICE_ID = import.meta.env.VITE_STRIPE_PRO_PRICE_ID || "price_YOUR_PRO_PRICE_ID";

interface LandingPageProps {
  onNavigateToAuth: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToAuth }) => {
    
  const handleUpgradeClick = async () => {
    if (STRIPE_PRO_PRICE_ID.includes("YOUR_")) {
      alert("The upgrade functionality is not configured. Please add VITE_STRIPE_PRO_PRICE_ID to your .env.local file.");
      return;
    }
    try {
      // In a real app, you might want to force sign-up before checkout.
      // For this demo, we'll allow checkout directly.
      await redirectToCheckout(STRIPE_PRO_PRICE_ID);
    } catch (error) {
      console.error(error);
      alert((error as Error).message);
    }
  };

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-slate-900 font-sans">sweetlease</span>
            </a>
          </div>
          <div className="flex lg:flex-1 lg:justify-end">
            <button onClick={onNavigateToAuth} className="text-sm font-semibold leading-6 text-slate-900">
              Log in <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero section */}
        <div className="relative isolate overflow-hidden bg-gradient-to-b from-brand-light/20 pt-14">
            <div className="absolute inset-y-0 right-1/2 -z-10 -mr-96 w-[200%] origin-top-right skew-x-[-30deg] bg-white shadow-xl shadow-brand-secondary/10 ring-1 ring-brand-primary/5 sm:-mr-80 lg:-mr-96" aria-hidden="true" />
            <div className="mx-auto max-w-7xl px-6 py-32 sm:py-40 lg:px-8">
                <div className="mx-auto max-w-2xl lg:mx-0 lg:grid lg:max-w-none lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 xl:grid-cols-1 xl:grid-rows-1 xl:gap-x-8">
                <h1 className="max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl lg:col-span-2 xl:col-auto font-sans lowercase">Lease Agreements, <br/>Simplified.</h1>
                <div className="mt-6 max-w-xl lg:mt-0 xl:col-end-1 xl:row-start-1">
                    <p className="text-lg leading-8 text-slate-600">AI-powered analysis to unlock key insights from your property documents. Stop scanning, start understanding. Upload, analyze, and manage your leases with confidence.</p>
                    <div className="mt-10 flex items-center gap-x-6">
                    <button onClick={onNavigateToAuth} className="rounded-md bg-brand-primary px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary">Get started</button>
                    </div>
                </div>
                </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 -z-10 h-24 bg-gradient-to-t from-white sm:h-32" />
        </div>

        {/* Feature section */}
        <div className="mx-auto mt-12 max-w-7xl px-6 sm:mt-20 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
                <h2 className="text-base font-semibold leading-7 text-brand-secondary">Everything You Need</h2>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl font-sans lowercase">The smarter way to manage leases</p>
                <p className="mt-6 text-lg leading-8 text-slate-600">Sweetlease transforms dense legal documents into actionable data, helping you track dates, understand clauses, and get answers instantly.</p>
            </div>
            {/* Features grid */}
        </div>

        {/* Pricing section */}
        <div className="isolate overflow-hidden bg-slate-50 mt-20">
            <div className="mx-auto max-w-7xl px-6 pb-96 pt-24 text-center sm:pt-32 lg:px-8">
                <div className="mx-auto max-w-4xl">
                <h2 className="text-base font-semibold leading-7 text-brand-secondary">Pricing</h2>
                <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl font-sans lowercase">Simple, transparent pricing</p>
                </div>
                <div className="relative mt-6">
                <p className="mx-auto max-w-2xl text-lg leading-8 text-slate-600">Get started for free, and upgrade when you're ready for unlimited analysis.</p>
                </div>
            </div>
            <div className="flow-root bg-white pb-24 sm:pb-32">
                <div className="-mt-80">
                    <div className="mx-auto max-w-7xl px-6 lg:px-8">
                        <div className="mx-auto grid max-w-md grid-cols-1 gap-8 lg:max-w-4xl lg:grid-cols-2">
                        {/* Free Plan */}
                        <div className="flex flex-col justify-between rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-900/10 sm:p-10">
                            <div>
                                <h3 className="text-base font-semibold leading-7 text-brand-secondary">Free Plan</h3>
                                <div className="mt-4 flex items-baseline gap-x-2">
                                    <span className="text-5xl font-bold tracking-tight text-slate-900">$0</span>
                                    <span className="text-base font-semibold leading-7 text-slate-600">/month</span>
                                </div>
                                <p className="mt-6 text-base leading-7 text-slate-600">For individuals and small teams getting started with lease analysis.</p>
                                <ul role="list" className="mt-10 space-y-4 text-sm leading-6 text-slate-600">
                                    <li className="flex gap-x-3"><svg className="h-6 w-5 flex-none text-brand-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>Analyze up to 3 leases</li>
                                    <li className="flex gap-x-3"><svg className="h-6 w-5 flex-none text-brand-secondary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>AI-powered summaries</li>
                                </ul>
                            </div>
                            <button onClick={onNavigateToAuth} className="mt-10 block w-full rounded-md bg-brand-secondary px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-secondary">Get started for free</button>
                        </div>
                        {/* Pro Plan */}
                        <div className="flex flex-col justify-between rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-900/10 sm:p-10">
                            <div>
                                <h3 className="text-base font-semibold leading-7 text-brand-primary">Pro Plan</h3>
                                <div className="mt-4 flex items-baseline gap-x-2">
                                    <span className="text-5xl font-bold tracking-tight text-slate-900">$29</span>
                                    <span className="text-base font-semibold leading-7 text-slate-600">/month</span>
                                </div>
                                <p className="mt-6 text-base leading-7 text-slate-600">Unlock unlimited potential for your entire property portfolio.</p>
                                <ul role="list" className="mt-10 space-y-4 text-sm leading-6 text-slate-600">
                                    <li className="flex gap-x-3"><svg className="h-6 w-5 flex-none text-brand-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>Unlimited lease analysis</li>
                                    <li className="flex gap-x-3"><svg className="h-6 w-5 flex-none text-brand-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>Ask AI unlimited questions</li>
                                    <li className="flex gap-x-3"><svg className="h-6 w-5 flex-none text-brand-primary" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>Priority support</li>
                                </ul>
                            </div>
                            <button onClick={handleUpgradeClick} className="mt-10 block w-full rounded-md bg-brand-primary px-3 py-2 text-center text-sm font-semibold leading-6 text-white shadow-sm hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary">Upgrade to Pro</button>
                        </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-12 sm:mt-20" aria-labelledby="footer-heading">
        <h2 id="footer-heading" className="sr-only">Footer</h2>
        <div className="mx-auto max-w-7xl px-6 pb-8 lg:px-8">
            <div className="mt-16 border-t border-slate-900/10 pt-8 sm:mt-20 lg:mt-24">
                <p className="text-xs leading-5 text-slate-700">&copy; {new Date().getFullYear()} Sweetlease. All rights reserved.</p>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;