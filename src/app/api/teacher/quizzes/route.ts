import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  const cookieStore = await cookies();
  if (cookieStore.get('teacher_session')?.value !== 'authorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [{ data: quizzes, error: quizErr }, { data: questions }, { data: submissions }] =
    await Promise.all([
      supabaseAdmin.from('quizzes').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('questions').select('quiz_code'),
      supabaseAdmin.from('submissions').select('quiz_code, score, total_points'),
    ]);

  if (quizErr) {
    return NextResponse.json({ error: quizErr.message }, { status: 500 });
  }

  const questionCountMap: Record<string, number> = {};
  (questions || []).forEach((q) => {
    questionCountMap[q.quiz_code] = (questionCountMap[q.quiz_code] || 0) + 1;
  });

  const subStatsMap: Record<
    string,
    { count: number; sumPct: number }
  > = {};

  (submissions || []).forEach((s) => {
    if (!subStatsMap[s.quiz_code]) {
      subStatsMap[s.quiz_code] = { count: 0, sumPct: 0 };
    }
    const pct = s.total_points > 0 ? (s.score / s.total_points) * 100 : 0;
    subStatsMap[s.quiz_code].count += 1;
    subStatsMap[s.quiz_code].sumPct += pct;
  });

  const list = (quizzes || []).map((quiz) => {
    const stats = subStatsMap[quiz.code] || { count: 0, sumPct: 0 };
    return {
      id: quiz.id,
      code: quiz.code,
      title: quiz.title,
      duration_minutes: quiz.duration_minutes,
      created_at: quiz.created_at,
      questionCount: questionCountMap[quiz.code] || 0,
      submissionCount: stats.count,
      avgScorePct: stats.count > 0 ? Math.round(stats.sumPct / stats.count) : null,
    };
  });

  return NextResponse.json({ quizzes: list });
}