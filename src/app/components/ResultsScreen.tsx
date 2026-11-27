'use client'

import React from 'react';

// The final score props passed down from the QuestionManager
interface ResultsProps {
  totalQuestions: number;
  score: number;
  onRetake: () => void;
}

export default function ResultsScreen({ totalQuestions, score, onRetake }: ResultsProps) {
  // Prevent NaN by checking if totalQuestions is greater than 0
  const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

  return (
    <div className="w-full flex items-center justify-center p-12 mt-4">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-10 max-w-lg w-full text-center">
        
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Assessment Complete</h2>
        <p className="text-gray-500 mb-8">Thank you for submitting your test.</p>

        <div className="flex justify-center mb-8">
          <div className="relative h-40 w-40">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              {/* Background Circle */}
              <circle
                className="text-gray-200 stroke-current"
                strokeWidth="10"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              ></circle>
              {/* Progress Circle */}
              <circle
                className={`${percentage >= 70 ? 'text-green-500' : 'text-red-500'} stroke-current transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * percentage) / 100}
                transform="rotate(-90 50 50)"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl font-bold text-gray-800">{percentage}%</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl p-6 mb-8 flex justify-around">
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Questions</p>
            <p className="text-2xl font-bold text-gray-800">{totalQuestions}</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Correct Answers</p>
            <p className="text-2xl font-bold text-green-600">{score}</p>
          </div>
        </div>

        <button 
          onClick={onRetake}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition shadow-sm"
        >
          Retake Assessment
        </button>
      </div>
    </div>
  );
}