import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BarChart3,
  Globe2,
  MessageSquareText,
  Search,
  Truck,
  Users,
} from "lucide-react";
import { Kpi, Panel } from "@/components/AppShell";
import { AlertCenter } from "@/components/AlertCenter";
import { Grafico } from "@/components/AnalyticalChart";
import { abrirPaleta } from "@/components/CommandPalette";
import {
  detectarAlertas,
  FILTROS_POR_DEFECTO,
  kpisLogistica,
  nivelRioParaguayM,
  participacionMercado,
  resumen,
  seriePorPeriodo,
  seriePrecios,
} from "@/lib/data";
import { fmtNumero } from "@/lib/export";
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
    d: "Territorio, metas, presupuesto y forecast.",
    icon: BarChart3,
  },
  {
    to: "/logistica",
    t: "Reportes Logística",
    d: "Stock, plantas, importaciones y río.",
    icon: Truck,
  },
  {
    to: "/mercado",
    t: "Reportes Mercado",
    d: "Participación, precios y competencia.",
    icon: Globe2,
  },
  {
    to: "/operadores",
    t: "Comercial por Operadores",
    d: "Redes, clientes, mayoristas y estaciones.",
    icon: Users,
  },
] as const;

const serieLiquidos = seriePorPeriodo({ ...FILTROS_POR_DEFECTO, desde: "2025-10" }).map(
  (m) => m.valor,
);
const serieGlp = seriePorPeriodo({ ...FILTROS_POR_DEFECTO, producto: "glp", desde: "2025-10" }).map(
  (m) => m.valor,
);

function Index() {
  const ytd = resumen(FILTROS_POR_DEFECTO);
  const glp = resumen({ ...FILTROS_POR_DEFECTO, producto: "glp" });
  const alertas = detectarAlertas();
  const altas = alertas.filter((a) => a.severidad === "alta").length;
  const precio = seriePrecios[seriePrecios.length - 1];

  return (
    <main className="space-y-8 p-6 md:p-10">
      <section className="bg-hero relative overflow-hidden rounded-2xl p-8 text-white md:p-12">
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-brand-stripe" />
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sidebar-primary">
          Petróleos Paraguayos
        </p>
        <h1 className="mt-3 max-w-2xl text-4xl font-bold md:text-5xl">Hub Analítico</h1>
        <p className="mt-3 max-w-xl opacity-80">
          Ventas, red, competencia, logística y mercado en un solo lugar — con Arandu para
          preguntarle a los datos en lenguaje natural.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/chat"
            className="inline-flex items-center gap-2 rounded-lg bg-sidebar-primary px-4 py-2.5 text-sm font-semibold text-sidebar-primary-foreground"
          >
            <MessageSquareText className="size-4" /> Preguntar a Arandu
          </Link>
          <button
            onClick={abrirPaleta}
            className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-4 py-2.5 text-sm font-semibold"
          >
            <Search className="size-4" /> Buscar · Ctrl K
          </button>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Combustibles líquidos · Ene–Sep 2026"
          value={`${fmtNumero(ytd.actual, 0)} ML`}
          delta={ytd.variacionInteranualPct}
          serie={serieLiquidos}
          hint={`${fmtNumero(ytd.cumplimientoPct)}% de la meta (${fmtNumero(ytd.meta, 0)} ML)`}
        />
        <Kpi
          label="GLP · Ene–Sep 2026"
          value={`${fmtNumero(glp.actual, 0)} kt`}
          delta={glp.variacionInteranualPct}
          serie={serieGlp}
          hint="Unidad propia: no se suma con líquidos"
        />
        <Kpi
          label="Stock de diésel"
          value={`${kpisLogistica.stockDiasDiesel} días`}
          hint={`Río Paraguay en ${nivelRioParaguayM} m · ocupación ${kpisLogistica.ocupacionTanquesPct}%`}
        />
        <Kpi
          label="Participación de mercado"
          value={`${participacionMercado[0]?.pct ?? 0}%`}
          hint={
            precio
              ? `Diésel Gs ${fmtNumero(precio.petroparDiesel, 0)}/L vs. mercado Gs ${fmtNumero(precio.mercadoDiesel, 0)}`
              : ""
          }
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Panel
          title={`Qué requiere atención hoy · ${alertas.length} alertas (${altas} altas)`}
          className="xl:col-span-3"
        >
          <AlertCenter alertas={alertas} limite={7} />
        </Panel>
        <Panel title="Ventas de líquidos vs. meta" className="xl:col-span-2">
          <Grafico grafico="metas_vs_realizado" alto={250} />
        </Panel>
      </div>

      <HubSolutions />

      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Reportes</h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {secciones.map(({ to, t, d, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-center gap-4 rounded-xl border bg-card p-5 shadow-card transition hover:border-accent"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary">
                <Icon className="size-5" />
              </span>
              <span className="flex-1">
                <span className="block font-display font-semibold">{t}</span>
                <span className="text-xs text-muted-foreground">{d}</span>
              </span>
              <ArrowRight className="size-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </section>

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
            Preguntale a <strong className="text-foreground">Arandu</strong> —"sabiduría" en
            guaraní— sobre ventas, metas, forecast, estaciones, competencia o prospectos. Responde
            con cifras, gráficos y próximos pasos.
          </p>
        </div>
        <span className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
          Conversar con Arandu
        </span>
      </Link>
    </main>
  );
}
