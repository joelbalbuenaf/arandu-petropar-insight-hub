import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Truck, Globe2, Users, ArrowRight } from "lucide-react";
import { Kpi } from "@/components/AppShell";
import { kpisComerciales, logistica, mercado } from "@/lib/petropar-data";
import logo from "@/assets/arandu.png";
import { HubSolutions } from "@/components/HubSolutions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hub Analítico Petropar" },
      {
        name: "description",
        content:
          "Soluciones Petropar: desempeño de estaciones, evaluación de sitios, competencia, clientes B2B y consultas sobre SAP, junto a reportes y Arandu.",
      },
      { property: "og:title", content: "Hub Analítico Petropar" },
      {
        property: "og:description",
        content:
          "Cinco soluciones de inteligencia comercial, reportes y conversaciones con Arandu en el Hub de Petropar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const secciones = [
  {
    to: "/comercial",
    t: "Reportes Comerciales",
    d: "Ventas por producto, región y facturación.",
    icon: BarChart3,
  },
  {
    to: "/logistica",
    t: "Reportes Logística",
    d: "Stock, plantas, importaciones y entregas.",
    icon: Truck,
  },
  {
    to: "/mercado",
    t: "Reportes Mercado",
    d: "Participación, precios y referencia Brent.",
    icon: Globe2,
  },
  {
    to: "/operadores",
    t: "Comercial por Operadores",
    d: "Desempeño de redes, clientes y mayoristas.",
    icon: Users,
  },
] as const;

function Index() {
  return (
    <main className="space-y-8 p-6 md:p-10">
      <section className="bg-hero relative overflow-hidden rounded-2xl p-8 text-primary-foreground md:p-12">
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-brand-stripe" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">
          Petróleos Paraguayos
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold md:text-5xl">Hub Analítico</h1>
        <p className="mt-3 max-w-xl opacity-80">
          Importación, almacenamiento, distribución y comercialización de combustibles, GLP y etanol
          — en un solo tablero.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {secciones.map(({ to, t, d, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-4 rounded-xl border bg-card p-6 shadow-card transition hover:border-accent"
          >
            <span className="grid size-12 place-items-center rounded-lg bg-secondary text-primary">
              <Icon className="size-6" />
            </span>
            <span className="flex-1">
              <span className="block font-display text-lg font-semibold">{t}</span>
              <span className="text-sm text-muted-foreground">{d}</span>
            </span>
            <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
          </Link>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          label="Ventas acumuladas"
          value={`${kpisComerciales.ventasTotalesMl} ML`}
          hint={`+${kpisComerciales.crecimientoInteranualPct}% interanual`}
        />
        <Kpi label="Facturación" value={`USD ${kpisComerciales.facturacionMMUSD} M`} />
        <Kpi label="Stock diésel" value={`${logistica.kpis.stockDiasDiesel} días`} />
        <Kpi label="Participación de mercado" value={`${mercado.participacion[0]?.pct ?? 0}%`} />
      </div>

      <HubSolutions />

      <Link
        to="/chat"
        className="flex flex-col items-center gap-6 rounded-2xl border-2 border-accent bg-card p-6 shadow-card md:flex-row"
      >
        <img
          src={logo}
          alt="Arandu"
          width={96}
          height={96}
          loading="lazy"
          className="size-24 object-contain"
        />
        <div className="flex-1 text-center md:text-left">
          <h2 className="text-2xl font-bold">Habla con tus datos</h2>
          <p className="text-muted-foreground">
            Pregúntale a <strong className="text-foreground">Arandu</strong> —"sabiduría" en
            guaraní— cualquier cosa sobre ventas, stock, mercado u operadores.
          </p>
        </div>
        <span className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Conversar con Arandu
        </span>
      </Link>
    </main>
  );
}
