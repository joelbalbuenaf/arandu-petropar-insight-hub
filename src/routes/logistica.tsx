import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Kpi, PageHeader, Panel } from "@/components/AppShell";
import { logistica } from "@/lib/petropar-data";

export const Route = createFileRoute("/logistica")({
  head: () => ({
    meta: [
      { title: "Reportes Logística · Petropar" },
      { name: "description", content: "Stock por planta, importaciones y nivel de entregas de Petropar." },
      { property: "og:title", content: "Reportes Logística · Petropar" },
      { property: "og:description", content: "Stock, plantas e importaciones." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  const k = logistica.kpis;
  return (
    <main className="pb-10">
      <PageHeader eyebrow="Reportes" title="Reportes Logística" desc="Almacenamiento, plantas, importaciones fluviales y terrestres." />
      <div className="space-y-6 px-6 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Stock diésel" value={`${k.stockDiasDiesel} días`} />
          <Kpi label="Stock naftas" value={`${k.stockDiasNaftas} días`} />
          <Kpi label="Ocupación tanques" value={`${k.ocupacionTanquesPct}%`} />
          <Kpi label="Entregas a tiempo" value={`${k.entregasATiempoPct}%`} />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Panel title="Ocupación por planta">
            <div className="space-y-4">
              {logistica.plantas.map((p) => {
                const pct = Math.round((p.stockM3 / p.capacidadM3) * 100);
                return (
                  <div key={p.planta}>
                    <div className="mb-1 flex justify-between text-sm"><span>{p.planta}</span><span className="text-muted-foreground">{p.stockM3.toLocaleString("es-PY")} / {p.capacidadM3.toLocaleString("es-PY")} m³</span></div>
                    <div className="h-2.5 rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </Panel>
          <Panel title={`Importaciones (miles m³) · Río Paraguay: ${logistica.nivelRioParaguayM} m`}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={logistica.importaciones}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="mes" fontSize={12} stroke="var(--muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--muted-foreground)" />
                <Tooltip /><Legend />
                <Bar dataKey="fluvial" name="Fluvial" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="terrestre" name="Terrestre" fill="var(--chart-2)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Panel>
        </div>
      </div>
    </main>
  );
}
