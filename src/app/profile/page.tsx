'use client'

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProfilePage() {
  const router = useRouter();
  
  // Auth & UI State
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'analytics' | 'history'>('details');

  // Profile Form State
  const [fullName, setFullName] = useState('');
  const [bio, setBio] = useState('');

  // Analytics & History State
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    testsTaken: 0,
    overallAccuracy: 0,
    categories: {} as Record<string, { score: number, total: number }>,
    difficulties: {} as Record<string, { score: number, total: number }>
  });

  useEffect(() => {
    const fetchSessionAndData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      
      setUser(session.user);
      setFullName(session.user.user_metadata?.full_name || '');
      setBio(session.user.user_metadata?.bio || '');

      // Fetch Performance History
      const { data: history, error } = await supabase
        .from('performance_history')
        .select('*')
        .eq('user_id', session.user.id);

      if (!error && history) {
        // Set raw history sorted by newest first
        setHistoryData(history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

        let totalScore = 0;
        let totalQs = 0;
        const catStats: Record<string, { score: number, total: number }> = {};
        const diffStats: Record<string, { score: number, total: number }> = {};

        history.forEach((test: any) => {
          totalScore += test.score;
          totalQs += test.total_questions;

          const cats = test.category_breakdown || {};
          Object.keys(cats).forEach(key => {
            if (!catStats[key]) catStats[key] = { score: 0, total: 0 };
            catStats[key].score += cats[key].score;
            catStats[key].total += cats[key].total;
          });

          const diffs = test.difficulty_breakdown || {};
          Object.keys(diffs).forEach(key => {
            const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
            if (!diffStats[formattedKey]) diffStats[formattedKey] = { score: 0, total: 0 };
            diffStats[formattedKey].score += diffs[key].score;
            diffStats[formattedKey].total += diffs[key].total;
          });
        });

        setStats({
          testsTaken: history.length,
          overallAccuracy: totalQs > 0 ? Math.round((totalScore / totalQs) * 100) : 0,
          categories: catStats,
          difficulties: diffStats
        });
      }
      
      setLoading(false);
    };
    
    fetchSessionAndData();
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, bio: bio }
      });
      if (error) throw error;
      alert("Profile updated successfully!");
    } catch (error: any) {
      alert(error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const getDifficultyColor = (tier: string) => {
    if (tier.toLowerCase() === 'easy') return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (tier.toLowerCase() === 'medium') return 'text-orange-600 bg-orange-50 border-orange-200';
    if (tier.toLowerCase() === 'hard') return 'text-rose-600 bg-rose-50 border-rose-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
      </div>
    );
  }

  if (!user) return null; 

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <nav className="flex justify-between items-center px-4 md:px-8 py-4 bg-white sticky top-0 z-10 shadow-sm border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2">
          <svg className="w-7 h-7 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>
          </svg>
          <span className="text-xl font-bold tracking-tight text-slate-900">PrepPoint</span>
        </Link>
        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-800 transition flex items-center gap-1">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Dashboard
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto mt-12 px-4">
        <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8">
          <div className="w-24 h-24 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-4xl font-extrabold shadow-sm uppercase border-4 border-white">
            {fullName ? fullName.charAt(0) : user.email?.charAt(0)}
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-extrabold text-slate-900">{fullName || 'My Profile'}</h1>
            <p className="text-slate-500 font-medium text-lg mt-1">{user.email}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex border-b border-slate-100 overflow-x-auto custom-scrollbar">
            <button onClick={() => setActiveTab('details')} className={`px-6 py-5 text-sm font-bold transition whitespace-nowrap ${activeTab === 'details' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>Account Details</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-6 py-5 text-sm font-bold transition whitespace-nowrap ${activeTab === 'analytics' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>Performance Analysis</button>
            <button onClick={() => setActiveTab('history')} className={`px-6 py-5 text-sm font-bold transition whitespace-nowrap ${activeTab === 'history' ? 'text-blue-700 border-b-2 border-blue-700 bg-blue-50/50' : 'text-slate-500 hover:bg-slate-50'}`}>My History</button>
          </div>

          <div className="p-8 md:p-12">
            {activeTab === 'details' && (
              <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSaveProfile} className="space-y-6 mb-10">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                    <input type="email" value={user.email} disabled className="w-full p-4 rounded-xl bg-slate-100 text-slate-500 border border-slate-200 cursor-not-allowed font-medium" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
                    <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full p-4 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:border-blue-600 outline-none font-medium transition" placeholder="e.g., Harsh Tripathi" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Bio / Career Objective</label>
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} className="w-full p-4 rounded-xl bg-white text-slate-900 border-2 border-slate-200 focus:border-blue-600 outline-none font-medium transition" placeholder="e.g., B.Tech CSE student specializing in Cybersecurity..."></textarea>
                  </div>
                  <button type="submit" disabled={saving} className="w-full py-4 bg-slate-900 text-white rounded-xl font-extrabold hover:bg-slate-800 transition shadow-md disabled:opacity-70">
                    {saving ? 'Saving Updates...' : 'Save Profile Details'}
                  </button>
                </form>
                <div className="border-t border-slate-100 pt-8 mt-8">
                  <button onClick={handleLogout} className="w-full sm:w-auto px-8 py-4 bg-red-50 text-red-600 rounded-xl font-extrabold hover:bg-red-100 transition shadow-sm flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                    Log Out Securely
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-10 max-w-2xl mx-auto">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="text-4xl font-extrabold text-slate-900">{stats.testsTaken}</div>
                    <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wider">Total Tests</div>
                  </div>
                  <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 text-center shadow-sm">
                    <div className="text-4xl font-extrabold text-blue-600">{stats.overallAccuracy}%</div>
                    <div className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wider">Avg Accuracy</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Performance by Difficulty
                  </h3>
                  {Object.keys(stats.difficulties).length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-sm text-slate-500 font-semibold">Data will appear after your first assessment.</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {Object.entries(stats.difficulties).map(([tier, data]) => {
                        if(tier.toLowerCase() === 'mixed') return null;
                        const percent = Math.round((data.score / data.total) * 100);
                        return (
                          <div key={tier} className={`border-2 rounded-2xl p-5 shadow-sm text-center ${getDifficultyColor(tier)}`}>
                            <div className="text-xs font-extrabold uppercase tracking-widest mb-1">{tier}</div>
                            <div className="text-3xl font-black mb-1">{percent}%</div>
                            <div className="text-xs font-bold opacity-75">{data.score} / {data.total} correct</div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-slate-900 mb-6 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M3 3v18h18"></path><path d="m19 9-5 5-4-4-3 3"></path></svg>
                    Domain Mastery
                  </h3>
                  <div className="space-y-5">
                    {Object.keys(stats.categories).length === 0 ? (
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 font-semibold">Complete a test to generate your performance breakdown.</div>
                    ) : (
                      Object.entries(stats.categories).map(([cat, data]) => {
                        const percent = Math.round((data.score / data.total) * 100);
                        return (
                          <div key={cat} className="bg-white border-2 border-slate-100 rounded-2xl p-5 shadow-sm hover:border-blue-100 transition">
                            <div className="flex justify-between items-center mb-3">
                              <span className="font-extrabold text-slate-700 uppercase tracking-wide text-sm">{cat}</span>
                              <span className="font-extrabold text-slate-900 text-lg">{percent}%</span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-3 mb-2 overflow-hidden"><div className="bg-blue-600 h-3 rounded-full transition-all duration-1000 ease-out" style={{ width: `${percent}%` }}></div></div>
                            <div className="text-right text-xs font-bold text-slate-400">{data.score} out of {data.total} correct</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {historyData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    </div>
                    <h3 className="text-lg font-extrabold text-slate-900 mb-1">No History Found</h3>
                    <p className="text-slate-500">You haven't completed any assessments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {historyData.map((test) => {
                      const date = new Date(test.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
                      const accuracy = Math.round((test.score / test.total_questions) * 100);
                      const isFull = test.mode === 'full';

                      return (
                        <div key={test.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-sm transition gap-4">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isFull ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                              {isFull ? (
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                              ) : (
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-extrabold text-slate-900">{isFull ? 'Standard OA Mock' : 'Practice Sprint'}</span>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${isFull ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                                  {isFull ? '120-Min' : '60-Min'}
                                </span>
                              </div>
                              <div className="text-xs font-semibold text-slate-500">{date}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 w-full sm:w-auto bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl justify-between sm:justify-end">
                            <div className="text-center">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Score</div>
                              <div className="font-extrabold text-slate-900">{test.score} <span className="text-slate-400 text-sm">/ {test.total_questions}</span></div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Accuracy</div>
                              <div className={`font-extrabold ${accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-orange-500' : 'text-red-500'}`}>{accuracy}%</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Time</div>
                              <div className="font-extrabold text-slate-700">{formatTime(test.time_taken_seconds)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}