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
    <nav className="sticky top-0 z-50 surface-glass border-b border-white/10 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/" 
            className="text-xl font-bold gradient-text hover:scale-105 transition-transform duration-200"
          >
            Messenger
          </Link>
          
          <div className="flex items-center gap-2">
            <AdminLink />
            <AuthNavButtons />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}
