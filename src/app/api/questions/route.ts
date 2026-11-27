import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const difficulty = searchParams.get('difficulty') || 'mixed';
  const mode = searchParams.get('mode') || 'sprint'; 

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  try {
    let finalQuestions: any[] = [];

    // Helper to build queries dynamically based on difficulty
    const buildQuery = (category: string, limit: number) => {
      let query = supabase.from('questions').select('id, category, text, options').ilike('category', category);
      if (difficulty !== 'mixed') {
        query = query.ilike('difficulty', difficulty);
      }
      return query.limit(limit);
    };

    if (mode === 'full') {
      // 120-MIN MOCK: Strict Ratio (60 total)
      const [techRes, logicRes, aptRes, commRes] = await Promise.all([
        buildQuery('Technical', 25),
        buildQuery('Logical', 15),
        buildQuery('Aptitude', 10),
        buildQuery('Communication', 10),
      ]);

      if (techRes.error) throw techRes.error;
      finalQuestions = [...(techRes.data || []), ...(logicRes.data || []), ...(aptRes.data || []), ...(commRes.data || [])];
    } else {
      // 60-MIN SPRINT: Equal Distribution (45 total) -> 12, 11, 11, 11
      const [techRes, logicRes, aptRes, commRes] = await Promise.all([
        buildQuery('Technical', 12),
        buildQuery('Logical', 11),
        buildQuery('Aptitude', 11),
        buildQuery('Communication', 11),
      ]);
      
      if (techRes.error) throw techRes.error;
      finalQuestions = [...(techRes.data || []), ...(logicRes.data || []), ...(aptRes.data || []), ...(commRes.data || [])];
    }

    // Shuffle the final array so categories are randomized for the user
    for (let i = finalQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [finalQuestions[i], finalQuestions[j]] = [finalQuestions[j], finalQuestions[i]];
    }

    return NextResponse.json(finalQuestions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    return NextResponse.json({ error: "Failed to load questions" }, { status: 500 });
  }
}