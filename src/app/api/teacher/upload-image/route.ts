import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabaseServer';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export async function POST(req: Request) {
  const cookieStore = await cookies();
  if (cookieStore.get('teacher_session')?.value !== 'authorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const rawCode = String(formData.get('quizCode') || 'GENERAL').toUpperCase();
    const quizCode = rawCode.replace(/[^A-Z0-9_-]/g, '') || 'GENERAL';

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'File gambar tidak ditemukan.' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format gambar harus PNG, JPG, WEBP, atau GIF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'Ukuran gambar maksimal 2 MB.' },
        { status: 400 }
      );
    }

    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[file.type] || 'png';
    const filePath = `${quizCode}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const arrayBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from('quiz-images')
      .upload(filePath, Buffer.from(arrayBuffer), {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from('quiz-images')
      .getPublicUrl(filePath);

    return NextResponse.json({ url: publicData.publicUrl });
  } catch {
    return NextResponse.json({ error: 'Gagal memproses upload gambar.' }, { status: 500 });
  }
}