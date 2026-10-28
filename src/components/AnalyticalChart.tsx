import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { logistica, mercado, operadoresDetalle, presupuestoComercial, proyectarVentas, ventasGeograficas, ventasLiquidas, ventasMensuales, type ProductoLiquido } from "@/lib/petropar-data";
import type { ChartId } from "@/lib/analytical-questions";

const config: Record<ChartId, { title: string; data: Record<string, string | number>[]; key: string; series: [string, string][]; line?: boolean }> = {
  ventas: { title: "Ventas de combustibles líquidos · ML", data: ventasMensuales, key: "mes", series: [["diesel", "Diésel"], ["naftas", "Naftas"], ["etanol", "Etanol"]], line: true },
  glp: { title: "Ventas de GLP · miles de toneladas", data: ventasMensuales, key: "mes", series: [["glp", "GLP"]], line: true },
  territorio: { title: "Departamentos seleccionados · ML", data: ventasGeograficas, key: "depto", series: [["litros", "Realizado"], ["meta", "Meta"]] },
  operadores: { title: "Operadores · ML", data: operadoresDetalle.map((o,i) => ({ ...o, codigo: `Op. ${i + 1}` })), key: "codigo", series: [["litrosMl", "Realizado"], ["metaMl", "Meta"]] },
  metas: { title: "Metas vs. realizado · combustibles líquidos · ML", data: ventasLiquidas, key: "mes", series: [["realizado", "Realizado"], ["meta", "Meta"]] },
  presupuesto: { title: "Presupuesto comercial · USD millones", data: presupuestoComercial.map((o,i) => ({ ...o, codigo: `Op. ${i + 1}` })), key: "codigo", series: [["presupuesto", "Presupuesto"], ["ejecutado", "Ejecutado"]] },
  forecast: { title: "Proyección de combustibles líquidos · ML", data: [...ventasLiquidas.map(v => ({ mes: v.mes, realizado: v.realizado })), ...proyectarVentas()], key: "mes", series: [["realizado", "Realizado"], ["base", "Proyección lineal"]], line: true },
  stock: { title: "Capacidad y stock · m³", data: logistica.plantas, key: "planta", series: [["capacidadM3", "Capacidad"], ["stockM3", "Stock"]] },
  importaciones: { title: "Importaciones · miles de m³", data: logistica.importaciones, key: "mes", series: [["fluvial", "Fluvial"], ["terrestre", "Terrestre"]] },
  mercado: { title: "Participación de mercado · %", data: mercado.participacion, key: "empresa", series: [["pct", "Participación"]] },
  precios: { title: "Precio de diésel · Gs/litro", data: mercado.precios, key: "mes", series: [["petroparDiesel", "Petropar"], ["mercadoDiesel", "Mercado"]], line: true },
};

export function AnalyticalChart({ id, forecastProduct = "total", adjustment = 0 }: { id: ChartId; forecastProduct?: ProductoLiquido | "total"; adjustment?: number }) {
  const c = id === "forecast" ? { ...config[id],
    title: `Proyección · ${forecastProduct === "total" ? "combustibles líquidos" : forecastProduct} · ML`,
    data: [...ventasLiquidas.map(v => ({ mes: v.mes, realizado: forecastProduct === "total" ? v.realizado : v[forecastProduct] })), ...proyectarVentas(forecastProduct, adjustment)],
    series: [["realizado", "Realizado"], ["base", "Base lineal"], ...(adjustment ? [["escenario", `Escenario ${adjustment}%`]] : [])] as [string, string][],
  } : config[id];
  const line = "line" in c && c.line;
  const children = <><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey={c.key} fontSize={10} tick={{ fill: "var(--muted-foreground)" }} /><YAxis width={55} fontSize={11} tick={{ fill: "var(--muted-foreground)" }} /><Tooltip contentStyle={{ background: "var(--card)", borderColor: "var(--border)", color: "var(--foreground)" }} /><Legend wrapperStyle={{ fontSize: 12 }} />{c.series.map(([key, name], i) => line ? <Line key={key} dataKey={key} name={name} stroke={`var(--chart-${i + 1})`} strokeWidth={2.5} dot={false} /> : <Bar key={key} dataKey={key} name={name} fill={`var(--chart-${i + 1})`} radius={[3, 3, 0, 0]} />)}</>;
  return <figure className="min-w-0" aria-label={c.title}><figcaption className="mb-4 text-sm font-semibold">{c.title}</figcaption><div className="h-72 w-full"><ResponsiveContainer>{line ? <LineChart data={c.data}>{children}</LineChart> : <BarChart data={c.data}>{children}</BarChart>}</ResponsiveContainer></div>{(id === "operadores" || id === "presupuesto") && <p className="mt-3 text-xs text-muted-foreground">{operadoresDetalle.map((o,i) => `${i + 1}: ${o.operador}`).join(" · ")}</p>}<p className="mt-2 text-xs text-muted-foreground">Datos de ejemplo · {id === "forecast" ? "Regresión lineal sin estacionalidad; no validada." : "Ene–Sep 2026"}</p></figure>;
}