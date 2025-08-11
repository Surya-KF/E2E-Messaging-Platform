"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AuthNavButtons() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const pathname = usePathname();
  
  useEffect(() => {
    const t = localStorage.getItem('token');
    setLoggedIn(!!t);
    // listen for storage changes (logout/login in other tabs)
    function onStorage(e: StorageEvent) {
      if (e.key === 'token') setLoggedIn(!!localStorage.getItem('token'));
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  
  if (loggedIn === null) return null; // avoid flash
  if (loggedIn) return null; // hide when logged in
  if (pathname === '/login' || pathname === '/register' || pathname === '/admin') return null; // hide on login, register and admin pages
  
  return (
    <div className="flex items-center gap-3">
      <Link 
        href="/login" 
        className="hidden sm:inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        Login
      </Link>
      <Link 
        href="/register" 
        className="btn-primary hidden sm:inline-flex"
      >
        Sign up
      </Link>
    </div>
  );
}
