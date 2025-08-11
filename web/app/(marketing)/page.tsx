import Link from 'next/link';
import { FC } from 'react';

interface Feature {
  title: string;
  desc: string;
  icon: FC<any>;
  gradient: string;
}

interface Stat {
  label: string;
  value: string;
}

export default function LandingPage() {
  const features: Feature[] = [
    { 
      title: 'Instant Messaging', 
      desc: 'Real-time WebSocket delivery with message receipts and typing indicators.',
      icon: MessageIcon,
      gradient: 'from-blue-500 to-cyan-500'
    },
    { 
      title: 'Secure Authentication', 
      desc: 'JWT-based auth with refresh tokens and secure session management.',
      icon: ShieldIcon,
      gradient: 'from-emerald-500 to-teal-500'
    },
    { 
      title: 'End-to-End Ready', 
      desc: 'Built for E2E encryption with pluggable cryptography modules.',
      icon: LockIcon,
      gradient: 'from-purple-500 to-indigo-500'
    },
    { 
      title: 'Scalable Backend', 
      desc: 'Postgres database with Prisma ORM, optimized for performance.',
      icon: DatabaseIcon,
      gradient: 'from-orange-500 to-red-500'
    },
    { 
      title: 'Modern UI', 
      desc: 'Glass morphism design with dark mode and smooth animations.',
      icon: PaletteIcon,
      gradient: 'from-pink-500 to-rose-500'
    },
    { 
      title: 'Mobile First', 
      desc: 'Responsive design that works perfectly on all devices.',
      icon: DeviceIcon,
      gradient: 'from-violet-500 to-purple-500'
    }
  ];

  const stats: Stat[] = [
    { label: 'Response Time', value: '<100ms' },
    { label: 'Setup Time', value: '5 min' },
    { label: 'Uptime', value: '99.9%' }
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid opacity-20" />
      <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-600/30 blur-3xl animate-float" />
      <div className="absolute -bottom-40 -left-32 w-96 h-96 rounded-full bg-gradient-to-br from-pink-400/30 to-orange-600/30 blur-3xl animate-float" style={{animationDelay: '3s'}} />
      
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-32">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left Column - Content */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-green-100 text-green-800 rounded-full dark:bg-green-900/30 dark:text-green-400 animate-fade-in">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse-glow" />
                    Live Demo Available
                  </div>
                  
                  <h1 className="text-display-2xl text-balance leading-tight animate-slide-up" style={{animationDelay: '0.1s'}}>
                    <span className="block">Messaging that feels</span>
                    <span className="gradient-text animate-gradient">ahead of time</span>
                  </h1>
                  
                  <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl animate-slide-up" style={{animationDelay: '0.2s'}}>
                    A modern, secure chat platform with real-time messaging, JWT authentication, and beautiful UI. Ready for end-to-end encryption and built to scale.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{animationDelay: '0.3s'}}>
                  <Link href="/register" className="btn-primary">
                    Get Started Free
                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                  </Link>
                  <Link href="/chat" className="btn-secondary">
                    <PlayIcon className="w-4 h-4 mr-2" />
                    Try Demo
                  </Link>
                </div>

                <div className="flex flex-wrap gap-8 pt-4 animate-fade-in" style={{animationDelay: '0.4s'}}>
                  {stats.map((stat, index) => (
                    <div key={stat.label} className="text-center">
                      <div className="text-2xl sm:text-3xl font-bold gradient-text">{stat.value}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Visual */}
              <div className="relative animate-scale-in" style={{animationDelay: '0.2s'}}>
                <div className="relative">
                  {/* Device Frame */}
                  <div className="relative mx-auto w-full max-w-sm">
                    <div className="surface-glass rounded-3xl p-2 shadow-2xl">
                      <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                        <img 
                          src="/hero-chat.svg" 
                          alt="Modern chat interface" 
                          className="w-full h-96 object-cover"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Floating Elements */}
                  <div className="absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl rotate-12 shadow-lg animate-float opacity-80" />
                  <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-gradient-to-br from-pink-500 to-orange-500 rounded-xl -rotate-12 shadow-lg animate-float opacity-80" style={{animationDelay: '1.5s'}} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-display-lg animate-slide-up">
                Built for modern messaging
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>
                Everything you need for a professional messaging platform, from real-time communication to enterprise-grade security.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={feature.title}
                  className="group relative card-elevated p-6 hover:shadow-xl transition-all duration-300 animate-scale-in"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  <div className="space-y-4">
                    <div className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${feature.gradient} shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold group-hover:gradient-text transition-all duration-300">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                        {feature.desc}
                      </p>
                    </div>
                  </div>
                  
                  {/* Hover effect */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
          <div className="max-w-4xl mx-auto">
            <div className="relative overflow-hidden card-elevated p-8 sm:p-12 lg:p-16 text-center">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
              
              <div className="relative space-y-6">
                <h2 className="text-display-lg animate-slide-up">
                  Ready to transform your communication?
                </h2>
                <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto animate-slide-up" style={{animationDelay: '0.1s'}}>
                  Deploy your own secure messaging platform in minutes. Start with our free plan and scale as you grow.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4 animate-scale-in" style={{animationDelay: '0.2s'}}>
                  <Link href="/register" className="btn-primary text-lg px-8 py-4">
                    Start Building Today
                  </Link>
                  <Link href="/chat" className="btn-ghost text-lg px-8 py-4">
                    Explore Features
                  </Link>
                </div>
                
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-in" style={{animationDelay: '0.3s'}}>
                  No credit card required • Open source • Deploy anywhere
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative border-t border-gray-200/50 dark:border-gray-800/50">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
        
        <div className="px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
              <div className="col-span-2 md:col-span-1">
                <Link href="/" className="text-2xl font-bold gradient-text">
                  E2E
                </Link>
                <p className="mt-4 text-gray-600 dark:text-gray-300 leading-relaxed">
                  Modern messaging platform built for speed, security, and scale.
                </p>
                <div className="flex gap-4 mt-6">
                  <SocialLink href="#" icon={GitHubIcon} />
                  <SocialLink href="#" icon={TwitterIcon} />
                  <SocialLink href="#" icon={DiscordIcon} />
                </div>
              </div>
              
              <FooterColumn 
                title="Product" 
                links={[
                  ['Features', '#features'],
                  ['Demo', '/chat'],
                  ['Pricing', '#pricing'],
                  ['Security', '#security']
                ]} 
              />
              
              <FooterColumn 
                title="Developers" 
                links={[
                  ['Documentation', '#docs'],
                  ['API Reference', '#api'],
                  ['GitHub', '#github'],
                  ['Changelog', '#changelog']
                ]} 
              />
              
              <FooterColumn 
                title="Company" 
                links={[
                  ['About', '#about'],
                  ['Blog', '#blog'],
                  ['Careers', '#careers'],
                  ['Contact', '#contact']
                ]} 
              />
            </div>
            
            <div className="pt-8 border-t border-gray-200/50 dark:border-gray-800/50">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  © {new Date().getFullYear()} E2E. Built with ❤️ for developers.
                </p>
                <div className="flex gap-6">
                  <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Privacy
                  </Link>
                  <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Terms
                  </Link>
                  <Link href="#" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    Status
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Component helpers
function FooterColumn({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">{title}</h4>
      <ul className="space-y-3">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link 
              href={href} 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SocialLink({ href, icon: Icon }: { href: string; icon: FC<any> }) {
  return (
    <a
      href={href}
      className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
    >
      <Icon className="w-5 h-5" />
    </a>
  );
}

// Icons
function MessageIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function ShieldIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}

function LockIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="m7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function DatabaseIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="m3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5" />
      <path d="m3 12c0 1.7 4 3 9 3s9-1.3 9-3" />
    </svg>
  );
}

function PaletteIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

function DeviceIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="m9 22 6 0" />
    </svg>
  );
}

function ArrowRightIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function PlayIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <polygon points="6,3 20,12 6,21" />
    </svg>
  );
}

function GitHubIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function TwitterIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0190 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}
