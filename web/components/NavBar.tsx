"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import AdminLink from './AdminLink';
import AuthNavButtons from './AuthNavButtons';

export default function NavBar() {
  const pathname = usePathname();
  if (pathname === '/chat') return null; // hide on chat page
  return (
    <nav className="relative z-10 sticky top-0 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-gray-900/60">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-tight">Messenger</Link>
        <div className="flex items-center gap-2">
          <AdminLink />
          <AuthNavButtons />
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
