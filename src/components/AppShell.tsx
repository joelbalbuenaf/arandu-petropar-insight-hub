import { Link } from "@tanstack/react-router";
import { BarChart3, Truck, Globe2, Users, MessageSquareText, LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";
import logo from "@/assets/arandu.png";
import petroparLogo from "@/assets/petropar-logo.png";

const nav = [
  { to: "/", label: "Inicio", icon: LayoutGrid },
  { to: "/comercial", label: "Reportes Comerciales", icon: BarChart3 },
  { to: "/logistica", label: "Reportes Logística", icon: Truck },
  { to: "/mercado", label: "Reportes Mercado", icon: Globe2 },
  { to: "/operadores", label: "Comercial por Operadores", icon: Users },
  { to: "/chat", label: "Habla con tus datos", icon: MessageSquareText },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="h-1.5 bg-brand-stripe" />
        <div className="px-5 py-6">
          <div className="rounded-lg bg-card p-3"><img src={petroparLogo} alt="Petropar" width={225} height={68} className="h-auto w-full" /></div>
          <p className="mt-3 font-display text-xs font-bold uppercase tracking-widest text-sidebar-primary">Hub Analítico</p>
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary font-semibold" }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>
        <Link to="/chat" className="m-3 flex items-center gap-3 rounded-xl bg-sidebar-accent p-3">
          <img src={logo} alt="Arandu" width={40} height={40} className="size-10 rounded-lg bg-card object-cover object-top p-0.5" />
          <div>
            <p className="text-sm font-semibold text-sidebar-accent-foreground">Arandu</p>
            <p className="text-xs opacity-70">Tu agente de datos</p>
          </div>
        </Link>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="flex items-center gap-2 overflow-x-auto bg-sidebar p-3 md:hidden">
          <img src={petroparLogo} alt="Petropar" width={90} height={27} className="h-7 w-auto rounded bg-card p-0.5" />
          {nav.map(({ to, label }) => (
            <Link key={to} to={to} className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-sidebar-foreground"
              activeOptions={{ exact: to === "/" }}
              activeProps={{ className: "bg-sidebar-accent text-sidebar-primary" }}>
              {label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, desc }: { eyebrow: string; title: string; desc: string }) {
  return (
    <header className="px-6 pt-8 pb-4 md:px-10">
      <p className="text-xs font-semibold uppercase tracking-widest text-chart-4">{eyebrow}</p>
      <h1 className="mt-1 text-3xl font-bold">{title}</h1>
      <p className="mt-1 max-w-2xl text-muted-foreground">{desc}</p>
      <p className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground">Datos de ejemplo · Ene–Sep 2026</p>
    </header>
  );
}

export function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-card">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-nowrap font-display text-2xl font-bold xl:text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-success">{hint}</p>}
    </div>
  );
}

export function Panel({ title, children, className = "" }: { title: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border bg-card p-5 shadow-card ${className}`}>
      <h2 className="mb-4 text-base font-semibold">{title}</h2>
      {children}
    </section>
  );
}
