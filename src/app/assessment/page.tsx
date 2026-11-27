'use client'

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import QuestionManager from '../components/QuestionManager';

export default function AssessmentPage() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10">
      {/* Top Nav */}
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2 cursor-pointer">
          <svg className="w-7 h-7 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>
          </svg>
          <span className="text-xl font-bold tracking-tight text-slate-900">PrepPoint</span>
        </Link>
        <Link href="/" className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-full border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
          <span className="hidden sm:inline text-sm font-semibold text-slate-700">Exit Assessment</span>
          <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </Link>
      </nav>

      {/* Main Content */}
      <main className="flex flex-col items-center p-4 md:p-8 mt-4">
        <div className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200 pb-6 gap-4">
          <Suspense fallback={<div className="h-20 animate-pulse bg-slate-100 rounded-xl w-full"></div>}>
            <AssessmentHeader />
          </Suspense>
        </div>

        <div className="w-full max-w-6xl">
          <QuestionManager />
        </div>
      </main>
    </div>
  );
}

// Sub-component to handle the URL parameters safely
function AssessmentHeader() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  
  // Set values dynamically based on the mode
  const isFull = mode === 'full';
  const title = isFull ? "Standard SDE Mock Test" : "Assessment Sprint";
  const subtitle = isFull ? "120 Minutes • All Domains" : "60 Minutes • Rapid Fire";

  return (
    <div>
      <Link href="/" className="text-sm font-bold text-slate-400 hover:text-slate-700 flex items-center gap-1 mb-2 transition">
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 18l-6-6 6-6"/></svg> Back
      </Link>
      <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">
        {title}
      </h1>
      <p className="text-slate-500 font-medium text-sm mt-1">
        {subtitle}
      </p>
    </div>
  );
}