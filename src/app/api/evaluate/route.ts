import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    // 1. Authenticate the user from the incoming header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Authentication failed");

    // 2. Parse the payload
    const { answers, servedQuestionIds, mode, timeTakenSeconds = 0 } = await request.json();

    // 3. Securely fetch only the correct answers for the served questions
    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('id, category, difficulty, correct_answer')
      .in('id', servedQuestionIds);

    if (qError || !questions) throw new Error("Failed to fetch questions from database");

    // 4. Initialize tracking variables
    let totalScore = 0;
    const categoryBreakdown: Record<string, { score: number, total: number }> = {};
    const difficultyBreakdown: Record<string, { score: number, total: number }> = {};

    // 5. Calculate scores and populate the JSON objects
    questions.forEach(q => {
      const isCorrect = answers[q.id] === q.correct_answer;
      if (isCorrect) totalScore++;

      // Tally Categories
      if (!categoryBreakdown[q.category]) {
        categoryBreakdown[q.category] = { score: 0, total: 0 };
      }
      categoryBreakdown[q.category].total++;
      if (isCorrect) categoryBreakdown[q.category].score++;

      // Tally Difficulties (FIXED: Strict string normalization applied here)
      const rawDifficulty = (q.difficulty || 'Mixed').trim();
      const normalizedDiff = rawDifficulty.charAt(0).toUpperCase() + rawDifficulty.slice(1).toLowerCase();

      if (!difficultyBreakdown[normalizedDiff]) {
        difficultyBreakdown[normalizedDiff] = { score: 0, total: 0 };
      }
      difficultyBreakdown[normalizedDiff].total++;
      if (isCorrect) difficultyBreakdown[normalizedDiff].score++;
    });

    // 6. Insert the comprehensive performance payload
    const { error: insertError } = await supabase
      .from('performance_history')
      .insert({
        user_id: user.id,
        mode: mode || 'sprint',
        score: totalScore,
        total_questions: servedQuestionIds.length,
        time_taken_seconds: timeTakenSeconds,
        category_breakdown: categoryBreakdown,
        difficulty_breakdown: difficultyBreakdown
      });

    if (insertError) throw insertError;

    // 7. Return the final score to the frontend (excluding correct answers)
    return NextResponse.json({ score: totalScore, total: servedQuestionIds.length });

  } catch (error) {
    console.error("Evaluation Error:", error);
    return NextResponse.json({ error: "Failed to evaluate and save assessment" }, { status: 500 });
  }
}