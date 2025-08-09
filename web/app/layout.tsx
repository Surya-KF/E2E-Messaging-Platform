import './globals.css';
import React from 'react';
import Link from 'next/link';
import ThemeToggle from '../components/ThemeToggle';
import { Inter } from 'next/font/google';
import AdminLink from '../components/AdminLink';
import AuthNavButtons from '../components/AuthNavButtons';
import { headers } from 'next/headers';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Messenger',
  description: 'WhatsApp-like E2E messenger (MVP)',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Determine path (App Router server component); fallback to showing nav if unavailable
  let pathname = '/';
  try { pathname = headers().get('x-pathname') || '/'; } catch {}
  const showNav = pathname !== '/chat';
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative min-h-[100dvh]">
          {/* Animated gradient top strip */}
          <div className="fixed inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-500 animate-gradient" />
          {/* Subtle grid background */}
          <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-light dark:bg-grid-dark" />

          {showNav && (
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
          )}

          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
