import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Kpi, PageHeader } from "@/components/AppShell";
import { Grafico } from "@/components/AnalyticalChart";
import { BotonCsv, Cumplimiento, Seccion, Tabla, Variacion } from "@/components/comercial/comun";
import { HubMap } from "@/components/map/HubMap";
import { estaciones, nombresOperadores, operadoresDetalle } from "@/lib/data";
import { fmtNumero } from "@/lib/export";

export const Route = createFileRoute("/operadores")({
  validateSearch: (s: Record<string, unknown>): { op?: string } =>
    typeof s["op"] === "string" && nombresOperadores.includes(s["op"]) ? { op: s["op"] } : {},
  head: () => ({
    meta: [
      { title: "Reporte Comercial por Operadores · Petropar" },
      {
        name: "description",
        content: "Volumen, metas, margen y red de estaciones por operador de Petropar.",
      },
      { property: "og:title", content: "Reporte Comercial por Operadores · Petropar" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Page,
});

function Page() {
  const { op } = Route.useSearch();
  const navigate = useNavigate();
  const elegir = (o?: string) =>
    void navigate({ to: ".", search: o ? { op: o } : {}, replace: true } as never);
  const total = operadoresDetalle.reduce((s, o) => s + o.litrosMl, 0);
  const meta = operadoresDetalle.reduce((s, o) => s + o.metaMl, 0);
  const sel = operadoresDetalle.find((o) => o.operador === op);
  const red = estaciones.filter((e) => e.operador === op).sort((a, b) => b.ventasMl - a.ventasMl);

  return (
    <main className="pb-10">
      <PageHeader
        eyebrow="Reportes"
        title="Comercial por Operadores"
        desc="Redes de estaciones, grandes clientes, mayoristas y sector público. Elegí un operador para ver su red."
      />
      <div className="space-y-6 px-6 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Volumen total operadores"
            value={`${fmtNumero(total, 0)} ML`}
            hint="Universo independiente de la serie por depto"
          />
          <Kpi
            label="Cumplimiento agregado"
            value={`${fmtNumero((total / meta) * 100)}%`}
            hint={`Meta ${fmtNumero(meta, 0)} ML`}
          />
          <Kpi
            label="Estaciones en red"
            value={fmtNumero(estaciones.length, 0)}
            hint="Propias + franquiciadas"
          />
          <Kpi
            label="Bajo meta"
            value={`${operadoresDetalle.filter((o) => o.cumplimientoPct < 100).length} de ${operadoresDetalle.length}`}
          />
        </div>
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-2">
            <Seccion titulo="Volumen vs. meta">
              <Grafico grafico="operadores" alto={320} />
            </Seccion>
          </div>
          <div className="xl:col-span-3">
            <Seccion
              titulo="Detalle por operador"
              acciones={<BotonCsv filas={operadoresDetalle} nombre="operadores" />}
            >
              <Tabla
                filas={operadoresDetalle}
                clave={(o) => o.operador}
                seleccionada={op}
                onFila={(o) => elegir(o.operador === op ? undefined : o.operador)}
                columnas={[
                  { titulo: "Operador", valor: (o) => o.operador },
                  { titulo: "Estaciones", valor: (o) => o.estaciones || "—", numero: true },
                  { titulo: "ML", valor: (o) => fmtNumero(o.litrosMl), numero: true },
                  {
                    titulo: "Crecimiento",
                    valor: (o) => <Variacion pct={o.crecimientoPct} />,
                    numero: true,
                  },
                  {
                    titulo: "Meta",
                    valor: (o) => <Cumplimiento pct={o.cumplimientoPct} />,
                    numero: true,
                  },
                  { titulo: "Margen", valor: (o) => `${fmtNumero(o.margenPct)}%`, numero: true },
                ]}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Clic en un operador con red para ver sus estaciones.
              </p>
            </Seccion>
          </div>
        </div>
        {sel && (
          <div className="grid gap-6 xl:grid-cols-2">
            <Seccion titulo={`Red de ${sel.operador} · ${red.length} estaciones`}>
              {red.length ? (
                <HubMap
                  alto={420}
                  encuadre={red.map((e) => ({ lat: e.lat, lng: e.lng }))}
                  capas={[
                    {
                      id: "red",
                      nombre: "Tamaño = ventas",
                      color: "var(--series-1)",
                      radio: [4, 12],
                      puntos: red.map((e) => ({
                        id: e.id,
                        lat: e.lat,
                        lng: e.lng,
                        titulo: e.nombre,
                        valor: e.ventasMl,
                        detalle: `${e.ciudad} (${e.depto})\n${fmtNumero(e.ventasMl, 2)} ML · aprovechamiento ${fmtNumero(e.aprovechamientoPct)}%`,
                      })),
                    },
                  ]}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {sel.operador} no opera estaciones: vende a clientes directos.
                </p>
              )}
            </Seccion>
            {red.length > 0 && (
              <Seccion
                titulo="Estaciones"
                acciones={
                  <BotonCsv
                    filas={red.map(({ mensual: _m, ...e }) => e)}
                    nombre={`red-${sel.operador}`}
                  />
                }
              >
                <Tabla
                  alto={420}
                  filas={red}
                  clave={(e) => e.id}
                  columnas={[
                    { titulo: "Estación", valor: (e) => e.nombre },
                    { titulo: "Depto", valor: (e) => e.depto },
                    { titulo: "ML", valor: (e) => fmtNumero(e.ventasMl, 2), numero: true },
                    {
                      titulo: "Aprov.",
                      valor: (e) => <Cumplimiento pct={e.aprovechamientoPct} />,
                      numero: true,
                    },
                  ]}
                />
              </Seccion>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
