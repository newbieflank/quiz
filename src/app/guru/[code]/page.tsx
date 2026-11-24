import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GuruReportClient from './GuruReportClient';

export const dynamic = 'force-dynamic';

export default async function GuruReportPage({
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

  return <GuruReportClient quizCode={quizCode} />;
}