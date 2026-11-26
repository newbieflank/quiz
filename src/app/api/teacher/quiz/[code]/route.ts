import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseServer';

async function isAuthorizedTeacher() {
  const cookieStore = await cookies();
  return cookieStore.get('teacher_session')?.value === 'authorized';
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!(await isAuthorizedTeacher())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;
  const quizCode = decodeURIComponent(code).toUpperCase();

  const [{ data: quiz }, { data: questions }, { data: submissions }] =
    await Promise.all([
      supabaseAdmin.from('quizzes').select('*').eq('code', quizCode).maybeSingle(),
      supabaseAdmin
        .from('questions')
        .select('*')
        .eq('quiz_code', quizCode)
        .order('no_soal', { ascending: true }),
      supabaseAdmin
        .from('submissions')
        .select('*')
        .eq('quiz_code', quizCode)
        .order('submitted_at', { ascending: false }),
    ]);

  return NextResponse.json({
    quiz: quiz || null,
    questions: questions || [],
    submissions: submissions || [],
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  if (!(await isAuthorizedTeacher())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code } = await params;
  const quizCode = decodeURIComponent(code).toUpperCase();
  const body = await req.json();

  if (body?.action === 'ensure_quiz') {
    const { data: existing } = await supabaseAdmin
      .from('quizzes')
      .select('code, title')
      .eq('code', quizCode)
      .maybeSingle();

    if (!existing) {
      const { error: insertQuizErr } = await supabaseAdmin.from('quizzes').insert({
        code: quizCode,
        title: String(body?.title || `Paket Kuis ${quizCode}`).trim(),
      });
      if (insertQuizErr) {
        return NextResponse.json({ error: insertQuizErr.message }, { status: 500 });
      }
    }
    return NextResponse.json({ ok: true });
  }

  if (body?.action === 'save_questions') {
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    const { error: deleteErr } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('quiz_code', quizCode);

    if (deleteErr) {
      return NextResponse.json({ error: deleteErr.message }, { status: 500 });
    }

    if (rows.length > 0) {
      const cleaned = rows.map((r: Record<string, unknown>, idx: number) => ({
        quiz_code: quizCode,
        no_soal: idx + 1,
        pertanyaan: String(r.pertanyaan || ''),
        opsi_a: String(r.opsi_a || ''),
        opsi_b: String(r.opsi_b || ''),
        opsi_c: String(r.opsi_c || ''),
        opsi_d: String(r.opsi_d || ''),
        kunci_jawaban: String(r.kunci_jawaban || 'A'),
        image_url:
          typeof r.image_url === 'string' && r.image_url.trim() !== ''
            ? r.image_url.trim()
            : null,
        bobot: Number(r.bobot) || 10,
      }));

      const { error } = await supabaseAdmin.from('questions').insert(cleaned);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
}