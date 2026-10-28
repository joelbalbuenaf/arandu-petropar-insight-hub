import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Kpi } from "@/components/AppShell";
import { Grafico } from "@/components/AnalyticalChart";
import { BotonCsv, Seccion, Tabla } from "@/components/comercial/comun";
import { HubMap, type CapaMapa } from "@/components/map/HubMap";
import { Contenido, EncabezadoSolucion } from "@/components/soluciones/comun";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nombresDepartamentos, prospectos, sectores, type EstadoProspecto } from "@/lib/data";
import { fmtNumero } from "@/lib/export";

export const Route = createFileRoute("/soluciones/b2b")({
  head: () => ({ meta: [{ title: "Radar B2B · Hub Petropar" }] }),
  component: Page,
});

const TODOS = "__todos";
const estados: { id: EstadoProspecto; color: string }[] = [
  { id: "Prospecto", color: "var(--series-1)" },
  { id: "En negociación", color: "var(--series-2)" },
  { id: "Cliente actual", color: "var(--series-muted)" },
];

function Prioridad({ valor }: { valor: number }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full bg-[var(--series-1)]"
          style={{ width: `${valor}%` }}
        />
      </span>
      <span className="tabular-nums">{valor}</span>
    </span>
  );
}

function Page() {
  const [sector, setSector] = useState(TODOS);
  const [depto, setDepto] = useState(TODOS);
  const [estado, setEstado] = useState<string>("Prospecto");

  const lista = useMemo(
    () =>
      prospectos.filter(
        (p) =>
          (sector === TODOS || p.sector === sector) &&
          (depto === TODOS || p.depto === depto) &&
          (estado === TODOS || p.estado === estado),
      ),
    [sector, depto, estado],
  );
  const consumo = lista.reduce((s, p) => s + p.consumoM3Mes, 0);
  const capas: CapaMapa[] = estados.map((e) => ({
    id: e.id,
    nombre: e.id,
    color: e.color,
    radio: [4, 12],
    puntos: lista
      .filter((p) => p.estado === e.id)
      .map((p) => ({
        id: p.id,
        lat: p.lat,
        lng: p.lng,
        titulo: p.nombre,
        valor: p.consumoM3Mes,
        detalle: `${p.sector} · ${p.ciudad}\nFlota ${p.flota} · ${fmtNumero(p.consumoM3Mes, 0)} m³/mes\nPetropar más cercana: ${p.estacionCercana} (${fmtNumero(p.estacionCercanaKm)} km)\nPrioridad ${p.prioridad}/100`,
      })),
  }));
  const top = lista
    .slice(0, 3)
    .map((p) => p.nombre)
    .join(", ");

  return (
    <main className="pb-10">
      <EncabezadoSolucion
        categoria="Oportunidades comerciales"
        titulo="Radar de clientes B2B"
        desc="Transportistas, agroindustria, constructoras y cooperativas para convenios de flota o suministro directo."
        requiere="Las 120 empresas son inventadas. Para producción hace falta un directorio autorizado de empresas, sus ubicaciones y consumos."
        pregunta="¿Qué prospectos B2B priorizarías y por qué?"
      />
      <Contenido>
        <div className="flex flex-wrap gap-2 rounded-xl border bg-card p-2 shadow-card">
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="h-9 w-48" aria-label="Estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los estados</SelectItem>
              {estados.map((e) => (
                <SelectItem key={e.id} value={e.id}>
                  {e.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="h-9 w-56" aria-label="Sector">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los sectores</SelectItem>
              {sectores.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
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
          <Kpi label="Empresas" value={fmtNumero(lista.length, 0)} />
          <Kpi
            label="Consumo estimado"
            value={`${fmtNumero(consumo, 0)} m³/mes`}
            hint={`≈ ${fmtNumero((consumo * 12) / 1000, 1)} ML/año`}
          />
          <Kpi
            label="Prioridad media"
            value={fmtNumero(lista.reduce((s, p) => s + p.prioridad, 0) / (lista.length || 1), 0)}
            hint="0–100: consumo + cercanía + sector"
          />
          <Kpi
            label="A menos de 5 km de la red"
            value={fmtNumero(lista.filter((p) => p.estacionCercanaKm < 5).length, 0)}
            hint="Candidatos a convenio de flota"
          />
        </div>
        <div className="grid gap-6 xl:grid-cols-5">
          <div className="xl:col-span-3">
            <Seccion titulo="Mapa de prospectos">
              <HubMap
                capas={capas}
                alto={480}
                encuadre={depto !== TODOS ? lista.map((p) => ({ lat: p.lat, lng: p.lng })) : []}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Tamaño = consumo estimado; color = estado comercial.
              </p>
            </Seccion>
          </div>
          <div className="xl:col-span-2">
            <Seccion titulo="Consumo potencial por sector">
              <Grafico grafico="prospectos_sector" alto={420} />
            </Seccion>
          </div>
        </div>
        <Seccion
          titulo="Prospectos priorizados"
          acciones={
            <div className="flex gap-2">
              <Link
                to="/chat"
                search={{
                  q: `Prepara una propuesta de convenio de flota para ${top || "los prospectos B2B prioritarios"}.`,
                }}
                className="inline-flex items-center rounded-md border px-2.5 text-xs font-medium hover:bg-muted"
              >
                Propuesta con Arandu
              </Link>
              <BotonCsv
                filas={lista.map(({ lat: _a, lng: _b, ...p }) => p)}
                nombre="prospectos-b2b"
              />
            </div>
          }
        >
          <Tabla
            alto={460}
            filas={lista}
            clave={(p) => p.id}
            columnas={[
              { titulo: "Empresa", valor: (p) => p.nombre },
              { titulo: "Sector", valor: (p) => p.sector },
              { titulo: "Ciudad", valor: (p) => `${p.ciudad} (${p.depto})` },
              { titulo: "m³/mes", valor: (p) => fmtNumero(p.consumoM3Mes, 0), numero: true },
              {
                titulo: "Petropar más cercana",
                valor: (p) => `${p.estacionCercana} · ${fmtNumero(p.estacionCercanaKm)} km`,
              },
              { titulo: "Estado", valor: (p) => p.estado },
              {
                titulo: "Prioridad",
                valor: (p) => <Prioridad valor={p.prioridad} />,
                numero: true,
              },
            ]}
          />
        </Seccion>
      </Contenido>
    </main>
  );
}
