import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const password = String(body?.password ?? '');
    const expectedPassword = process.env.TEACHER_PASSWORD;

    if (!expectedPassword) {
      return NextResponse.json(
        { error: 'TEACHER_PASSWORD belum diatur di .env.local' },
        { status: 500 }
      );
    }

    if (!password || password !== expectedPassword) {
      return NextResponse.json(
        { error: 'Password guru salah.' },
        { status: 401 }
      );
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set('teacher_session', 'authorized', {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 8,
    });

    return res;
  } catch {
    return NextResponse.json(
      { error: 'Format request tidak valid.' },
      { status: 400 }
    );
  }
}