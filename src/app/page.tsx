'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const authRequired = searchParams.get('auth') === 'required';

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const [teacherPassword, setTeacherPassword] = useState('');
  const [pendingAction, setPendingAction] = useState<
    | { type: 'editor'; quizCode: string; quizTitle: string }
    | { type: 'list' }
    | null
  >(null);
  const [authError, setAuthError] = useState('');
  const [loading, setLoading] = useState(false);

  const loginTeacher = async (passwordToCheck: string): Promise<boolean> => {
    setAuthError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password: passwordToCheck }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || 'Password guru salah.');
        setLoading(false);
        return false;
      }
      setLoading(false);
      return true;
    } catch {
      setAuthError('Gagal menghubungi server autentikasi.');
      setLoading(false);
      return false;
    }
  };

  const runEditorFlow = async (quizCode: string, quizTitle: string) => {
    setLoading(true);
    await fetch(`/api/teacher/quiz/${quizCode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        action: 'ensure_quiz',
        title: quizTitle.trim() || `Paket Kuis ${quizCode}`,
      }),
    }).catch(() => null);
    setLoading(false);
    router.push(`/editor/${quizCode}`);
    router.refresh();
  };

  const handleCreateOrOpenEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanCode) return;

    if (!teacherPassword) {
      setPendingAction({ type: 'editor', quizCode: cleanCode, quizTitle: title });
      setAuthError('Masukkan password guru untuk membuka Editor Soal.');
      return;
    }

    const ok = await loginTeacher(teacherPassword);
    if (ok) {
      await runEditorFlow(cleanCode, title);
    }
  };

  const handleOpenTeacherList = async () => {
    if (!teacherPassword) {
      setPendingAction({ type: 'list' });
      setAuthError('Masukkan password guru untuk membuka List Report.');
      return;
    }

    const ok = await loginTeacher(teacherPassword);
    if (ok) {
      router.push('/guru');
      router.refresh();
    }
  };

  const handlePasswordBoxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await loginTeacher(teacherPassword);
    if (!ok) return;

    if (pendingAction?.type === 'editor') {
      await runEditorFlow(pendingAction.quizCode, pendingAction.quizTitle);
      setPendingAction(null);
      return;
    }

    setPendingAction(null);
    router.push('/guru');
    router.refresh();
  };

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinCode.trim().toUpperCase().replace(/\s+/g, '-');
    if (!cleanCode) return;
    router.push(`/quiz/${cleanCode}`);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full space-y-6">
        {(authRequired || pendingAction || authError) && (
          <form
            onSubmit={handlePasswordBoxSubmit}
            className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex flex-wrap items-center justify-between gap-3"
          >
            <div className="text-xs text-amber-950">
              <p className="font-bold">Autentikasi Guru</p>
              <p>{authError || 'Masukkan password guru untuk mengakses fitur guru.'}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="password"
                required
                placeholder="Password guru..."
                value={teacherPassword}
                onChange={(e) => setTeacherPassword(e.target.value)}
                className="border border-amber-400 rounded-lg px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
              />
              <button
                type="submit"
                disabled={loading}
                className="bg-amber-700 hover:bg-amber-800 text-white text-xs font-medium px-4 py-2 rounded-lg"
              >
                {loading ? 'Memproses...' : 'Masuk Guru'}
              </button>
            </div>
          </form>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Buat / Edit Bank Soal */}
          <form
            onSubmit={handleCreateOrOpenEditor}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4"
          >
            <h2 className="text-lg font-bold text-slate-900">1. Buat / Edit Bank Soal</h2>
            <p className="text-sm text-slate-600">
              Buat paket baru atau buka kembali soal yang sudah ada dalam tampilan kolom.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Kode Paket (Wajib)
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: UH1-IPA"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Judul Ulangan / Kuis
              </label>
              <input
                type="text"
                placeholder="Contoh: Ulangan Harian Bab 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
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

          {/* Card 2: Kerjakan Kuis (Siswa) */}
          <form
            onSubmit={handleStartQuiz}
            className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900">2. Kerjakan Kuis / Ulangan</h2>
              <p className="text-sm text-slate-600">
                Masukkan kode paket yang diberikan guru untuk mengerjakan soal.
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Kode Kuis
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: UH1-IPA"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white uppercase"
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

          {/* Card 3: List Report Guru */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-slate-900">3. List Report Guru</h2>
              <p className="text-sm text-slate-600">
                Lihat seluruh daftar paket soal, rekap nilai peserta, dan export spreadsheet (.csv).
              </p>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Password Guru
                </label>
                <input
                  type="password"
                  placeholder="Masukkan password guru..."
                  value={teacherPassword}
                  onChange={(e) => setTeacherPassword(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 bg-white"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleOpenTeacherList}
              disabled={loading}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg text-sm transition"
            >
              {loading ? 'Memeriksa...' : 'Buka List Report →'}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-slate-600">Memuat...</div>}>
      <HomeContent />
    </Suspense>
  );
}