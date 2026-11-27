'use client'

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// We use a standard client for pure client-side auth forms
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Automatically confirms email for this prototype to speed up testing
        data: {
          full_name: email.split('@')[0], 
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg className="w-8 h-8 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <circle cx="12" cy="12" r="6"></circle>
              <circle cx="12" cy="12" r="2"></circle>
            </svg>
            <span className="text-2xl font-bold tracking-tight text-slate-900">PrepPoint</span>
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900">Create an Account</h1>
          <p className="text-slate-500 font-medium mt-2">Start your SDE preparation journey</p>
        </div>

        {success ? (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl font-bold text-center border border-emerald-200">
            Account created successfully! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleRegister} className="space-y-5">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold border border-red-100">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-medium focus:border-blue-600 focus:ring-0 outline-none transition"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-4 border-2 border-slate-200 rounded-xl bg-slate-50 text-slate-900 font-medium focus:border-blue-600 focus:ring-0 outline-none transition"
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-extrabold hover:bg-slate-800 transition disabled:opacity-75 shadow-md"
            >
              {loading ? 'Creating account...' : 'Register'}
            </button>

            <p className="text-center text-slate-500 font-medium text-sm pt-4">
              Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}