import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const quizCode = decodeURIComponent(code).toUpperCase();

  const { data, error } = await supabaseAdmin
    .from('questions')
    .select(
      'id, quiz_code, no_soal, pertanyaan, image_url, opsi_a, opsi_b, opsi_c, opsi_d, bobot'
    )
    .eq('quiz_code', quizCode)
    .order('no_soal', { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ questions: data || [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const quizCode = decodeURIComponent(code).toUpperCase();
  const body = await req.json();
  const participantName = String(body?.participantName ?? '').trim();
  const answers =
    body?.answers && typeof body.answers === 'object' ? body.answers : {};

  if (!participantName) {
    return NextResponse.json(
      { error: 'Nama peserta wajib diisi.' },
      { status: 400 }
    );
  }

  const { data: questions, error } = await supabaseAdmin
    .from('questions')
    .select('no_soal, kunci_jawaban, bobot')
    .eq('quiz_code', quizCode);

  if (error || !questions) {
    return NextResponse.json({ error: 'Gagal memuat kunci soal.' }, { status: 500 });
  }

  let score = 0;
  let total = 0;

  questions.forEach((q) => {
    total += Number(q.bobot) || 0;
    if (answers?.[q.no_soal] === q.kunci_jawaban) {
      score += Number(q.bobot) || 0;
    }
  });

  const { error: insertError } = await supabaseAdmin.from('submissions').insert({
    quiz_code: quizCode,
    participant_name: participantName,
    score,
    total_points: total,
    answers,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ score, total });
}