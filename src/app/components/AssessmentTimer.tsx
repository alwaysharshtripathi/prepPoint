'use client'

import { useState, useEffect } from 'react';

interface TimerProps {
  durationInMinutes: number;
  mode: string;
}

export default function AssessmentTimer({ durationInMinutes, mode }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  useEffect(() => {
    // 1. Fallback for mode in case it's undefined on initial render
    const storageKey = `assessmentEndTime_${mode || 'default'}`;
    
    let endTime = localStorage.getItem(storageKey);
    const now = Date.now();

    // 2. THE FIX: If no timer exists OR the saved timer is already expired, start a fresh one.
    if (!endTime || parseInt(endTime, 10) <= now) {
      const newEndTime = now + durationInMinutes * 60 * 1000;
      localStorage.setItem(storageKey, newEndTime.toString());
      endTime = newEndTime.toString();
    }

    // 3. Start the countdown
    const interval = setInterval(() => {
      const currentTime = Date.now();
      const difference = parseInt(endTime as string, 10) - currentTime;

      if (difference <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        localStorage.removeItem(storageKey); // Clear it when done
      } else {
        setTimeLeft(difference);
      }
    }, 1000);

    // 4. Listen for the "stopTimer" event (triggered when Submit is clicked)
    const handleStop = () => {
      clearInterval(interval);
      localStorage.removeItem(storageKey);
    };
    
    window.addEventListener('stopTimer', handleStop);

    // Cleanup when component unmounts
    return () => {
      clearInterval(interval);
      window.removeEventListener('stopTimer', handleStop);
    };
  }, [durationInMinutes, mode]);

  // Prevent "hydration mismatch" by not rendering until the client side calculates the time
  if (timeLeft === null) return <div className="text-xl font-mono text-slate-500">Loading timer...</div>;

  // Format the milliseconds back into MM:SS
  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft / (1000 * 60)) % 60);
  const seconds = Math.floor((timeLeft / 1000) % 60);

  return (
    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-red-100 flex items-center space-x-2">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
      <span className="text-xl font-mono font-bold text-slate-800 tracking-tight">
        {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
        {minutes.toString().padStart(2, '0')}:{seconds.toString().padStart(2, '0')}
      </span>
    </div>
  );
}