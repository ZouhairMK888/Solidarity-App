import Navbar from './Navbar';

const FooterLink = ({ href, children }) => (
  <a href={href} className="block hover:text-white transition-colors">
    {children}
  </a>
);

const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-slate-50">
    <Navbar />
    <main className="flex-1">
      {children}
    </main>

    <footer className="relative overflow-hidden border-t border-slate-200 bg-slate-950 text-white mt-16">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.32),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.20),_transparent_28%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-10 lg:grid-cols-[1.3fr_0.7fr_0.7fr_0.7fr]">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-950/30">
                <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2a5 5 0 00-10 0v2m8-13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-display text-xl font-bold tracking-tight">Solidarity</span>
            </div>
            <p className="max-w-md text-sm leading-relaxed text-slate-300">
              A community platform for discovering local campaigns, organizing missions, and helping volunteers show up where they are needed most.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['Community first', 'Transparent action', 'Local impact'].map((item) => (
                <span key={item} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-emerald-100">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">Platform</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <FooterLink href="/#campaigns">Campaigns</FooterLink>
              <FooterLink href="/#how-it-works">How it works</FooterLink>
              <FooterLink href="/#places">Places</FooterLink>
              <FooterLink href="/#about">About</FooterLink>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">For users</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <FooterLink href="/register">Join as volunteer</FooterLink>
              <FooterLink href="/login">Sign in</FooterLink>
              <FooterLink href="/#campaigns">Find missions</FooterLink>
              <span className="block text-slate-500">Organizer access by admin</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400 mb-4">Contact</h3>
            <div className="space-y-3 text-sm text-slate-300">
              <p>Casablanca, Morocco</p>
              <p>support@solidarity.local</p>
              <p>Built for local communities and social action teams.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Solidarity. Building stronger communities together.
          </p>
          <div className="flex items-center gap-2 text-slate-400">
            <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium">Made with care for your community</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
);

export default Layout;
