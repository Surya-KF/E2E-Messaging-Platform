"use client";
import { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

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

  if (!token) return null;
  if (me && !me.isAdmin) return <main className='min-h-[60vh] grid place-items-center text-sm text-gray-500'>Forbidden</main>;

  return (
    <main className='max-w-5xl mx-auto px-4 py-10'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-2xl font-semibold mb-2'>Admin Dashboard</h1>
          <p className='text-sm text-gray-600 dark:text-gray-300 mb-4'>Manage users. Deleting a user removes their messages & conversations.</p>
        </div>
        <button onClick={logout} className='h-9 px-4 rounded-lg border text-sm hover:bg-gray-50 dark:hover:bg-gray-800'>Logout</button>
      </div>
      {error && <div className='mb-4 text-sm text-red-600'>{error}</div>}
      <div className='overflow-x-auto border rounded-xl bg-white/70 dark:bg-gray-900/60 backdrop-blur'>
        <table className='min-w-full text-sm'>
          <thead className='bg-gray-50 dark:bg-gray-800'>
            <tr className='text-left'>
              <th className='px-3 py-2 font-medium'>Name</th>
              <th className='px-3 py-2 font-medium'>Phone</th>
              <th className='px-3 py-2 font-medium'>Created</th>
              <th className='px-3 py-2 font-medium'>Role</th>
              <th className='px-3 py-2 font-medium text-right'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className='border-t'>
                <td className='px-3 py-2'>{u.displayName}</td>
                <td className='px-3 py-2'>{u.phone}</td>
                <td className='px-3 py-2'>{new Date(u.createdAt).toLocaleString()}</td>
                <td className='px-3 py-2'>{u.isAdmin ? 'Admin' : 'User'}</td>
                <td className='px-3 py-2 text-right'>
                  {u.isAdmin ? <span className='text-xs text-gray-400'>--</span> : (
                    <button onClick={()=>deleteUser(u.id)} disabled={deleting===u.id} className='text-xs px-2 py-1 rounded border text-red-600 hover:bg-red-50 disabled:opacity-50'>
                      {deleting===u.id? 'Deleting...' : 'Delete'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {users.length===0 && !loading && (
              <tr><td className='px-3 py-6 text-center text-gray-500' colSpan={5}>No users</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className='mt-4 flex items-center gap-3'>
        {hasMore && <button onClick={loadUsers} disabled={loading} className='px-3 py-2 rounded border text-sm hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50'>{loading? 'Loading...' : 'Load more'}</button>}
        <button onClick={()=>{ setUsers([]); setCursor(null); setHasMore(true); loadUsers(); }} className='px-3 py-2 rounded border text-sm'>Refresh</button>
      </div>
    </main>
  );
}
