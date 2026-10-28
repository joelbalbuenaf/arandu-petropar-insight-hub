import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { PageHeader, Panel } from "@/components/AppShell";
import { operadores } from "@/lib/petropar-data";

export const Route = createFileRoute("/operadores")({
  head: () => ({
    meta: [
      { title: "Reporte Comercial por Operadores · Petropar" },
      { name: "description", content: "Volumen, crecimiento y cumplimiento de metas por operador de Petropar." },
      { property: "og:title", content: "Reporte Comercial por Operadores · Petropar" },
      { property: "og:description", content: "Desempeño comercial por operador." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <main className="pb-10">
      <PageHeader eyebrow="Reportes" title="Reporte Comercial por Operadores" desc="Redes de estaciones, grandes clientes, mayoristas y sector público." />
      <div className="space-y-6 px-6 md:px-10">
        <Panel title="Volumen por operador (millones de litros)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={operadores}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="operador" fontSize={11} stroke="var(--muted-foreground)" interval={0} tickFormatter={(v: string) => v.split(" ").slice(0, 2).join(" ")} />
              <YAxis fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Bar dataKey="litrosMl" name="ML" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Detalle">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase text-muted-foreground">
                <tr><th className="py-2">Operador</th><th>Estaciones</th><th>Volumen (ML)</th><th>Crecimiento</th><th>Cumplimiento meta</th></tr>
              </thead>
              <tbody>
                {operadores.map((o) => (
                  <tr key={o.operador} className="border-t">
                    <td className="py-3 font-medium">{o.operador}</td>
                    <td>{o.estaciones || "—"}</td>
                    <td>{o.litrosMl}</td>
                    <td className={o.crecimientoPct >= 0 ? "text-success" : "text-destructive"}>{o.crecimientoPct > 0 ? "+" : ""}{o.crecimientoPct}%</td>
                    <td><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${o.cumplimientoPct >= 100 ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"}`}>{o.cumplimientoPct}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </main>
  );
}
