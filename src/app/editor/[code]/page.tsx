import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import EditorClient from './EditorClient'; // pindahkan isi EditorPage sebelumnya ke EditorClient.tsx

export default async function EditorPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const cookieStore = await cookies();
  if (cookieStore.get('teacher_session')?.value !== 'authorized') {
    redirect('/?auth=required');
  }

  const { code } = await params;
  const quizCode = decodeURIComponent(code).toUpperCase();

  return <EditorClient quizCode={quizCode} />;
}