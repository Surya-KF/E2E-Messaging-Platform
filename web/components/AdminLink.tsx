"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function AdminLink() {
  const [isAdmin, setIsAdmin] = useState(false);
  const pathname = usePathname();
  useEffect(() => {
    try {
      const raw = localStorage.getItem('me');
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj?.isAdmin) setIsAdmin(true);
    } catch {}
  }, []);
  if (!isAdmin) return null;
  if (pathname === '/chat') return null;
  return <Link href="/admin" className="hidden sm:inline-block text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">Admin</Link>;
}
