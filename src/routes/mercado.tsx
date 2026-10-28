import { createFileRoute } from "@tanstack/react-router";
import {
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { PageHeader, Panel } from "@/components/AppShell";
import { mercado } from "@/lib/petropar-data";

export const Route = createFileRoute("/mercado")({
  head: () => ({
    meta: [
      { title: "Reportes Mercado · Petropar" },
      {
        name: "description",
        content: "Participación de mercado y precios de combustibles en Paraguay.",
      },
      { property: "og:title", content: "Reportes Mercado · Petropar" },
      {
        property: "og:description",
        content: "Participación y precios del mercado de combustibles.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

const colores = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--muted-foreground)",
];

function Page() {
  return (
    <main className="pb-10">
      <PageHeader
        eyebrow="Reportes"
        title="Reportes Mercado"
        desc="Participación de mercado de combustibles y comparación de precios."
      />
      <div className="grid gap-6 px-6 md:px-10 lg:grid-cols-2">
        <Panel title="Participación de mercado (%)">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={mercado.participacion}
                dataKey="pct"
                nameKey="empresa"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
              >
                {mercado.participacion.map((_, i) => (
                  <Cell key={i} fill={colores[i] ?? "var(--chart-5)"} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Precio diésel (Gs/L): Petropar vs. promedio de mercado">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mercado.precios}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" fontSize={12} stroke="var(--muted-foreground)" />
              <YAxis domain={[7000, 8000]} fontSize={12} stroke="var(--muted-foreground)" />
              <Tooltip />
              <Legend />
              <Line
                dataKey="petroparDiesel"
                name="Petropar"
                stroke="var(--chart-1)"
                strokeWidth={3}
              />
              <Line
                dataKey="mercadoDiesel"
                name="Mercado"
                stroke="var(--chart-3)"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </main>
  );
}
