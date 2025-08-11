"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';
import AdminLink from './AdminLink';
import AuthNavButtons from './AuthNavButtons';

export default function NavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('me');
    
    setLoggedIn(!!token);
    
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    
    // Listen for storage changes (logout/login in other tabs)
    function onStorage(e: StorageEvent) {
      if (e.key === 'token' || e.key === 'me') {
        const newToken = localStorage.getItem('token');
        const newUserData = localStorage.getItem('me');
        
        setLoggedIn(!!newToken);
        
        if (newToken && newUserData) {
          try {
            setUser(JSON.parse(newUserData));
          } catch {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      }
    }
    
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('me');
    setUser(null);
    setLoggedIn(false);
    router.replace('/login');
  };
  
  if (pathname === '/chat') return null; // hide on chat page
  
  const showLogoutButton = loggedIn && (pathname === '/admin' || user?.isAdmin);
  
  return (
    <nav className="sticky top-0 z-50 surface-glass border-b border-white/10 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/" 
            className="text-xl font-bold gradient-text hover:scale-105 transition-transform duration-200"
          >
            E2E
          </Link>
          
          <div className="flex items-center gap-2">
            <AdminLink />
            <AuthNavButtons />
            <ThemeToggle />
            {showLogoutButton && (
              <button
                onClick={handleLogout}
                className="btn-ghost text-sm flex items-center gap-2"
                title="Logout"
              >
                <LogoutIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Icons
function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
