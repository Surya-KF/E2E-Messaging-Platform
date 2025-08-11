"use client";
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
if (typeof window !== 'undefined') axios.defaults.baseURL = API_URL;

interface UserRow { id: string; phone: string; displayName: string; createdAt: string; isAdmin: boolean; }

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [me, setMe] = useState<any>(null);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem('token');
    const m = localStorage.getItem('me');
    if (!t || !m) { router.replace('/login'); return; }
    try { setMe(JSON.parse(m)); } catch {}
    setToken(t);
  }, [router]);

  useEffect(() => {
    if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }, [token]);

  const loadUsers = useCallback(async () => {
    if (!token || loading || !hasMore) return;
    setLoading(true); setError(null);
    try {
      const { data } = await axios.get('/admin/users', { params: { limit: 40, cursor: cursor || undefined } });
      setUsers(u => [...u, ...(data.items||[])]);
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.nextCursor));
    } catch (e:any) {
      const status = e?.response?.status;
      if (status === 401) router.replace('/login');
      else if (status === 403) router.replace('/');
      else setError(e?.response?.data?.error || e.message || 'Failed');
    } finally { setLoading(false); }
  }, [token, cursor, hasMore, loading, router]);

  useEffect(()=>{ if (token) loadUsers(); }, [token]);

  async function deleteUser(id: string) {
    if (!confirm('Delete this user and all their data?')) return;
    setDeleting(id); setError(null);
    try {
      await axios.delete(`/admin/users/${id}`);
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e:any) {
      setError(e?.response?.data?.error || e.message || 'Delete failed');
    } finally { setDeleting(null); }
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('me');
    setToken(null);
    setMe(null);
    setUsers([]);
    setCursor(null);
    setHasMore(true);
    router.replace('/login');
  }

  function refreshUsers() {
    setUsers([]);
    setCursor(null);
    setHasMore(true);
    loadUsers();
  }

  if (!token) return null;
  if (me && !me.isAdmin) return (
    <main className='flex-1 flex items-center justify-center min-h-[60vh]'>
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center mx-auto mb-4">
          <ShieldXIcon className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Access Denied</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">You don't have permission to access this page</p>
        <Link href="/" className="btn-primary">
          Go Home
        </Link>
      </div>
    </main>
  );

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid opacity-10" />
      <div className="absolute -top-40 -right-32 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-600/20 blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-32 w-80 h-80 rounded-full bg-gradient-to-br from-pink-400/20 to-orange-600/20 blur-3xl animate-float" style={{ animationDelay: "-2s" }} />
      
      {/* Main Content */}
      <main className='flex-1 relative z-10'>
        <div className='max-w-7xl mx-auto px-4 py-10'>
          {/* Page Header */}
          <div className='mb-8'>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className='text-3xl font-bold gradient-text mb-2'>Admin Dashboard</h1>
                <p className='text-gray-600 dark:text-gray-300'>
                  Manage registered users and their accounts. Deleting a user removes all their messages and conversations.
                </p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={refreshUsers} 
                className="btn-secondary"
                title="Refresh user list"
              >
                <RefreshIcon className="w-4 h-4 mr-2" />
                Refresh
              </button>
              <Link href="/chat" className="btn-ghost">
                <MessageSquareIcon className="w-4 h-4 mr-2" />
                Go to Chat
              </Link>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className='mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl'>
              <div className="flex items-center gap-2">
                <AlertCircleIcon className="w-5 h-5 text-red-500" />
                <span className='text-sm text-red-600 dark:text-red-400'>{error}</span>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className='surface-glass border border-white/20 dark:border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden'>
            {users.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center p-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center mb-4">
                  <UsersIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">No users found</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  There are no registered users in the system yet.
                </p>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full'>
                  <thead className='bg-white/30 dark:bg-gray-800/30 border-b border-white/10'>
                    <tr>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        User
                      </th>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Contact
                      </th>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Joined
                      </th>
                      <th className='px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Role
                      </th>
                      <th className='px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-white/10'>
                    {users.map((u, index) => (
                      <tr key={u.id} className='hover:bg-white/20 dark:hover:bg-gray-800/20 transition-colors'>
                        <td className='px-6 py-4'>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 text-white grid place-items-center text-sm font-semibold shadow-lg">
                              {u.displayName?.[0]?.toUpperCase() || "?"}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {u.displayName}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                ID: {u.id.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className="flex items-center gap-2">
                            <PhoneIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-gray-100">{u.phone}</span>
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          <div className="text-sm text-gray-900 dark:text-gray-100">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(u.createdAt).toLocaleTimeString()}
                          </div>
                        </td>
                        <td className='px-6 py-4'>
                          {u.isAdmin ? (
                            <span className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'>
                              <ShieldCheckIcon className="w-3 h-3" />
                              Admin
                            </span>
                          ) : (
                            <span className='inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300'>
                              <UserIcon className="w-3 h-3" />
                              User
                            </span>
                          )}
                        </td>
                        <td className='px-6 py-4 text-right'>
                          {u.isAdmin ? (
                            <span className='text-xs text-gray-400 dark:text-gray-500'>Protected</span>
                          ) : (
                            <button 
                              onClick={() => deleteUser(u.id)} 
                              disabled={deleting === u.id} 
                              className='inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-500 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all'
                            >
                              {deleting === u.id ? (
                                <>
                                  <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <TrashIcon className="w-3 h-3" />
                                  Delete
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Load More */}
            {hasMore && (
              <div className='p-6 border-t border-white/10 text-center'>
                <button 
                  onClick={loadUsers} 
                  disabled={loading} 
                  className={`btn-ghost ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading users...
                    </div>
                  ) : (
                    'Load More Users'
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="surface-glass border border-white/20 dark:border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <UsersIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {users.length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Total Users
                  </div>
                </div>
              </div>
            </div>
            
            <div className="surface-glass border border-white/20 dark:border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <ShieldCheckIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {users.filter(u => u.isAdmin).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Administrators
                  </div>
                </div>
              </div>
            </div>
            
            <div className="surface-glass border border-white/20 dark:border-gray-700/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {users.filter(u => !u.isAdmin).length}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Regular Users
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Icons
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="m22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="m16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 6h18" />
      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}

function AlertCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function ShieldXIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </svg>
  );
}

function MessageSquareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16,17 21,12 16,7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
