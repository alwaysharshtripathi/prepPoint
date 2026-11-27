'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState('mixed');

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setUser(session.user);
      }
      setLoading(false);
    };
    checkSession();
  }, [router]);

  // FIXED: Appended &t=${Date.now()} to bust Next.js cache and force a hard reset
  const handleStartSprint = () => {
    router.push(`/assessment?mode=sprint&difficulty=${selectedDifficulty}&t=${Date.now()}`);
  };

  const handleStartFullMock = () => {
    router.push(`/assessment?mode=full&t=${Date.now()}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      
      {/* NAVIGATION BAR */}
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
        <div className="flex items-center gap-2">
          <svg className="w-7 h-7 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <circle cx="12" cy="12" r="6"></circle>
            <circle cx="12" cy="12" r="2"></circle>
          </svg>
          <span className="text-xl font-bold tracking-tight text-slate-900">PrepPoint</span>
        </div>
        
        <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition">
          <span className="text-sm font-bold text-slate-700 hidden sm:block">
            {user.user_metadata?.full_name || user.email}
          </span>
          <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-extrabold uppercase shadow-sm">
            {(user.user_metadata?.full_name || user.email).charAt(0)}
          </div>
        </Link>
      </nav>

      {/* MAIN CONTENT */}
      <main className="max-w-5xl mx-auto mt-10 px-4">
        
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900">
            Welcome back, {user.user_metadata?.full_name?.split(' ')[0] || 'Candidate'}
          </h1>
          <p className="text-slate-500 font-medium mt-1">Ready to benchmark your skills today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 60-MIN SPRINT CARD */}
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 flex flex-col hover:border-blue-100 shadow-sm transition-all">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">60-Min Practice Sprint</h2>
            <p className="text-slate-500 text-sm mb-6 flex-1">
              A fast-paced 45-question sprint to keep your fundamentals sharp.
            </p>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                Select Difficulty
              </label>
              <select 
                value={selectedDifficulty} 
                onChange={(e) => setSelectedDifficulty(e.target.value)} 
                className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-bold outline-none focus:border-blue-500"
              >
                <option value="mixed">Mixed (Adaptive)</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            
            <button onClick={handleStartSprint} className="w-full py-4 bg-blue-600 text-white rounded-xl font-extrabold hover:bg-blue-700 transition">
              Start Sprint
            </button>
          </div>

          {/* 120-MIN FULL MOCK CARD */}
          <div className="bg-white border-2 border-slate-100 rounded-3xl p-8 flex flex-col hover:border-purple-100 shadow-sm relative overflow-hidden transition-all">
            <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-xs font-extrabold px-4 py-2 rounded-bl-2xl">
              CORE BENCHMARK
            </div>
            
            <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            
            <h2 className="text-xl font-extrabold text-slate-900 mb-2">120-Min Standard OA</h2>
            <p className="text-slate-500 text-sm mb-6 flex-1">
              A grueling 60-question mock test featuring strict domain distribution.
            </p>
            
            <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-1">
                <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                Strict Anti-Cheat Enforced
              </div>
              <div className="text-xs text-slate-500">Requires uninterrupted full-screen mode.</div>
            </div>
            
            <button onClick={handleStartFullMock} className="w-full py-4 bg-slate-900 text-white rounded-xl font-extrabold hover:bg-slate-800 mt-auto transition">
              Start Full Assessment
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}