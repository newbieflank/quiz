'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileSpreadsheet,
  Pencil,
  BarChart3,
  Plus,
  Search,
  Copy,
  Check,
  ArrowLeft,
} from 'lucide-react';

interface QuizSummaryItem {
  id: string;
  code: string;
  title: string;
  duration_minutes: number;
  created_at: string;
  questionCount: number;
  submissionCount: number;
  avgScorePct: number | null;
}

export default function GuruListClient() {
  const [items, setItems] = useState<QuizSummaryItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const loadList = async () => {
      try {
        const res = await fetch('/api/teacher/quizzes', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok) {
          setItems(data.quizzes || []);
        }
      } finally {
        setLoading(false);
      }
    };
    loadList();
  }, []);

  const filtered = items.filter((item) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      item.code.toLowerCase().includes(q) ||
      item.title.toLowerCase().includes(q)
    );
  });

  const handleCopyQuizLink = (code: string) => {
    const url = `${window.location.origin}/quiz/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1500);
  };

  const handleExportSummaryCSV = () => {
    if (filtered.length === 0) return;

    const rows = filtered.map((item, index) => ({
      No: index + 1,
      'Kode Paket': item.code,
      'Judul Kuis / Ulangan': item.title,
      'Jumlah Soal': item.questionCount,
      'Jumlah Peserta': item.submissionCount,
      'Rata-rata Nilai (%)': item.avgScorePct !== null ? item.avgScorePct : '-',
      'Tanggal Dibuat': new Date(item.created_at).toLocaleDateString('id-ID'),
    }));

    const headers = Object.keys(rows[0]);
    const escapeCSV = (val: string | number) => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map((r) => headers.map((h) => escapeCSV(r[h as keyof typeof r])).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'list-report-kuis.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-600">Memuat daftar report kuis...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">List Report & Paket Kuis Guru</h1>
            <p className="text-xs text-slate-600 mt-1">
              Semua paket ulangan/kuis tampil otomatis di sini—tidak perlu mengingat kode atau cek database.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Beranda
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-3.5 h-3.5" /> Buat Paket Baru
            </Link>
            <button
              type="button"
              onClick={handleExportSummaryCSV}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Export List CSV
            </button>
          </div>
        </div>

        {/* Pencarian */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan judul ulangan atau kode paket..."
            className="w-full text-sm text-slate-900 placeholder:text-slate-400 outline-none bg-transparent"
          />
        </div>

        {/* List / Tabel Report */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-white text-left">
                <th className="p-3 border-r border-slate-700 w-12 text-center">No</th>
                <th className="p-3 border-r border-slate-700">Judul & Kode Paket</th>
                <th className="p-3 border-r border-slate-700 text-center">Soal</th>
                <th className="p-3 border-r border-slate-700 text-center">Peserta</th>
                <th className="p-3 border-r border-slate-700 text-center">Rata-rata</th>
                <th className="p-3 border-r border-slate-700">Link Siswa</th>
                <th className="p-3 text-center">Aksi Guru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-slate-500">
                    Belum ada paket kuis yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="p-3 border-r border-slate-200 text-center font-semibold">
                      {idx + 1}
                    </td>
                    <td className="p-3 border-r border-slate-200">
                      <div className="font-bold text-sm text-slate-900">{item.title}</div>
                      <span className="inline-block mt-1 font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        {item.code}
                      </span>
                    </td>
                    <td className="p-3 border-r border-slate-200 text-center font-medium">
                      {item.questionCount}
                    </td>
                    <td className="p-3 border-r border-slate-200 text-center font-medium">
                      {item.submissionCount}
                    </td>
                    <td className="p-3 border-r border-slate-200 text-center font-bold text-emerald-700">
                      {item.avgScorePct !== null ? `${item.avgScorePct}%` : '-'}
                    </td>
                    <td className="p-3 border-r border-slate-200">
                      <button
                        type="button"
                        onClick={() => handleCopyQuizLink(item.code)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium border border-slate-300 rounded-md hover:bg-slate-100 text-slate-700"
                      >
                        {copiedCode === item.code ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" /> Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> /quiz/{item.code}
                          </>
                        )}
                      </button>
                    </td>
                    <td className="p-3 text-center">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href={`/editor/${item.code}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
                        >
                          <Pencil className="w-3 h-3" /> Soal
                        </Link>
                        <Link
                          href={`/guru/${item.code}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900"
                        >
                          <BarChart3 className="w-3 h-3" /> Detail Report
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}