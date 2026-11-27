'use client'

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ResultsScreen from './ResultsScreen';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Question {
  id: string;
  category: string;
  text: string;
  options: string[];
}

// ==========================================
// 1. THE WRAPPER 
// ==========================================
export default function QuestionManager() {
  const [attemptCounter, setAttemptCounter] = useState(1);
  
  return (
    <Suspense fallback={<div className="h-96 flex items-center justify-center bg-slate-50 rounded-3xl animate-pulse font-bold text-slate-400">Loading Assessment Engine...</div>}>
      <QuestionManagerCore key={attemptCounter} onRetake={() => setAttemptCounter(prev => prev + 1)} />
    </Suspense>
  );
}

// ==========================================
// 2. THE CORE ENGINE
// ==========================================
function QuestionManagerCore({ onRetake }: { onRetake: () => void }) {
  const searchParams = useSearchParams();
  const difficulty = searchParams.get('difficulty') || 'mixed';
  const mode = searchParams.get('mode') || 'sprint'; 

  const totalAllocatedSeconds = mode === 'full' ? 7200 : 3600;
  
  // --- TIMER & TEST STATES ---
  const [timeLeft, setTimeLeft] = useState<number>(totalAllocatedSeconds);
  const [isTestActive, setIsTestActive] = useState(false);
  const startTimeRef = useRef<number>(0);

  // App States
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finalResult, setFinalResult] = useState<{ score: number, total: number } | null>(null);

  // Bulletproof Refs 
  const answersRef = useRef(answers);
  const isSubmittingRef = useRef(false); 
  const violationCountRef = useRef(0); 
  const lastViolationTimeRef = useRef(0); // Prevents simultaneous events from double-triggering
  
  useEffect(() => { answersRef.current = answers; }, [answers]);

  // FETCH QUESTIONS
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch(`/api/questions?mode=${mode}&difficulty=${difficulty}`);
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setQuestions(data);
      } catch (error) {
        console.error("Error loading questions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadQuestions();
  }, [mode, difficulty]);

  // --- THE PRECISION TIMER ---
  useEffect(() => {
    if (!isTestActive) return;

    const intervalId = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remainingSeconds = totalAllocatedSeconds - elapsedSeconds;

      if (remainingSeconds <= 0) {
        clearInterval(intervalId);
        setTimeLeft(0);
        executeSubmission(answersRef.current, totalAllocatedSeconds); 
      } else {
        setTimeLeft(remainingSeconds);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isTestActive, totalAllocatedSeconds]);


  // --- BROWSER REFRESH / CLOSE WARNING ---
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isTestActive && !isSubmittingRef.current && !finalResult) {
        e.preventDefault();
        e.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTestActive, finalResult]);


  // --- ANTI-CHEAT EVENT LISTENERS ---
  useEffect(() => {
    const handleViolation = (reason: string) => {
      if (!isTestActive || isSubmittingRef.current || finalResult) return;
      
      const now = Date.now();
      // 2-second grace period: prevents a single action (like pressing Esc) 
      // from firing multiple browser events and instantly failing the user
      if (now - lastViolationTimeRef.current < 2000) return; 
      lastViolationTimeRef.current = now;

      if (violationCountRef.current === 0) {
        violationCountRef.current = 1;
        setIsFullscreen(false);
        // Timeout separates the alert from the render cycle
        setTimeout(() => {
          alert(`WARNING (1/2): ${reason} Please return to the assessment. A second violation will auto-submit your test.`);
        }, 100);
      } else if (violationCountRef.current === 1) {
        violationCountRef.current = 2;
        setTimeout(() => {
          alert(`FINAL VIOLATION: ${reason} Your assessment is being automatically submitted.`);
          executeSubmission(answersRef.current);
        }, 100);
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen && isTestActive) {
        handleViolation("You exited full-screen mode.");
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden && isFullscreen && isTestActive) {
        handleViolation("Tab switching or window minimizing detected.");
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isFullscreen, isTestActive, finalResult]);

  // --- HANDLERS ---
  const handleOptionSelect = (option: string) => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!currentQuestion) return;
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: option }));
  };

  const enterFullscreenAndStart = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      
      if (startTimeRef.current === 0) {
        startTimeRef.current = Date.now();
        setIsTestActive(true);
      }
    } catch (err) {
      alert("Your browser blocked full-screen. Please allow it to start the test.");
    }
  };

  const executeSubmission = async (currentAnswers: Record<string, string>, forcedTimeTaken?: number) => {
    if (isSubmittingRef.current || finalResult) return;
    
    isSubmittingRef.current = true; 
    setIsTestActive(false); 
    setIsSubmitting(true);
    
    const elapsedSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const timeSpent = forcedTimeTaken || Math.min(elapsedSeconds, totalAllocatedSeconds);
    const servedQuestionIds = questions.map(q => q.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({ 
            answers: currentAnswers, 
            servedQuestionIds, 
            mode, 
            timeTakenSeconds: timeSpent 
        }) 
      });
      
      if (!response.ok) throw new Error("Failed to evaluate");
      const result = await response.json();
      
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
      
      setFinalResult(result); 
    } catch (error) {
      console.error("Error submitting test:", error);
      alert("Something went wrong while submitting.");
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // --- RENDER CONDITIONALS ---
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-96 bg-white rounded-3xl shadow-sm border border-slate-200 mt-8">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
        <div className="text-lg font-bold text-slate-500 animate-pulse">Fetching secure {mode === 'full' ? '120-min' : '60-min'} assessment...</div>
      </div>
    );
  }

  if (finalResult) {
    return (
      <ResultsScreen 
        totalQuestions={finalResult.total} 
        score={finalResult.score} 
        onRetake={onRetake} 
      />
    );
  }

  if (questions.length === 0) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-96 bg-white rounded-3xl shadow-sm border border-slate-200 mt-8 p-6 text-center">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Not Enough Questions</h2>
        <p className="text-slate-500">Your database does not have enough questions matching this criteria.</p>
        <button onClick={() => window.location.href = '/'} className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition">Go Back</button>
      </div>
    );
  }

  if (!isFullscreen) {
    return (
      <div className="w-full h-96 flex flex-col items-center justify-center bg-white rounded-3xl shadow-sm border border-red-200 mt-8 p-6 text-center">
        <svg className="w-16 h-16 text-red-500 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Strict Mode Enabled</h2>
        <p className="text-slate-500 max-w-md mb-8">This assessment requires full-screen mode. <strong>Switching tabs, minimizing the browser, or exiting full-screen will result in a warning. A second violation will auto-submit your test.</strong></p>
        <button onClick={enterFullscreenAndStart} className="px-8 py-4 bg-slate-900 text-white rounded-xl font-bold shadow-md hover:bg-slate-800 transition">
          I Understand, Enter Full-Screen
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="w-full flex flex-col md:flex-row gap-6 mt-8 pb-12">
      <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 md:p-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-8 border-b border-slate-100 pb-4">
          <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1.5 rounded-lg uppercase tracking-wider">{currentQuestion.category}</span>
          <div className={`font-mono text-lg font-extrabold px-4 py-1 rounded-lg border-2 ${timeLeft < 300 ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
             ⏱ {formatTime(timeLeft)}
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-8 leading-relaxed">{currentQuestion.text}</h2>
        <div className="space-y-3 flex-1">
          {currentQuestion.options.map((option, index) => {
            const isSelected = answers[currentQuestion.id] === option;
            return (
              <button key={index} onClick={() => handleOptionSelect(option)} className={`w-full text-left p-5 rounded-2xl border-2 transition-all font-semibold ${isSelected ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-slate-100 hover:border-blue-200 text-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full"></div>}
                  </div>
                  {option}
                </div>
              </button>
            );
          })}
        </div>
        <div className="flex justify-between mt-12 pt-6 border-t border-slate-100">
          <button onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0} className="px-6 py-3 text-slate-500 hover:text-slate-800 disabled:opacity-30 font-bold transition">← Previous</button>
          <span className="text-slate-400 font-bold text-sm bg-slate-50 px-3 py-1.5 rounded-lg h-fit">{currentQuestionIndex + 1} / {questions.length}</span>
          <button onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))} disabled={currentQuestionIndex === questions.length - 1} className="px-8 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 disabled:opacity-50 font-bold transition">Next →</button>
        </div>
      </div>

      <div className="w-full md:w-72 flex flex-col gap-6">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-extrabold text-slate-900 mb-4">Question Palette</h3>
          <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {questions.map((q, index) => (
              <button key={q.id} onClick={() => setCurrentQuestionIndex(index)} className={`h-10 w-full rounded-xl text-sm font-bold flex items-center justify-center transition-all ${currentQuestionIndex === index ? 'ring-2 ring-blue-600' : ''} ${!!answers[q.id] ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        
        <button onClick={() => executeSubmission(answersRef.current)} disabled={isSubmitting} className="w-full py-4 bg-orange-500 text-white rounded-2xl font-extrabold hover:bg-orange-600 transition disabled:opacity-75">
          {isSubmitting ? 'Evaluating...' : 'Submit Test'}
        </button>
      </div>
    </div>
  );
}