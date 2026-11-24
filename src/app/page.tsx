'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HomePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateOrOpenEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanCode) return;

    setLoading(true);
    const { data: existing } = await supabase
      .from('quizzes')
      .select('code')
      .eq('code', cleanCode)
      .maybeSingle();

    if (!existing) {
      await supabase.from('quizzes').insert({
        code: cleanCode,
        title: title.trim() || `Paket Kuis ${cleanCode}`,
      });
    }

    setLoading(false);
    router.push(`/editor/${cleanCode}`);
  };

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanCode) return;
    router.push(`/quiz/${cleanCode}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-3xl w-full grid md:grid-cols-2 gap-6">
        {/* Card 1: Editor Soal Berkolom */}
        <form
          onSubmit={handleCreateOrOpenEditor}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4"
        >
          <h2 className="text-lg font-bold text-slate-800">
            1. Buat / Edit Bank Soal (Tabel Kolom)
          </h2>
          <p className="text-sm text-slate-500">
            Masukkan kode paket baru atau paket lama untuk membuka lembar kolom soal.
          </p>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Kode Paket (Wajib)
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: UH1-IPA"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Judul Ulangan / Kuis (Jika paket baru)
            </label>
            <input
              type="text"
              placeholder="Contoh: Ulangan Harian Bab 1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg text-sm transition"
          >
            {loading ? 'Membuka...' : 'Buka Tabel Kolom Soal →'}
          </button>
        </form>

        {/* Card 2: Kerjakan Kuis */}
        <form
          onSubmit={handleStartQuiz}
          className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              2. Kerjakan Kuis / Ulangan
            </h2>
            <p className="text-sm text-slate-500">
              Masukkan kode paket yang sudah dibuat untuk mengerjakan soal.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Kode Kuis
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: UH1-IPA"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm uppercase"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 rounded-lg text-sm transition"
          >
            Mulai Kuis →
          </button>
        </form>
      </div>
    </main>
  );
}