import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { MessageSquareText } from "lucide-react";
import { Kpi } from "@/components/AppShell";
import { Grafico } from "@/components/AnalyticalChart";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  competenciaVsAprovechamiento,
  kpisComerciales,
  mesesAtipicos,
  nombreForecast,
  operadoresDetalle,
  proyectar,
  resumen,
  seriePorPeriodo,
  type FiltrosVentas,
  type ProductoForecast,
} from "@/lib/data";
import { fmtNumero } from "@/lib/export";
import { oportunidades } from "@/lib/petropar-data";
import { BotonCsv, Cumplimiento, Seccion, Tabla, Variacion } from "./comun";

export function Resumen({ filtros }: { filtros: FiltrosVentas }) {
  const r = resumen(filtros);
  const serie = seriePorPeriodo(filtros).map((m) => m.valor);
  const liquidos = filtros.producto === "liquidos";
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Volumen del período"
          value={`${fmtNumero(r.actual)} ${r.unidad}`}
          delta={r.variacionInteranualPct}
          serie={serie}
          {...(r.variacionAnteriorPct !== null
            ? {
                hint: `${r.variacionAnteriorPct > 0 ? "+" : ""}${fmtNumero(r.variacionAnteriorPct)}% vs. período anterior`,
              }
            : {})}
        />
        <Kpi
          label="Cumplimiento de meta"
          value={r.cumplimientoPct === null ? "—" : `${fmtNumero(r.cumplimientoPct)}%`}
          hint={
            r.meta === null
              ? "Metas solo para líquidos 2026"
              : `Meta ${fmtNumero(r.meta)} ML · brecha ${fmtNumero(r.actual - r.meta)} ML`
          }
        />
        <Kpi
          label="Facturación comercial"
          value={`USD ${fmtNumero(kpisComerciales.facturacionMMUSD, 0)} M`}
          hint="Ene–Sep 2026"
        />
        <Kpi
          label="Margen bruto"
          value={`${fmtNumero(kpisComerciales.margenBrutoPct)}%`}
          hint="Ene–Sep 2026"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Seccion titulo="Evolución de ventas">
          {liquidos ? (
            <Grafico
              grafico="ventas_por_producto"
              depto={filtros.depto}
              desde={filtros.desde}
              hasta={filtros.hasta}
            />
          ) : (
            <Grafico
              grafico="ventas_mensuales"
              producto={filtros.producto}
              depto={filtros.depto}
              desde={filtros.desde}
              hasta={filtros.hasta}
            />
          )}
        </Seccion>
        <Seccion titulo="Cumplimiento comercial">
          <Grafico grafico="metas_vs_realizado" depto={filtros.depto} />
        </Seccion>
        <Seccion titulo="GLP · unidad independiente">
          <Grafico
            grafico="glp_mensual"
            depto={filtros.depto}
            desde="2025-01"
            hasta={filtros.hasta}
          />
        </Seccion>
        <Seccion titulo="Mix de líquidos">
          <Grafico
            grafico="mix_productos"
            depto={filtros.depto}
            desde={filtros.desde}
            hasta={filtros.hasta}
          />
        </Seccion>
      </div>
      <Seccion titulo="Oportunidades priorizadas">
        <div className="grid gap-4 md:grid-cols-2">
          {oportunidades.map((o) => (
            <div key={o.titulo} className="rounded-lg border-l-4 border-accent bg-muted/40 p-4">
              <p className="font-semibold">
                {o.titulo}
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  Prioridad {o.prioridad.toLowerCase()}
                </span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{o.evidencia}</p>
              <p className="mt-2 text-sm">{o.accion}</p>
              <Link
                to="/chat"
                search={{ q: o.pregunta }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary dark:text-sidebar-primary"
              >
                <MessageSquareText className="size-3.5" /> Analizar con Arandu
              </Link>
            </div>
          ))}
        </div>
      </Seccion>
    </div>
  );
}

export function Operadores() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [orden, setOrden] = useState("volumen");
  const filas = operadoresDetalle
    .filter(
      (o) =>
        o.operador.toLowerCase().includes(busqueda.toLowerCase()) &&
        (estado === "Todos" ||
          (estado === "Bajo meta" ? o.cumplimientoPct < 100 : o.cumplimientoPct >= 100)),
    )
    .sort((a, b) =>
      orden === "cumplimiento"
        ? a.cumplimientoPct - b.cumplimientoPct
        : orden === "margen"
          ? b.margenPct - a.margenPct
          : b.litrosMl - a.litrosMl,
    );
  return (
    <div className="space-y-6">
      <Seccion titulo="Volumen vs. meta por operador">
        <Grafico grafico="operadores" />
      </Seccion>
      <Seccion
        titulo="Detalle comercial por operador"
        acciones={<BotonCsv filas={filas} nombre="operadores" />}
      >
        <div className="mb-4 flex flex-wrap gap-2">
          <Input
            className="w-full sm:w-64"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar operador…"
            aria-label="Buscar operador"
          />
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="w-44" aria-label="Cumplimiento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["Todos", "Bajo meta", "En meta"].map((x) => (
                <SelectItem key={x} value={x}>
                  {x}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={orden} onValueChange={setOrden}>
            <SelectTrigger className="w-48" aria-label="Orden">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="volumen">Mayor volumen</SelectItem>
              <SelectItem value="cumplimiento">Menor cumplimiento</SelectItem>
              <SelectItem value="margen">Mayor margen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Tabla
          filas={filas}
          clave={(o) => o.operador}
          columnas={[
            { titulo: "Operador", valor: (o) => o.operador },
            { titulo: "Volumen ML", valor: (o) => fmtNumero(o.litrosMl), numero: true },
            { titulo: "Meta ML", valor: (o) => fmtNumero(o.metaMl), numero: true },
            { titulo: "Brecha ML", valor: (o) => fmtNumero(o.brechaMl), numero: true },
            {
              titulo: "Cumplimiento",
              valor: (o) => <Cumplimiento pct={o.cumplimientoPct} />,
              numero: true,
            },
            {
              titulo: "Crecimiento",
              valor: (o) => <Variacion pct={o.crecimientoPct} />,
              numero: true,
            },
            { titulo: "Margen", valor: (o) => `${fmtNumero(o.margenPct)}%`, numero: true },
          ]}
        />
      </Seccion>
    </div>
  );
}

export function Metas({ filtros }: { filtros: FiltrosVentas }) {
  const meses = seriePorPeriodo({
    ...filtros,
    producto: "liquidos",
    desde: "2026-01",
    hasta: "2026-09",
  });
  return (
    <div className="space-y-6">
      <Seccion titulo={`Metas mensuales · líquidos${filtros.depto ? ` · ${filtros.depto}` : ""}`}>
        <Grafico grafico="metas_vs_realizado" depto={filtros.depto} />
      </Seccion>
      <Seccion
        titulo="Detalle mensual"
        acciones={<BotonCsv filas={meses} nombre="metas-mensuales" />}
      >
        <Tabla
          filas={meses}
          clave={(m) => m.periodo}
          columnas={[
            { titulo: "Mes", valor: (m) => m.etiqueta },
            { titulo: "Realizado ML", valor: (m) => fmtNumero(m.valor), numero: true },
            { titulo: "Meta ML", valor: (m) => fmtNumero(m.meta), numero: true },
            { titulo: "Brecha", valor: (m) => fmtNumero(m.valor - (m.meta ?? 0)), numero: true },
            {
              titulo: "Cumplimiento",
              valor: (m) => <Cumplimiento pct={m.meta ? (m.valor / m.meta) * 100 : null} />,
              numero: true,
            },
            { titulo: "Año anterior", valor: (m) => fmtNumero(m.anioAnterior), numero: true },
          ]}
        />
      </Seccion>
    </div>
  );
}

export function Presupuesto() {
  const total = operadoresDetalle.reduce((s, o) => s + o.presupuestoMUSD, 0);
  const ejecutado = operadoresDetalle.reduce((s, o) => s + o.ejecutadoMUSD, 0);
  const filas = operadoresDetalle.map((o) => ({
    ...o,
    desvio: o.ejecutadoMUSD - o.presupuestoMUSD,
    desvioPct: ((o.ejecutadoMUSD - o.presupuestoMUSD) / o.presupuestoMUSD) * 100,
  }));
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Presupuesto comercial"
          value={`USD ${fmtNumero(total, 0)} M`}
          hint="Costos comerciales, no ingresos"
        />
        <Kpi label="Ejecutado" value={`USD ${fmtNumero(ejecutado, 0)} M`} />
        <Kpi
          label="Desvío neto"
          value={`USD ${fmtNumero(ejecutado - total, 0)} M`}
          delta={((ejecutado - total) / total) * 100}
          deltaLabel="vs. presupuesto"
          invertir
        />
      </div>
      <Seccion titulo="Ejecución presupuestaria">
        <Grafico grafico="presupuesto" />
      </Seccion>
      <Seccion
        titulo="Desvíos por operador"
        acciones={<BotonCsv filas={filas} nombre="presupuesto" />}
      >
        <Tabla
          filas={filas.sort((a, b) => b.desvioPct - a.desvioPct)}
          clave={(o) => o.operador}
          columnas={[
            { titulo: "Operador", valor: (o) => o.operador },
            { titulo: "Presupuesto", valor: (o) => `USD ${o.presupuestoMUSD} M`, numero: true },
            { titulo: "Ejecutado", valor: (o) => `USD ${o.ejecutadoMUSD} M`, numero: true },
            { titulo: "Desvío", valor: (o) => <Variacion pct={-o.desvioPct} />, numero: true },
            {
              titulo: "Cumplimiento meta",
              valor: (o) => <Cumplimiento pct={o.cumplimientoPct} />,
              numero: true,
            },
          ]}
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Desvío en verde = gasto por debajo del presupuesto.
        </p>
      </Seccion>
    </div>
  );
}

export function Forecast() {
  const [producto, setProducto] = useState<ProductoForecast>("total");
  const [ajuste, setAjuste] = useState(0);
  const p = useMemo(() => proyectar(producto, ajuste), [producto, ajuste]);
  return (
    <div className="space-y-6">
      <Seccion titulo="Escenarios de demanda · octubre–diciembre 2026">
        <div className="mb-6 flex flex-wrap items-center gap-6">
          <Select value={producto} onValueChange={(v) => setProducto(v as ProductoForecast)}>
            <SelectTrigger className="w-60" aria-label="Producto del forecast">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(nombreForecast) as ProductoForecast[]).map((k) => (
                <SelectItem key={k} value={k}>
                  {nombreForecast[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex min-w-64 flex-1 items-center gap-4">
            <span className="text-sm text-muted-foreground">Escenario</span>
            <Slider
              value={[ajuste]}
              min={-20}
              max={20}
              step={1}
              onValueChange={(v) => setAjuste(v[0] ?? 0)}
              aria-label="Ajuste del escenario"
              className="max-w-xs"
            />
            <span className="w-14 text-sm font-semibold tabular-nums">
              {ajuste > 0 ? "+" : ""}
              {ajuste}%
            </span>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Kpi label="Base Oct–Dic" value={`${fmtNumero(p.totalBase)} ${p.unidad}`} />
          <Kpi
            label="Escenario"
            value={`${fmtNumero(p.totalEscenario)} ${p.unidad}`}
            hint={ajuste ? `${ajuste > 0 ? "+" : ""}${ajuste}% sobre la base` : "Igual a la base"}
          />
          <Kpi
            label="Error del backtest (MAPE)"
            value={`${fmtNumero(p.mapePct)}%`}
            hint="Jul–Sep 2026 pronosticado con datos hasta junio"
          />
        </div>
        <div className="mt-6">
          <Grafico grafico="forecast" producto={producto} ajuste_pct={ajuste} alto={320} />
        </div>
      </Seccion>
      <div className="grid gap-6 xl:grid-cols-2">
        <Seccion
          titulo="Proyección con intervalo del 80%"
          acciones={<BotonCsv filas={p.meses} nombre="forecast" />}
        >
          <Tabla
            filas={p.meses}
            clave={(m) => m.periodo}
            columnas={[
              { titulo: "Mes", valor: (m) => m.etiqueta },
              { titulo: "Base", valor: (m) => fmtNumero(m.base), numero: true },
              { titulo: "Mínimo", valor: (m) => fmtNumero(m.minimo), numero: true },
              { titulo: "Máximo", valor: (m) => fmtNumero(m.maximo), numero: true },
              { titulo: "Escenario", valor: (m) => fmtNumero(m.escenario), numero: true },
            ]}
          />
        </Seccion>
        <Seccion titulo="Backtest: pronóstico vs. real">
          <Tabla
            filas={p.backtest}
            clave={(b) => b.periodo}
            columnas={[
              { titulo: "Mes", valor: (b) => b.mes },
              { titulo: "Real", valor: (b) => fmtNumero(b.real), numero: true },
              { titulo: "Pronóstico", valor: (b) => fmtNumero(b.pronostico), numero: true },
              { titulo: "Error", valor: (b) => `${fmtNumero(b.errorPct)}%`, numero: true },
            ]}
          />
        </Seccion>
      </div>
      <p className="rounded-lg border border-dashed p-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Método.</strong> {p.metodo}
      </p>
    </div>
  );
}

export function Estadistica() {
  const c = competenciaVsAprovechamiento();
  const atipicos = mesesAtipicos();
  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Seccion titulo="¿La competencia explica el aprovechamiento de las estaciones?">
            <Grafico grafico="estaciones_competencia" alto={320} />
          </Seccion>
        </div>
        <div className="space-y-4 xl:col-span-2">
          <Kpi
            label="Correlación de Pearson (r)"
            value={fmtNumero(c.r, 2)}
            hint={`n = ${c.n} estaciones`}
          />
          <Kpi
            label="R² (varianza explicada)"
            value={`${fmtNumero(c.r2 * 100, 0)}%`}
            hint={`Pendiente: ${fmtNumero(c.pendiente, 2)} puntos por competidor`}
          />
          <p className="rounded-lg border bg-card p-4 text-sm leading-relaxed">{c.lectura}</p>
        </div>
      </div>
      <Seccion
        titulo="Meses atípicos por departamento (z-score de la variación interanual)"
        acciones={<BotonCsv filas={atipicos} nombre="meses-atipicos" />}
      >
        {atipicos.length ? (
          <Tabla
            filas={atipicos}
            clave={(a) => `${a.depto}-${a.periodo}`}
            columnas={[
              { titulo: "Departamento", valor: (a) => a.depto },
              { titulo: "Mes", valor: (a) => a.etiqueta },
              {
                titulo: "Var. interanual",
                valor: (a) => <Variacion pct={a.variacionPct} />,
                numero: true,
              },
              { titulo: "z", valor: (a) => fmtNumero(a.z, 2), numero: true },
              {
                titulo: "",
                valor: (a) => (
                  <Link
                    to="/chat"
                    search={{ q: `¿Qué pasó con las ventas de ${a.depto} en ${a.etiqueta}?` }}
                    className="text-xs font-semibold text-primary dark:text-sidebar-primary"
                  >
                    Preguntar
                  </Link>
                ),
              },
            ]}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No hay meses fuera de lo habitual con el umbral actual (|z| ≥ 1,8).
          </p>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Un mes es atípico si su variación interanual se aleja más de 1,8 desvíos estándar del
          promedio del departamento en 2026.
        </p>
      </Seccion>
    </div>
  );
}
