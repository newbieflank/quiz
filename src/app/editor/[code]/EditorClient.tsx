'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Save, Trash2, ExternalLink, ImagePlus, X } from 'lucide-react';

export interface EditorQuestionRow {
  id?: string;
  quiz_code: string;
  no_soal: number;
  pertanyaan: string;
  image_url?: string | null;
  opsi_a: string;
  opsi_b: string;
  opsi_c: string;
  opsi_d: string;
  kunci_jawaban: 'A' | 'B' | 'C' | 'D';
  bobot: number;
}

const createEmptyRow = (quizCode: string, noSoal: number): EditorQuestionRow => ({
  quiz_code: quizCode,
  no_soal: noSoal,
  pertanyaan: '',
  image_url: null,
  opsi_a: '',
  opsi_b: '',
  opsi_c: '',
  opsi_d: '',
  kunci_jawaban: 'A',
  bobot: 10,
});

export default function EditorClient({ quizCode }: { quizCode: string }) {
  const normalizedCode = decodeURIComponent(quizCode).toUpperCase();

  const [quizTitle, setQuizTitle] = useState('');
  const [rows, setRows] = useState<EditorQuestionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setStatusMsg('');
      try {
        const res = await fetch(`/api/teacher/quiz/${normalizedCode}`, {
          cache: 'no-store',
          credentials: 'include',
        });
        const data = await res.json();

        if (!res.ok) {
          setStatusMsg(data.error || `Gagal memuat data (status ${res.status}).`);
          setRows(Array.from({ length: 5 }, (_, i) => createEmptyRow(normalizedCode, i + 1)));
          setLoading(false);
          return;
        }

        if (data.quiz?.title) {
          setQuizTitle(data.quiz.title);
        }

        const questions = Array.isArray(data.questions)
          ? (data.questions as EditorQuestionRow[])
          : [];
        if (questions.length > 0) {
          setRows(
            questions.map((q) => ({
              ...q,
              kunci_jawaban: (['A', 'B', 'C', 'D'].includes(q.kunci_jawaban)
                ? q.kunci_jawaban
                : 'A') as 'A' | 'B' | 'C' | 'D',
              image_url: q.image_url || null,
              bobot: Number(q.bobot) || 10,
            }))
          );
        } else {
          setRows(Array.from({ length: 5 }, (_, i) => createEmptyRow(normalizedCode, i + 1)));
        }
      } catch {
        setStatusMsg('Terjadi kesalahan jaringan saat memuat soal.');
        setRows(Array.from({ length: 5 }, (_, i) => createEmptyRow(normalizedCode, i + 1)));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [normalizedCode]);

  const updateCell = <K extends keyof EditorQuestionRow>(
    index: number,
    field: K,
    value: EditorQuestionRow[K]
  ) => {
    setRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, [field]: value } : row))
    );
  };

  const addRow = () => {
    setRows((prev) => [...prev, createEmptyRow(normalizedCode, prev.length + 1)]);
  };

  const removeRow = (index: number) => {
    setRows((prev) =>
      prev
        .filter((_, idx) => idx !== index)
        .map((row, idx) => ({ ...row, no_soal: idx + 1 }))
    );
  };

  const handleUploadImage = async (index: number, file: File) => {
    setUploadingIdx(index);
    setStatusMsg(`Mengunggah gambar untuk soal nomor ${index + 1}...`);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('quizCode', normalizedCode);

      const res = await fetch('/api/teacher/upload-image', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMsg(`Upload gagal: ${data.error || `status ${res.status}`}`);
        return;
      }

      updateCell(index, 'image_url', data.url);
      setStatusMsg(
        `Gambar soal nomor ${index + 1} terunggah. Klik "Simpan Semua" untuk menyimpan ke paket.`
      );
    } catch {
      setStatusMsg('Gagal mengunggah gambar karena kesalahan jaringan.');
    } finally {
      setUploadingIdx(null);
    }
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setStatusMsg('');

    const validRows = rows
      .filter((r) => r.pertanyaan.trim() !== '')
      .map((r, idx) => ({
        quiz_code: normalizedCode,
        no_soal: idx + 1,
        pertanyaan: r.pertanyaan,
        image_url: r.image_url ? String(r.image_url) : null,
        opsi_a: r.opsi_a,
        opsi_b: r.opsi_b,
        opsi_c: r.opsi_c,
        opsi_d: r.opsi_d,
        kunci_jawaban: r.kunci_jawaban,
        bobot: Number(r.bobot) || 10,
      }));

    try {
      const res = await fetch(`/api/teacher/quiz/${normalizedCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'save_questions',
          rows: validRows,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatusMsg(`Gagal menyimpan: ${data.error || `status ${res.status}`}`);
        setSaving(false);
        return;
      }

      setRows(
        validRows.length > 0
          ? validRows
          : Array.from({ length: 5 }, (_, i) => createEmptyRow(normalizedCode, i + 1))
      );
      setStatusMsg(`Tersimpan (${validRows.length} soal aktif).`);
    } catch {
      setStatusMsg('Gagal menyimpan karena kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-slate-600">Memuat kolom soal...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                {normalizedCode}
              </span>
              <h1 className="text-lg font-bold text-slate-900">{quizTitle || normalizedCode}</h1>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Isi langsung pada setiap kolom di bawah, tambahkan gambar bila perlu, lalu klik Simpan Semua.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/quiz/${normalizedCode}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100"
            >
              Pratinjau Kuis <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-800 text-white rounded-lg hover:bg-slate-900"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah Baris
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={saving || uploadingIdx !== null}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> {saving ? 'Menyimpan...' : 'Simpan Semua'}
            </button>
          </div>
        </div>

        {statusMsg && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs px-4 py-2.5 rounded-lg">
            {statusMsg}
          </div>
        )}

        {/* Tabel Kolom Soal */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-sm">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="bg-slate-800 text-white text-left">
                <th className="p-2.5 border-r border-slate-700 w-12 text-center">No</th>
                <th className="p-2.5 border-r border-slate-700 min-w-[240px]">Pertanyaan</th>
                <th className="p-2.5 border-r border-slate-700 w-36 text-center">Gambar</th>
                <th className="p-2.5 border-r border-slate-700 min-w-[140px]">Opsi A</th>
                <th className="p-2.5 border-r border-slate-700 min-w-[140px]">Opsi B</th>
                <th className="p-2.5 border-r border-slate-700 min-w-[140px]">Opsi C</th>
                <th className="p-2.5 border-r border-slate-700 min-w-[140px]">Opsi D</th>
                <th className="p-2.5 border-r border-slate-700 w-20 text-center">Kunci</th>
                <th className="p-2.5 border-r border-slate-700 w-20 text-center">Bobot</th>
                <th className="p-2.5 w-12 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 align-top">
                  <td className="p-2 border-r border-slate-200 text-center font-semibold text-slate-700">
                    {idx + 1}
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    <textarea
                      rows={2}
                      value={row.pertanyaan}
                      onChange={(e) => updateCell(idx, 'pertanyaan', e.target.value)}
                      placeholder="Tulis pertanyaan..."
                      className="w-full p-1.5 text-slate-900 placeholder:text-slate-400 border border-transparent focus:border-blue-400 focus:bg-blue-50/30 rounded outline-none resize-y"
                    />
                  </td>
                  <td className="p-1.5 border-r border-slate-200">
                    {row.image_url ? (
                      <div className="space-y-1">
                        <img
                          src={row.image_url}
                          alt={`Gambar soal ${idx + 1}`}
                          className="w-full h-16 object-contain rounded border border-slate-200 bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={() => updateCell(idx, 'image_url', null)}
                          className="w-full inline-flex items-center justify-center gap-1 text-[11px] text-red-600 hover:underline"
                        >
                          <X className="w-3 h-3" /> Hapus
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center justify-center gap-1 px-2 py-2 text-[11px] font-medium border border-dashed border-slate-300 rounded hover:bg-slate-50 text-slate-700">
                        <ImagePlus className="w-4 h-4 text-slate-500" />
                        <span>{uploadingIdx === idx ? 'Upload...' : 'Gambar'}</span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp,image/gif"
                          disabled={uploadingIdx === idx}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            e.target.value = '';
                            if (file) {
                              void handleUploadImage(idx, file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </td>
                  {(['opsi_a', 'opsi_b', 'opsi_c', 'opsi_d'] as const).map((field) => (
                    <td key={field} className="p-1.5 border-r border-slate-200">
                      <input
                        type="text"
                        value={row[field]}
                        onChange={(e) => updateCell(idx, field, e.target.value)}
                        placeholder={`Jawaban ${field.slice(-1).toUpperCase()}`}
                        className="w-full p-1.5 text-slate-900 placeholder:text-slate-400 border border-transparent focus:border-blue-400 focus:bg-blue-50/30 rounded outline-none"
                      />
                    </td>
                  ))}
                  <td className="p-1.5 border-r border-slate-200 text-center">
                    <select
                      value={row.kunci_jawaban}
                      onChange={(e) =>
                        updateCell(idx, 'kunci_jawaban', e.target.value as 'A' | 'B' | 'C' | 'D')
                      }
                      className="p-1.5 text-slate-900 border border-slate-300 rounded bg-white font-semibold"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </td>
                  <td className="p-1.5 border-r border-slate-200 text-center">
                    <input
                      type="number"
                      min={1}
                      value={row.bobot}
                      onChange={(e) => updateCell(idx, 'bobot', Number(e.target.value))}
                      className="w-14 p-1.5 text-slate-900 border border-slate-300 rounded text-center"
                    />
                  </td>
                  <td className="p-1.5 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(idx)}
                      title="Hapus baris"
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}