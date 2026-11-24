'use client';

import { useEffect, useState } from 'react';

interface PublicQuestionRow {
  id?: string;
  quiz_code: string;
  no_soal: number;
  pertanyaan: string;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  bobot: number;
}

export default function QuizClient({ quizCode }: { quizCode: string }) {
  const normalizedCode = decodeURIComponent(quizCode).toUpperCase();

  const [questions, setQuestions] = useState<PublicQuestionRow[]>([]);
  const [participantName, setParticipantName] = useState('');
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submittedResult, setSubmittedResult] = useState<{
    score: number;
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadQuiz = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/quiz/${normalizedCode}`, {
          cache: 'no-store',
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || 'Gagal memuat soal kuis.');
          setQuestions([]);
        } else {
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
        }
      } catch {
        setErrorMsg('Terjadi kesalahan jaringan saat memuat soal.');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [normalizedCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch(`/api/quiz/${normalizedCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participantName: participantName.trim() || 'Anonim',
          answers,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Gagal mengumpulkan jawaban.');
        setSubmitting(false);
        return;
      }

      setSubmittedResult({
        score: Number(data.score ?? 0),
        total: Number(data.total ?? 0),
      });
    } catch {
      setErrorMsg('Gagal mengirim jawaban karena kesalahan jaringan.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-600">Memuat soal kuis...</div>;
  }

  if (errorMsg) {
    return (
      <div className="p-8 text-center text-sm text-red-600">
        {errorMsg}
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-slate-600">
        Belum ada soal untuk kode paket <b>{normalizedCode}</b>.
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200">
          <span className="text-xs font-mono bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">
            KODE: {normalizedCode}
          </span>
          <h1 className="text-xl font-bold text-slate-800 mt-2">Lembar Kuis / Ulangan</h1>
        </div>

        {submittedResult ? (
          <div className="bg-white p-6 rounded-xl border border-emerald-300 text-center space-y-2">
            <p className="text-sm text-slate-600">
              Hasil Pengerjaan (<span className="font-medium text-slate-900">{participantName}</span>)
            </p>
            <p className="text-3xl font-bold text-emerald-600">
              {submittedResult.score} / {submittedResult.total}
            </p>
            <p className="text-xs text-slate-500">Jawaban berhasil direkam ke database.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Nama Peserta
              </label>
              <input
                type="text"
                required
                placeholder="Masukkan nama lengkap..."
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>

            {questions.map((q) => (
              <div
                key={q.no_soal}
                className="bg-white p-5 rounded-xl border border-slate-200 space-y-3"
              >
                <p className="font-medium text-sm text-slate-900">
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
                        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer text-sm text-slate-900"
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
                        <span className="font-semibold text-slate-900">{opt}.</span>
                        <span className="text-slate-800">{q[key]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-3 rounded-xl text-sm"
            >
              {submitting ? 'Mengumpulkan...' : 'Kumpulkan Jawaban'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}