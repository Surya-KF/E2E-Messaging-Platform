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
    <>
      <Link href="/login" className="hidden sm:inline-block text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">Login</Link>
      <Link href="/register" className="hidden sm:inline-block text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white">Sign up</Link>
    </>
  );
}
