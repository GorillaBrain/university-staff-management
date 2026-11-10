import { redirect } from 'next/navigation';
import StaffApp from '@/components/staff-app';
import { currentUser } from '@/lib/auth';
import { snapshot } from '@/lib/snapshot';
export const dynamic = 'force-dynamic';
export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect('/login');
  return <><StaffApp initialData={await snapshot(user)} />{children}</>;
}
