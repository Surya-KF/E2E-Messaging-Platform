"use client";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, go to chat
  useEffect(() => {
    const t = localStorage.getItem("token");
    if (t) router.replace("/chat");
  }, [router]);

  const canSubmit = useMemo(() => {
    return (
      displayName.trim().length >= 1 &&
      phone.trim().length >= 6 &&
      password.length >= 6 &&
      confirm.length >= 6 &&
      password === confirm
    );
  }, [displayName, phone, password, confirm]);

  function normalizePhone(v: string) {
    const t = v.trim();
    return t.startsWith("+") ? t : `+${t}`;
  }

  function randomIdentityKeyB64() {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const identityKey = randomIdentityKeyB64();
      await axios.post(`${API_URL}/auth/register`, {
        phone: normalizePhone(phone),
        displayName: displayName.trim(),
        password,
        identityKey,
      });
      // Do not auto-login; send user to login screen
      router.replace("/chat");
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || "Registration failed";
      setError(String(msg));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-[100dvh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-2xl border shadow-sm p-6">
        <h1 className="text-xl font-semibold mb-1">Create your account</h1>
        <p className="text-sm text-gray-600 mb-6">Fill in your details to start messaging.</p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="displayName">Name</label>
            <input
              id="displayName"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Jane Doe"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="phone">Phone number</label>
            <input
              id="phone"
              className="w-full border rounded-lg px-3 py-2"
              placeholder="+1234567890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              inputMode="tel"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">Password</label>
            <div className="flex gap-2">
              <input
                id="password"
                className="w-full border rounded-lg px-3 py-2"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="px-3 py-2 border rounded-lg text-sm"
                onClick={() => setShowPassword((v) => !v)}
                aria-pressed={showPassword}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirm">Re-enter password</label>
            <div className="flex gap-2">
              <input
                id="confirm"
                className="w-full border rounded-lg px-3 py-2"
                type={showConfirm ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
              />
              <button
                type="button"
                className="px-3 py-2 border rounded-lg text-sm"
                onClick={() => setShowConfirm((v) => !v)}
                aria-pressed={showConfirm}
              >
                {showConfirm ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <button
            type="submit"
            disabled={!canSubmit || submitting}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-4 text-sm text-gray-600">
          Already have an account? <Link href="/chat" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </main>
  );
}
