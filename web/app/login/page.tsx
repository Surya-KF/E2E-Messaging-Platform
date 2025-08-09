"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) router.replace("/chat");
  }, [router]);

  useEffect(() => {
    document.documentElement.classList.add('no-scroll');
    return () => document.documentElement.classList.remove('no-scroll');
  }, []);

  function normalizePhone(v: string) {
    const t = v.trim();
    return t.startsWith("+") ? t : `+${t}`;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, { phone: normalizePhone(phone), password });
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("me", JSON.stringify(res.data.user));
      const dest = res.data.user?.isAdmin ? '/admin' : '/chat';
      router.replace(dest);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Login failed";
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md bg-white/80 dark:bg-gray-900/60 backdrop-blur rounded-2xl border shadow-sm p-6">
        <h1 className="text-xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Enter your phone and password.</p>
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone</label>
            <input id="phone" className="w-full border rounded-lg px-3 py-2" value={phone} onChange={(e)=>setPhone(e.target.value)} placeholder="+123456789" inputMode="tel" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <div className="flex gap-2">
              <input id="password" className="w-full border rounded-lg px-3 py-2" type={show?"text":"password"} value={password} onChange={(e)=>setPassword(e.target.value)} minLength={6} required />
              <button type="button" className="px-3 py-2 border rounded-lg text-sm" onClick={()=>setShow(s=>!s)}>{show?"Hide":"Show"}</button>
            </div>
          </div>
          {error ? <div className="text-sm text-red-600">{error}</div> : null}
          <button className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50" type="submit" disabled={loading || !phone.trim() || password.length<6}>{loading?"Signing in...":"Sign in"}</button>
        </form>
        <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">No account? <Link className="text-blue-600 hover:underline" href="/register">Register</Link></p>
      </div>
    </main>
  );
}
