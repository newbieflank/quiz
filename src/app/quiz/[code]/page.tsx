'use client';

import { useEffect, useState, use } from 'react';
import { supabase, QuestionRow } from '@/lib/supabase';

export default function QuizPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const quizCode = decodeURIComponent(code).toUpperCase();

  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [participantName, setParticipantName] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      const { data } = await supabase
        .from('questions')
        .select('*')
        .eq('quiz_code', quizCode)
        .order('no_soal', { ascending: true });

      setQuestions((data as QuestionRow[]) || []);
      setLoading(false);
    };
    loadQuiz();
  }, [quizCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let score = 0;
    let total = 0;

    questions.forEach((q) => {
      total += q.bobot;
      if (answers[q.no_soal] === q.kunci_jawaban) {
        score += q.bobot;
      }
    });

    await supabase.from('submissions').insert({
      quiz_code: quizCode,
      participant_name: participantName.trim() || 'Anonim',
      score,
      total_points: total,
      answers,
    });

    setSubmittedResult({ score, total });
  };

  if (loading) return <div className="p-8 text-sm">Memuat soal kuis...</div>;

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-600">
        Belum ada soal untuk kode paket <b>{quizCode}</b>.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
            KODE: {quizCode}
          </span>
          <h1 className="text-xl font-bold text-slate-800 mt-2">Lembar Kuis / Ulangan</h1>
        </div>

        {submittedResult ? (
          <div className="bg-white p-6 rounded-xl border border-emerald-300 text-center space-y-2">
            <p className="text-sm text-slate-500">Hasil Pengerjaan ({participantName})</p>
            <p className="text-3xl font-bold text-emerald-600">
              {submittedResult.score} / {submittedResult.total}
            </p>
            <p className="text-xs text-slate-500">Jawaban berhasil direkam ke database.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Nama Peserta
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap..."
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>

            {questions.map((q) => (
              <div
                key={q.no_soal}
                className="bg-white p-5 rounded-xl border border-slate-200 space-y-3"
              >
                <p className="font-medium text-sm text-slate-800">
                  {q.no_soal}. {q.pertanyaan}
                </p>
                <div className="space-y-2">
                  {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                    const key = `opsi_${opt.toLowerCase()}` as
                      | 'opsi_a'
                      | 'opsi_b'
                      | 'opsi_c'
                      | 'opsi_d';
                    if (!q[key]) return null;
                    return (
                      <label
                        key={opt}
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm"
                      >
                        <input
                          type="radio"
                          name={`soal-${q.no_soal}`}
                          value={opt}
                          required
                          checked={answers[q.no_soal] === opt}
                          onChange={() =>
                            setAnswers((prev) => ({ ...prev, [q.no_soal]: opt }))
                          }
                        />
                        <span className="font-semibold">{opt}.</span>
                        <span>{q[key]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl text-sm"
            >
              Kumpulkan Jawaban
            </button>
          </form>
        )}
      </div>
    </main>
  );
}