import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'USMS | University Staff Management',
  description: 'University staff, departments, attendance and leave management.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
