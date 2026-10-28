import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Kpi } from "@/components/AppShell";
import { Grafico } from "@/components/AnalyticalChart";
import { BotonCsv, Cumplimiento, Seccion, Tabla } from "@/components/comercial/comun";
import { HubMap, type CapaMapa } from "@/components/map/HubMap";
import { Contenido, EncabezadoSolucion } from "@/components/soluciones/comun";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  competenciaVsAprovechamiento,
  estaciones,
  nombresDepartamentos,
  type Estacion,
} from "@/lib/data";
import { fmtNumero } from "@/lib/export";

export const Route = createFileRoute("/soluciones/estaciones")({
  head: () => ({ meta: [{ title: "Red de estaciones · Hub Petropar" }] }),
  component: Page,
});

const TODOS = "__todos";
const operadoresRed = [
  "Emblemas Petropar Propias",
  "Red Franquiciada Norte",
  "Red Franquiciada Sur",
];
const grupos = [
  {
    id: "alto",
    nombre: "≥ 90% del potencial",
    color: "var(--success)",
    f: (e: Estacion) => e.aprovechamientoPct >= 90,
  },
  {
    id: "medio",
    nombre: "70–90%",
    color: "var(--warning)",
    f: (e: Estacion) => e.aprovechamientoPct >= 70 && e.aprovechamientoPct < 90,
  },
  {
    id: "bajo",
    nombre: "< 70%",
    color: "var(--destructive)",
    f: (e: Estacion) => e.aprovechamientoPct < 70,
  },
];

function Page() {
  const [operador, setOperador] = useState(TODOS);
  const [depto, setDepto] = useState(TODOS);
  const [orden, setOrden] = useState("potencial");
  const [sel, setSel] = useState<string | undefined>();

  const lista = useMemo(
    () =>
      estaciones.filter(
        (e) =>
          (operador === TODOS || e.operador === operador) && (depto === TODOS || e.depto === depto),
      ),
    [operador, depto],
  );
  const ordenada = [...lista].sort((a, b) =>
    orden === "ventas"
      ? b.ventasMl - a.ventasMl
      : orden === "aprovechamiento"
        ? a.aprovechamientoPct - b.aprovechamientoPct
        : b.potencialMl - b.ventasMl - (a.potencialMl - a.ventasMl),
  );
  const ventas = lista.reduce((s, e) => s + e.ventasMl, 0);
  const potencial = lista.reduce((s, e) => s + e.potencialMl, 0);
  const c = competenciaVsAprovechamiento();

  const capas: CapaMapa[] = grupos.map((g) => ({
    id: g.id,
    nombre: g.nombre,
    color: g.color,
    radio: [4, 13],
    puntos: lista.filter(g.f).map((e) => ({
      id: e.id,
      lat: e.lat,
      lng: e.lng,
      titulo: e.nombre,
      valor: e.ventasMl,
      detalle: `${e.operador} · ${e.formato}${e.tienda ? " · con tienda" : ""}\n${fmtNumero(e.ventasMl, 2)} ML de ${fmtNumero(e.potencialMl, 2)} ML potenciales (${fmtNumero(e.aprovechamientoPct)}%)\n${e.competidores3km} competidores a 3 km`,
    })),
  }));
  const seleccionada = estaciones.find((e) => e.id === sel);

  return (
    <main className="pb-10">
      <EncabezadoSolucion
        categoria="Desempeño de la red"
        titulo="Red de estaciones"
        desc="Volumen real vs. potencial de la zona para las 158 estaciones propias y franquiciadas."
        requiere="Para producción hacen falta la ubicación real de cada estación, sus ventas y un modelo de demanda del entorno."
        pregunta="¿Qué estaciones están más lejos de su potencial y por qué?"
      />
      <Contenido>
        <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2 shadow-card">
          <Select value={operador} onValueChange={setOperador}>
            <SelectTrigger className="h-9 w-64" aria-label="Operador">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los operadores</SelectItem>
              {operadoresRed.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={depto} onValueChange={setDepto}>
            <SelectTrigger className="h-9 w-52" aria-label="Departamento">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todo el país</SelectItem>
              {nombresDepartamentos.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi
            label="Estaciones"
            value={fmtNumero(lista.length, 0)}
            hint={`${lista.filter((e) => e.aprovechamientoPct < 70).length} bajo el 70% de su potencial`}
          />
          <Kpi label="Ventas Ene–Sep 2026" value={`${fmtNumero(ventas)} ML`} />
          <Kpi
            label="Potencial estimado"
            value={`${fmtNumero(potencial)} ML`}
            hint={`${fmtNumero(potencial - ventas)} ML sin capturar`}
          />
          <Kpi
            label="Aprovechamiento"
            value={`${fmtNumero(potencial ? (ventas / potencial) * 100 : 0)}%`}
            hint={`r competencia = ${fmtNumero(c.r, 2)}`}
          />
        </div>
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <Seccion titulo="Mapa de desempeño">
              <HubMap
                capas={capas}
                alto={500}
                onClickPunto={(_, id) => setSel(id)}
                encuadre={
                  depto !== TODOS || operador !== TODOS
                    ? lista.map((e) => ({ lat: e.lat, lng: e.lng }))
                    : []
                }
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Tamaño = ventas; color = aprovechamiento del potencial de la zona.
              </p>
            </Seccion>
          </div>
          <div className="space-y-6 xl:col-span-2">
            {seleccionada && (
              <Seccion titulo={seleccionada.nombre}>
                <p className="text-sm text-muted-foreground">
                  {seleccionada.operador} · {seleccionada.ciudad} ({seleccionada.depto}) ·{" "}
                  {seleccionada.formato}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Ventas</p>
                    <p className="font-semibold">{fmtNumero(seleccionada.ventasMl, 2)} ML</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Potencial</p>
                    <p className="font-semibold">{fmtNumero(seleccionada.potencialMl, 2)} ML</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Aprovechamiento</p>
                    <Cumplimiento pct={seleccionada.aprovechamientoPct} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Competidores a 3 km</p>
                    <p className="font-semibold">{seleccionada.competidores3km}</p>
                  </div>
                </div>
                <Link
                  to="/chat"
                  search={{
                    q: `¿Qué harías para mejorar la estación ${seleccionada.nombre} (${seleccionada.ciudad})?`,
                  }}
                  className="mt-3 inline-block text-xs font-semibold text-primary dark:text-sidebar-primary"
                >
                  Preguntar a Arandu por esta estación →
                </Link>
              </Seccion>
            )}
            <Seccion titulo="Competencia vs. aprovechamiento">
              <Grafico grafico="estaciones_competencia" alto={seleccionada ? 220 : 380} />
            </Seccion>
          </div>
        </div>
        <Seccion
          titulo="Ranking de estaciones"
          acciones={
            <div className="flex gap-2">
              <Select value={orden} onValueChange={setOrden}>
                <SelectTrigger className="h-8 w-56" aria-label="Orden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="potencial">Mayor potencial sin capturar</SelectItem>
                  <SelectItem value="aprovechamiento">Menor aprovechamiento</SelectItem>
                  <SelectItem value="ventas">Mayores ventas</SelectItem>
                </SelectContent>
              </Select>
              <BotonCsv filas={ordenada.map(({ mensual: _m, ...e }) => e)} nombre="estaciones" />
            </div>
          }
        >
          <Tabla
            alto={420}
            filas={ordenada}
            clave={(e) => e.id}
            seleccionada={sel}
            onFila={(e) => setSel(e.id)}
            columnas={[
              { titulo: "Estación", valor: (e) => e.nombre },
              { titulo: "Operador", valor: (e) => e.operador.replace("Emblemas Petropar ", "") },
              { titulo: "Depto", valor: (e) => e.depto },
              { titulo: "Ventas ML", valor: (e) => fmtNumero(e.ventasMl, 2), numero: true },
              {
                titulo: "Sin capturar",
                valor: (e) => fmtNumero(e.potencialMl - e.ventasMl, 2),
                numero: true,
              },
              {
                titulo: "Aprov.",
                valor: (e) => <Cumplimiento pct={e.aprovechamientoPct} />,
                numero: true,
              },
              { titulo: "Comp. 3 km", valor: (e) => e.competidores3km, numero: true },
            ]}
          />
        </Seccion>
      </Contenido>
    </main>
  );
}
