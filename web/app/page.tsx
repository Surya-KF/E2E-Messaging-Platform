import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative overflow-hidden">
      {/* Decorative orbs */}
      <div className="pointer-events-none absolute -top-28 -right-16 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-blue-500/40 to-indigo-500/40 blur-3xl floating" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-fuchsia-500/30 to-indigo-500/30 blur-3xl floating" style={{animationDelay:'1s'}} />

      <section className="max-w-6xl mx-auto px-4 pt-24 pb-8 grid lg:grid-cols-[1.05fr_.95fr] gap-14 items-center">
        <div className="space-y-7">
          <div className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border glass animate-fade-in" style={{animationDelay:'60ms'}}>
            <span className="h-2 w-2 rounded-full bg-green-500" /> Live demo
          </div>
          <h1 className="text-6xl/tight sm:text-7xl/tight font-black tracking-tight animate-slide-up" style={{animationDelay:'120ms'}}>
            Chat that feels like tomorrow
            <span className="block text-transparent bg-clip-text animate-gradient bg-[linear-gradient(110deg,#3B82F6,45%,#6366F1,60%,#EC4899)]">built in 2080</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg animate-slide-up" style={{animationDelay:'180ms'}}>
            Secure accounts with JWT, realtime messaging, and a crisp interface.
          </p>
          <div className="flex flex-wrap gap-3 animate-slide-up" style={{animationDelay:'220ms'}}>
            <Link href="/login" className="px-5 py-3 rounded-lg bg-blue-600 text-white font-medium shadow hover:shadow-lg hover:-translate-y-0.5 transition">Login</Link>
            <Link href="/register" className="px-5 py-3 rounded-lg border font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">Create account</Link>
            <Link href="/chat" className="px-5 py-3 rounded-lg border font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition">Open App</Link>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 animate-fade-in" style={{animationDelay:'260ms'}}>
            MVP note: E2E encryption mocked for now.
          </p>
        </div>
        <div className="hidden lg:block animate-appear" style={{animationDelay:'180ms'}}>
          <div className="neon-border p-0.5">
            <div className="glass rounded-xl overflow-hidden">
              <img src="/hero-chat.svg" alt="Chat interface preview" className="w-full h-[460px] object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 pb-28">
        <h2 className="text-xl font-semibold mb-4">Why you'll like it</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[{ title: 'Neon clarity', desc: 'Glass surfaces and glow edges without the visual noise.' },{ title: 'JWT Security', desc: 'Register/login with tokens, simple and robust.' },{ title: 'Realtime core', desc: 'Instant messages and delivery receipts.' }].map((f, i) => (
            <div key={f.title} className="neon-border p-0.5 animate-slide-up" style={{animationDelay:`${i*90}ms`}}>
              <div className="glass rounded-[0.95rem] p-5">
                <div className="text-sm font-semibold mb-1">{f.title}</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
