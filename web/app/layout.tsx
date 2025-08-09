import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';
import NavBar from '../components/NavBar';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Messenger',
  description: 'WhatsApp-like E2E messenger (MVP)',
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <div className="relative min-h-[100dvh]">
          <div className="fixed inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-fuchsia-500 animate-gradient" />
          <div className="pointer-events-none absolute inset-0 bg-grid bg-grid-light dark:bg-grid-dark" />
          <NavBar />
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
