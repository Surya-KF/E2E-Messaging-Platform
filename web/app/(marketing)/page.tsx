import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative">
      {/* Top auth bar */}
      <div className="sticky top-0 z-20 border-b bg-white/80 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-6xl mx-auto h-12 px-4 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight">Messenger</Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm px-3 py-1.5 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800">Login</Link>
            <Link href="/register" className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white">Sign up</Link>
          </div>
        </div>
      </div>
      <section className="max-w-6xl mx-auto px-4 py-16 lg:py-24 grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl/tight sm:text-5xl/tight font-bold tracking-tight">
            Private messaging,
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> made simple</span>
          </h1>
          <p className="text-gray-600 text-lg">
            A modern, minimal messenger with JWT-based authentication. Start a secure conversation in seconds.
          </p>
          <div className="flex gap-3">
            <Link href="/chat" className="px-5 py-3 rounded-lg bg-blue-600 text-white font-medium shadow hover:shadow-md transition">Open App</Link>
            <a href="https://github.com/" target="_blank" className="px-5 py-3 rounded-lg border font-medium hover:bg-gray-50">GitHub</a>
          </div>
          <p className="text-xs text-gray-500">MVP: encryption mocked; JWT secures registration and login.</p>
        </div>
        <div className="hidden lg:block">
          <div className="rounded-2xl border bg-white/70 backdrop-blur shadow-sm p-4">
            <div className="h-[420px] rounded-xl border bg-gradient-to-b from-gray-50 to-white grid place-items-center text-gray-500">
              App preview
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { title: 'JWT Auth', desc: 'Registration and login secured with JSON Web Tokens.' },
          { title: 'Realtime', desc: 'WebSocket-powered messaging and delivery receipts.' },
          { title: 'Clean UI', desc: 'Minimal, responsive, and keyboard-friendly experience.' },
        ].map((f) => (
          <div key={f.title} className="rounded-xl border bg-white/70 backdrop-blur p-5 shadow-sm">
            <div className="text-sm font-semibold mb-1">{f.title}</div>
            <div className="text-sm text-gray-600">{f.desc}</div>
          </div>
        ))}
      </section>
    </main>
  );
}
