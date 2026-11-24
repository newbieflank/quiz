import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import GuruListClient from './GuruListClient';

export default async function GuruIndexPage() {
  const cookieStore = await cookies();
  if (cookieStore.get('teacher_session')?.value !== 'authorized') {
    redirect('/?auth=required');
  }

  return <GuruListClient />;
}