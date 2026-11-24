import QuizClient from './QuizClient';

export const dynamic = 'force-dynamic';

export default async function QuizPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const quizCode = decodeURIComponent(code).toUpperCase();

  return <QuizClient quizCode={quizCode} />;
}