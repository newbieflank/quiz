'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Download, ArrowLeft, Pencil } from 'lucide-react';

interface SubmissionRow {
  id: string;
  quiz_code: string;
  participant_name: string;
  score: number;
  total_points: number;
  answers: Record<string, string>;
  submitted_at: string;
}

export default function GuruReportClient({ quizCode }: { quizCode: string }) {
  const normalizedCode = decodeURIComponent(quizCode).toUpperCase();

  const [quizTitle, setQuizTitle] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/teacher/quiz/${normalizedCode}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data.error || `Gagal memuat report (status ${res.status}).`);
          setSubmissions([]);
          setLoading(false);
          return;
        }

        if (data.quiz?.title) {
          setQuizTitle(data.quiz.title);
        }

        setSubmissions(Array.isArray(data.submissions) ? (data.submissions as SubmissionRow[]) : []);
      } catch {
        setErrorMsg('Terjadi kesalahan jaringan saat memuat data report.');
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, [normalizedCode]);

  const buildRowsForExport = () => {
    return submissions.map((s, index) => {
      const persentase =
        s.total_points > 0 ? Math.round((s.score / s.total_points) * 100) : 0;
      return {
        No: index + 1,
        'Kode Paket': s.quiz_code,
        'Nama Peserta': s.participant_name,
        Skor: s.score,
        'Total Poin': s.total_points,
        'Nilai (%)': persentase,
        'Waktu Kumpul': new Date(s.submitted_at).toLocaleString('id-ID'),
      };
    });
  };

  const handleExportCSV = () => {
    const rows = buildRowsForExport();
    if (rows.length === 0) return;

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

    // BOM \uFEFF agar karakter UTF-8 & tanda baca terbaca baik di Excel
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `report-${normalizedCode.toLowerCase()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-600">Memuat data report guru...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header Report */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                {normalizedCode}
              </span>
              <h1 className="text-lg font-bold text-slate-900">
                Report Nilai — {quizTitle || normalizedCode}
              </h1>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Total peserta mengumpulkan: <b>{submissions.length}</b> orang
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/guru"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> List Report
            </Link>
            <Link
              href={`/editor/${normalizedCode}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Soal
            </Link>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={submissions.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-4 py-3 rounded-lg">
            {errorMsg}
          </div>
        )}

        {/* Tabel Rekap */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-white text-left">
                <th className="p-3 border-r border-slate-700 w-12 text-center">No</th>
                <th className="p-3 border-r border-slate-700">Nama Peserta</th>
                <th className="p-3 border-r border-slate-700 text-center">Skor</th>
                <th className="p-3 border-r border-slate-700 text-center">Total Poin</th>
                <th className="p-3 border-r border-slate-700 text-center">Nilai (%)</th>
                <th className="p-3">Waktu Kumpul</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-slate-500">
                    Belum ada data pengerjaan peserta untuk kode paket <b>{normalizedCode}</b>.
                  </td>
                </tr>
              ) : (
                submissions.map((item, idx) => {
                  const pct =
                    item.total_points > 0
                      ? Math.round((item.score / item.total_points) * 100)
                      : 0;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-3 border-r border-slate-200 text-center font-semibold">
                        {idx + 1}
                      </td>
                      <td className="p-3 border-r border-slate-200 font-medium">
                        {item.participant_name}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center font-semibold text-emerald-700">
                        {item.score}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center">
                        {item.total_points}
                      </td>
                      <td className="p-3 border-r border-slate-200 text-center font-bold">
                        {pct}%
                      </td>
                      <td className="p-3 text-slate-600">
                        {new Date(item.submitted_at).toLocaleString('id-ID')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}