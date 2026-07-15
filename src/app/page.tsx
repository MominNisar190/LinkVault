import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ArrowRight, Zap, Shield, BarChart3, RefreshCw, Link2, Globe, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl text-white">LinkVault</span>
        </div>
        <div className="flex gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="text-white/70 hover:text-white">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-primary hover:bg-primary/90">Get Started</Button>
          </Link>
          <Link href="/admin-login">
            <Button variant="outline" className="border-red-500/40 text-red-400 hover:bg-red-500/10 hover:text-red-300 hover:border-red-500/60 gap-1.5">
              <Shield className="h-4 w-4" />
              Admin
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-sm text-primary mb-8">
          <Zap className="h-3.5 w-3.5" />
          Smart Dynamic Redirect Platform
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-tight mb-6">
          One Short Link.{" "}
          <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
            Infinite Destinations.
          </span>
        </h1>
        <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10">
          Create dynamic short links that always keep the same URL while you freely change
          the destination at any time. Full analytics, history, and access control included.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/sign-up">
            <Button size="xl" className="bg-primary hover:bg-primary/90 gap-2">
              Start for Free <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="xl" variant="outline" className="border-white/20 text-white hover:bg-white/5">
              Sign In
            </Button>
          </Link>
        </div>
      </section>

      {/* Demo card */}
      <section className="max-w-2xl mx-auto px-6 mb-20">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
          <p className="text-xs uppercase text-white/40 tracking-widest mb-5">How it works</p>
          <div className="space-y-4 text-sm">
            {[
              { step: "1", label: "Original URL", value: "https://yourdomain.com/very/long/marketing/url?ref=abc123", color: "text-white/50" },
              { step: "2", label: "Your short link", value: "https://lnkvlt.io/Ab82Kd", color: "text-violet-400 font-mono font-bold text-base" },
              { step: "3", label: "Change destination anytime", value: "Update the link — short URL stays the same forever!", color: "text-emerald-400" },
            ].map((row) => (
              <div key={row.step} className="flex items-start gap-4">
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-primary">{row.step}</span>
                </div>
                <div>
                  <p className="text-white/40 text-xs mb-0.5">{row.label}</p>
                  <p className={row.color}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Everything you need</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: RefreshCw, title: "Dynamic Redirects",    desc: "Change the destination URL anytime while keeping the same short link." },
            { icon: BarChart3, title: "Deep Analytics",       desc: "Track clicks, visitors, countries, browsers, devices and referrers." },
            { icon: Lock,      title: "Password Protection",  desc: "Lock any link behind a password to control who accesses it." },
            { icon: Globe,     title: "Custom Domains",       desc: "Use your own domain for a fully branded short link experience." },
            { icon: Link2,     title: "Link History",         desc: "Every destination change is logged with one-click rollback." },
            { icon: Shield,    title: "Admin Controls",       desc: "Role-based access, audit logs, and approval-gated registration." },
          ].map((f) => (
            <div key={f.title} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.08] transition-colors">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center mb-4">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/50">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-white/30 text-sm">
        © {new Date().getFullYear()} LinkVault — Smart Dynamic Redirect Platform
      </footer>
    </div>
  );
}
