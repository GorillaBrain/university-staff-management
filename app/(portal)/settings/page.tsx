import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
export default async function Settings() {
  if ((await currentUser())?.role !== 'Administrator') redirect('/profile');
  return null;
}
