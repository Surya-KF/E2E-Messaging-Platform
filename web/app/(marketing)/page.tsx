import Link from 'next/link';

export default function LandingPage() {
  const features = [
    { title: 'Realtime Core', desc: 'Low-latency WebSocket delivery & receipts.', icon: SparkIcon },
    { title: 'JWT Security', desc: 'Hardened token auth foundation.', icon: ShieldIcon },
    { title: 'End‑to‑End Ready', desc: 'Server stores only ciphertext (pluggable).', icon: LockIcon },
    { title: 'Scalable Data', desc: 'Postgres + Prisma schema tuned for growth.', icon: DbIcon },
    { title: 'Extensible', desc: 'Add groups, media & presence incrementally.', icon: LayersIcon },
    { title: 'Dark Mode', desc: 'Polished adaptive UI / 2080 aesthetic.', icon: MoonIcon }
  ];
  return (
    <main className="relative flex flex-col min-h-screen">
      {/* Background gradient & orbs */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,.15),transparent_60%),radial-gradient(circle_at_80%_30%,rgba(236,72,153,.15),transparent_55%)]" />
      <div className="pointer-events-none absolute -top-32 -right-24 h-[520px] w-[520px] rounded-full bg-gradient-to-br from-blue-500/30 to-indigo-500/30 blur-3xl animate-[pulse_12s_ease-in-out_infinite] -z-10" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[560px] w-[560px] rounded-full bg-gradient-to-br from-fuchsia-500/25 to-indigo-500/25 blur-3xl animate-[pulse_14s_ease-in-out_infinite] -z-10" />

      {/* Top auth bar */}
      <div className="sticky top-0 z-30 border-b bg-white/80 dark:bg-gray-900/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-7xl mx-auto h-14 px-5 flex items-center justify-between">
          <Link href="/" className="font-semibold tracking-tight text-lg">Messenger</Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm px-4 py-2 rounded-lg border bg-white/60 dark:bg-gray-800/60 hover:bg-white dark:hover:bg-gray-800 transition">Login</Link>
            <Link href="/register" className="text-sm px-4 py-2 rounded-lg bg-blue-600 text-white shadow hover:shadow-md transition">Sign up</Link>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative max-w-7xl mx-auto px-5 pt-20 pb-24 lg:pt-28 lg:pb-32 grid lg:grid-cols-[1.05fr_.95fr] gap-16 items-center">
          <div className="space-y-7 relative z-10">
            <div className="inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full border bg-white/70 dark:bg-gray-900/60 backdrop-blur animate-fade-in">
              <span className="h-2 w-2 rounded-full bg-green-500 animate-ping [animation-duration:2s]" /> Live
            </div>
            <h1 className="text-5xl/tight sm:text-6xl/tight font-black tracking-tight">
              Messaging that feels <span className="text-transparent bg-clip-text bg-[linear-gradient(110deg,#3B82F6,45%,#6366F1,60%,#EC4899)] animate-gradient bg-[length:200%_200%]">ahead of time</span>
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl leading-relaxed">
              A sleek, realtime chat platform starter. Auth, pagination, receipts & dark mode baked in—ready for true end‑to‑end encryption and scale.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="px-6 py-3 rounded-xl bg-blue-600 text-white font-medium shadow hover:shadow-lg hover:-translate-y-0.5 transition">
                Get started
              </Link>
              <Link href="/chat" className="px-6 py-3 rounded-xl border font-medium bg-white/60 dark:bg-gray-900/60 backdrop-blur hover:bg-white dark:hover:bg-gray-800 transition">
                Live demo
              </Link>
            </div>
            <div className="flex gap-6 pt-4 text-xs text-gray-500 dark:text-gray-400">
              <Stat label="Latency" value="<100ms" />
              <Stat label="Setup" value="<5 min" />
              <Stat label="Schema" value="Ready" />
            </div>
          </div>
          <div className="relative hidden lg:block">
              <div className="neon-border p-0.5 rounded-2xl animate-appear" style={{animationDelay:'160ms'}}>
                <div className="glass rounded-[1rem] overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/10">
                  <img src="/hero-chat.svg" alt="App preview" className="w-full h-[480px] object-cover" />
                </div>
              </div>
              <div className="absolute -inset-4 -z-10 bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-fuchsia-500/10 blur-2xl rounded-[2rem]" />
          </div>
        </section>

        {/* Features */}
        <section className="relative max-w-7xl mx-auto px-5 pb-24">
          <h2 className="text-xl font-semibold mb-6 tracking-tight">Built for modern messaging</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f,i) => (
              <div key={f.title} className="group relative rounded-2xl border bg-white/70 dark:bg-gray-900/60 backdrop-blur p-5 overflow-hidden hover:shadow-md transition">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition pointer-events-none bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-fuchsia-500/5" />
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white grid place-items-center shadow-sm">
                    {f.icon({ className: 'h-5 w-5' })}
                  </div>
                  <div>
                    <div className="font-medium leading-tight mb-1">{f.title}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to action */}
        <section className="relative max-w-7xl mx-auto px-5 pb-28">
          <div className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-10 sm:p-14 flex flex-col md:flex-row md:items-center gap-10">
            <div className="flex-1 space-y-4">
              <h3 className="text-2xl font-semibold tracking-tight">Deploy your chat stack today</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 max-w-lg leading-relaxed">Use the starter locally with Docker (Postgres + Redis) then push to your cloud of choice. Extend with groups, media & presence when you’re ready.</p>
              <div className="flex flex-wrap gap-3 pt-1">
                <Link href="/register" className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium shadow hover:shadow-lg hover:-translate-y-0.5 transition">Create account</Link>
                <Link href="/chat" className="px-5 py-2.5 rounded-lg border text-sm font-medium bg-white/70 dark:bg-gray-900/60 hover:bg-white dark:hover:bg-gray-800 transition">Live demo</Link>
              </div>
            </div>
            <div className="relative w-full max-w-sm mx-auto">
              <div className="aspect-[4/3] rounded-2xl bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-fuchsia-600/20 ring-1 ring-inset ring-blue-500/20 dark:ring-blue-400/10 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 font-medium">
                Ready for your custom modules
              </div>
              <div className="absolute -inset-6 -z-10 bg-gradient-to-tr from-blue-500/10 via-indigo-500/10 to-fuchsia-500/10 blur-2xl rounded-[2rem]" />
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-gray-200/60 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur">
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        <div className="max-w-7xl mx-auto px-5 py-14 lg:py-20 grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr_1fr]">
          <div className="space-y-4">
            <Link href="/" className="font-semibold tracking-tight text-lg">Messenger</Link>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-xs">Futuristic realtime chat starter. Opinionated infrastructure, minimal lock‑in.</p>
            <div className="flex gap-3 pt-2">
              <a href="https://github.com" aria-label="GitHub" className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition"><GitHubIcon className="h-5 w-5"/></a>
              <a href="https://x.com" aria-label="X" className="h-9 w-9 rounded-full border flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition"><XIcon className="h-5 w-5"/></a>
            </div>
          </div>
          <FooterCol title="Product" links={[['Features','#features'],['Demo','/chat'],['Themes','#'],['Roadmap','#']]} />
          <FooterCol title="Developers" links={[['GitHub','#'],['Prisma Schema','#'],['WebSocket API','#'],['Deploy Guide','#']]} />
          <FooterCol title="Resources" links={[['Docs (soon)','#'],['Changelog','#'],['Status','#'],['Support','#']]} />
            <FooterCol title="Legal" links={[['Privacy','#'],['Terms','#'],['Security','#'],['License','#']]} />
        </div>
        <div className="border-t border-gray-200/50 dark:border-gray-800/60">
          <div className="max-w-7xl mx-auto px-5 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span>© {new Date().getFullYear()} Messenger</span>
              <span className="hidden sm:inline">•</span>
              <span>Made for speed & extensibility</span>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-gray-800 dark:hover:text-gray-200 transition">Status</a>
              <a href="#" className="hover:text-gray-800 dark:hover:text-gray-200 transition">Security</a>
              <a href="#" className="hover:text-gray-800 dark:hover:text-gray-200 transition">Imprint</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}

// Helper components & icons
function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-gray-900 dark:text-gray-100 font-semibold">{value}</span>
      <span className="text-gray-500 dark:text-gray-400 text-[11px] tracking-wide uppercase">{label}</span>
    </div>
  );
}

function SparkIcon(props: any){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/><path d="M7 14h10"/><path d="M10 7h4"/><path d="m7 3 3 3-3 3-3-3 3-3Z"/><path d="m17 13 3 3-3 3-3-3 3-3Z"/></svg>)}
function ShieldIcon(props: any){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>)}
function LockIcon(props: any){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>)}
function DbIcon(props: any){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 12c0 1.7 4 3 9 3s9-1.3 9-3"/></svg>)}
function LayersIcon(props: any){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12.96 2.31 8.15 4.71a1 1 0 0 1 0 1.74l-8.15 4.71a2 2 0 0 1-1.92 0L2.9 8.76a1 1 0 0 1 0-1.74l8.15-4.71a2 2 0 0 1 1.92 0Z"/><path d="m22.11 10.34-8.88 5.14a2 2 0 0 1-1.96 0l-8.87-5.14"/><path d="m22.1 15.58-8.88 5.14a2 2 0 0 1-1.96 0l-8.87-5.14"/></svg>)}
function MoonIcon(props: any){return(<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>)}
function FooterCol({ title, links }: { title: string; links: [string,string][] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-3 tracking-wide text-gray-900 dark:text-gray-100">{title}</h4>
      <ul className="space-y-2">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition inline-flex items-center gap-1">
              <span>{label}</span>
              <span className="opacity-0 group-hover:opacity-100 transition" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function GitHubIcon(props: any){return(<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M12 .5A12 12 0 0 0 0 12.64c0 5.37 3.44 9.92 8.2 11.53.6.12.82-.27.82-.58 0-.29-.01-1.04-.02-2.05-3.34.76-4.04-1.66-4.04-1.66-.55-1.44-1.34-1.83-1.34-1.83-1.09-.78.08-.76.08-.76 1.2.09 1.83 1.27 1.83 1.27 1.07 1.9 2.8 1.35 3.48 1.03.11-.8.42-1.35.77-1.66-2.67-.32-5.47-1.4-5.47-6.21 0-1.37.46-2.49 1.24-3.37-.13-.32-.54-1.62.12-3.37 0 0 1.01-.34 3.3 1.28a11 11 0 0 1 6 0c2.29-1.62 3.3-1.28 3.3-1.28.66 1.75.25 3.05.12 3.37.77.88 1.23 2 1.23 3.37 0 4.82-2.81 5.88-5.49 6.2.43.38.81 1.11.81 2.25 0 1.63-.02 2.94-.02 3.34 0 .32.21.71.83.58A12.14 12.14 0 0 0 24 12.64 12 12 0 0 0 12 .5Z"/></svg>)}
function XIcon(props: any){return(<svg viewBox="0 0 24 24" fill="currentColor" {...props}><path d="M18.9 2h3.4l-7.42 8.47L24 22h-6.63l-5.18-7.32L6 22H2.6l7.93-9.05L0 2h6.8l4.7 6.6L18.9 2Zm-1.19 18h1.88L6.4 3.55H4.39L17.71 20Z"/></svg>)}
