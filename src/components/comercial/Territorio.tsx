import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Grafico } from "@/components/AnalyticalChart";
import { HubMap, type CapaMapa } from "@/components/map/HubMap";
import {
  departamentos,
  estaciones,
  etiquetaRango,
  porDepartamento,
  type FiltrosVentas,
} from "@/lib/data";
import { fmtNumero } from "@/lib/export";
import { BotonCsv, Cumplimiento, Seccion, Tabla, Variacion } from "./comun";

const capital = Object.fromEntries(departamentos.map((d) => [d.nombre, d.ciudades[0]]));

export function Territorio({ filtros }: { filtros: FiltrosVentas }) {
  const navigate = useNavigate();
  const elegir = (depto?: string) =>
    void navigate({
      to: ".",
      search: (prev: Record<string, unknown>) => ({ ...prev, depto }),
      replace: true,
    } as never);

  const filas = useMemo(() => porDepartamento({ ...filtros, depto: undefined }), [filtros]);
  const unidad = filtros.producto === "glp" ? "kt" : "ML";

  const capas: CapaMapa[] = useMemo(() => {
    const grupos = [
      {
        id: "ok",
        nombre: "≥ 100% de la meta",
        color: "var(--success)",
        f: (p: number) => p >= 100,
      },
      {
        id: "cerca",
        nombre: "95–100%",
        color: "var(--warning)",
        f: (p: number) => p >= 95 && p < 100,
      },
      { id: "bajo", nombre: "< 95%", color: "var(--destructive)", f: (p: number) => p < 95 },
    ];
    const sinMeta = filas.every((f) => f.cumplimientoPct === null);
    const punto = (d: (typeof filas)[number]) => ({
      id: d.depto,
      lat: capital[d.depto]?.lat ?? 0,
      lng: capital[d.depto]?.lng ?? 0,
      titulo: d.depto,
      valor: d.valor,
      detalle: `${fmtNumero(d.valor)} ${unidad} · ${fmtNumero(d.participacionPct)}% del total${d.cumplimientoPct !== null ? `\nMeta: ${fmtNumero(d.meta)} ML · cumplimiento ${fmtNumero(d.cumplimientoPct)}%` : ""}${d.variacionInteranualPct !== null ? `\nInteranual: ${d.variacionInteranualPct > 0 ? "+" : ""}${fmtNumero(d.variacionInteranualPct)}%` : ""}`,
    });
    if (sinMeta)
      return [
        {
          id: "volumen",
          nombre: `Volumen (${unidad})`,
          color: "var(--series-1)",
          radio: [6, 28],
          puntos: filas.map(punto),
        },
      ];
    return grupos.map((g) => ({
      id: g.id,
      nombre: g.nombre,
      color: g.color,
      radio: [6, 28] as [number, number],
      puntos: filas.filter((f) => f.cumplimientoPct !== null && g.f(f.cumplimientoPct)).map(punto),
    }));
  }, [filas, unidad]);

  const red = estaciones
    .filter((e) => e.depto === filtros.depto)
    .sort((a, b) => b.ventasMl - a.ventasMl);
  const capasConRed: CapaMapa[] = red.length
    ? [
        ...capas,
        {
          id: "red",
          nombre: "Estaciones Petropar",
          color: "var(--series-1)",
          radio: [4, 9],
          puntos: red.map((e) => ({
            id: e.id,
            lat: e.lat,
            lng: e.lng,
            titulo: e.nombre,
            valor: e.ventasMl,
            detalle: `${e.operador}\n${fmtNumero(e.ventasMl, 2)} ML · potencial ${fmtNumero(e.potencialMl, 2)} ML\nAprovechamiento ${fmtNumero(e.aprovechamientoPct)}% · ${e.competidores3km} competidores a 3 km`,
          })),
        },
      ]
    : capas;
  const sel = filtros.depto;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Seccion titulo={`Mapa de ventas · ${etiquetaRango(filtros.desde, filtros.hasta)}`}>
            <HubMap
              capas={capasConRed}
              alto={470}
              onClickPunto={(capa, id) => capa !== "red" && elegir(id)}
              encuadre={
                sel
                  ? estaciones
                      .filter((e) => e.depto === sel)
                      .map((e) => ({ lat: e.lat, lng: e.lng }))
                  : []
              }
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Tamaño = volumen; color = cumplimiento de meta (líquidos 2026). Clic en un
              departamento para ver su red. Ubicaciones aproximadas en la capital departamental.
            </p>
          </Seccion>
        </div>
        <div className="xl:col-span-2">
          <Seccion
            titulo="Departamentos"
            acciones={<BotonCsv filas={filas} nombre="ventas-por-departamento" />}
          >
            <Tabla
              alto={470}
              filas={filas}
              clave={(f) => f.depto}
              seleccionada={sel}
              onFila={(f) => elegir(f.depto === sel ? undefined : f.depto)}
              columnas={[
                { titulo: "Departamento", valor: (f) => f.depto },
                { titulo: unidad, valor: (f) => fmtNumero(f.valor), numero: true },
                {
                  titulo: "Meta",
                  valor: (f) => <Cumplimiento pct={f.cumplimientoPct} />,
                  numero: true,
                },
                {
                  titulo: "Interanual",
                  valor: (f) => <Variacion pct={f.variacionInteranualPct} />,
                  numero: true,
                },
              ]}
            />
          </Seccion>
        </div>
      </div>
      {sel && (
        <div className="grid gap-6 xl:grid-cols-2">
          <Seccion titulo={`Evolución mensual · ${sel}`}>
            <Grafico
              grafico="ventas_mensuales"
              producto={filtros.producto}
              depto={sel}
              desde="2025-01"
              hasta={filtros.hasta}
            />
          </Seccion>
          <Seccion
            titulo={`Red Petropar en ${sel} · ${red.length} estaciones`}
            acciones={
              <BotonCsv
                filas={red.map(({ mensual: _m, ...e }) => e)}
                nombre={`estaciones-${sel}`}
              />
            }
          >
            {red.length ? (
              <Tabla
                alto={330}
                filas={red}
                clave={(e) => e.id}
                columnas={[
                  { titulo: "Estación", valor: (e) => e.nombre },
                  { titulo: "Ventas ML", valor: (e) => fmtNumero(e.ventasMl, 2), numero: true },
                  { titulo: "Potencial", valor: (e) => fmtNumero(e.potencialMl, 2), numero: true },
                  {
                    titulo: "Aprov.",
                    valor: (e) => <Cumplimiento pct={e.aprovechamientoPct} />,
                    numero: true,
                  },
                ]}
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin estaciones de la red en este departamento.
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Las estaciones son un universo por operador (Ene–Sep 2026), independiente de la serie
              departamental.
            </p>
          </Seccion>
        </div>
      )}
    </div>
  );
}
