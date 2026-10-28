import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Database, Layers, MessageSquareText, ShieldCheck } from "lucide-react";
import { Seccion, Tabla } from "@/components/comercial/comun";
import { Contenido, EncabezadoSolucion } from "@/components/soluciones/comun";

export const Route = createFileRoute("/soluciones/sap")({
  head: () => ({ meta: [{ title: "Consulta SAP · Hub Petropar" }] }),
  component: Page,
});

// Modelo ilustrativo: tablas estándar de SAP SD/MM/FI que una integración leería (solo lectura).
const tablas = [
  {
    id: "VBRK / VBRP",
    nombre: "Facturas de venta",
    modulo: "SD",
    uso: "Volumen facturado por producto, cliente, fecha y centro.",
    campos: [
      ["FKDAT", "Fecha de factura", "Período"],
      ["KUNAG", "Cliente solicitante", "Cliente / operador"],
      ["MATNR", "Material", "Producto (diésel, naftas, etanol, GLP)"],
      ["FKIMG", "Cantidad facturada", "Volumen (convertido a litros o kg)"],
      ["NETWR", "Valor neto", "Facturación"],
      ["WERKS", "Centro", "Planta / depósito de despacho"],
    ],
  },
  {
    id: "KNA1",
    nombre: "Maestro de clientes",
    modulo: "SD",
    uso: "Ubicación, tipo de cliente y canal (estación, mayorista, industrial, sector público).",
    campos: [
      ["KUNNR", "Número de cliente", "Cliente"],
      ["NAME1", "Razón social", "Nombre"],
      ["ORT01", "Ciudad", "Ciudad"],
      ["REGIO", "Región", "Departamento"],
      ["KTOKD", "Grupo de cuentas", "Tipo de operador"],
    ],
  },
  {
    id: "MARA / MARM",
    nombre: "Materiales y unidades",
    modulo: "MM",
    uso: "Catálogo de productos y factores de conversión (m³, litros, kg).",
    campos: [
      ["MATNR", "Material", "Producto"],
      ["MTART", "Tipo de material", "Combustible líquido / GLP / etanol"],
      ["MEINS", "Unidad base", "Unidad"],
      ["UMREZ/UMREN", "Factor de conversión", "Litros por unidad"],
    ],
  },
  {
    id: "MSEG / MARD",
    nombre: "Movimientos y stock",
    modulo: "MM",
    uso: "Stock por planta, entradas por importación y mermas.",
    campos: [
      ["BWART", "Clase de movimiento", "Entrada, salida, merma"],
      ["WERKS", "Centro", "Planta"],
      ["MENGE", "Cantidad", "Volumen movido"],
      ["LABST", "Stock libre", "Stock disponible"],
    ],
  },
  {
    id: "KNKK / BSID",
    nombre: "Crédito y cuentas por cobrar",
    modulo: "FI",
    uso: "Límite de crédito, saldo y antigüedad de deuda por cliente.",
    campos: [
      ["KLIMK", "Límite de crédito", "Crédito asignado"],
      ["SKFOR", "Saldo", "Deuda vigente"],
      ["ZFBDT", "Fecha base", "Antigüedad de la deuda"],
    ],
  },
];

const semantica = [
  [
    "Litros vendidos",
    "Σ FKIMG convertido a litros, materiales de combustible líquido, facturas no anuladas",
  ],
  ["GLP (kt)", "Σ FKIMG en kg / 1.000.000 para materiales GLP; nunca se suma con litros"],
  ["Cobertura de stock (días)", "Stock libre (MARD) / venta media diaria de los últimos 30 días"],
  ["Merma", "Movimientos de merma (BWART) / volumen recibido, por planta y producto"],
  [
    "Cumplimiento de meta",
    "Litros vendidos / meta comercial (fuente: planificación comercial, fuera de SAP)",
  ],
];

const preguntas = [
  "¿Qué clientes industriales crecieron más este año?",
  "¿Qué operador está por debajo de su meta?",
  "¿Cuántos días de stock tenemos y qué riesgo hay?",
  "¿Qué análisis no podemos realizar aún con estos datos?",
];

function Page() {
  const [sel, setSel] = useState(tablas[0]?.id ?? "");
  const tabla = tablas.find((t) => t.id === sel) ?? tablas[0];
  return (
    <main className="pb-10">
      <EncabezadoSolucion
        categoria="Conversación con datos"
        titulo="Consulta sobre SAP"
        desc="Cómo Arandu respondería sobre ventas, clientes, stock y crédito leyendo SAP con una capa semántica propia del negocio."
        requiere="SAP no está conectado: las tablas son el modelo propuesto y Arandu responde con datos ficticios. Requiere acceso autorizado de solo lectura y definiciones de negocio acordadas."
        pregunta="¿Qué análisis no podemos realizar aún con estos datos?"
      />
      <Contenido>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              icono: Database,
              t: "1. Conector de solo lectura",
              d: "OData o RFC hacia SD, MM y FI; extracción incremental y sin escritura.",
            },
            {
              icono: Layers,
              t: "2. Capa semántica",
              d: "Definiciones del negocio: litros, kt, cobertura, mermas y metas, con unidades explícitas.",
            },
            {
              icono: ShieldCheck,
              t: "3. Arandu con permisos",
              d: "Herramientas que consultan la capa semántica respetando roles; cada cifra trazable a su origen.",
            },
          ].map(({ icono: Icono, t, d }, i) => (
            <div key={t} className="relative rounded-xl border bg-card p-5 shadow-card">
              <Icono className="size-6 text-primary dark:text-sidebar-primary" />
              <p className="mt-3 font-semibold">{t}</p>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              {i < 2 && (
                <ArrowRight className="absolute -right-3 top-1/2 hidden size-5 -translate-y-1/2 text-muted-foreground md:block" />
              )}
            </div>
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-3">
          <Seccion titulo="Tablas propuestas">
            <div className="space-y-1">
              {tablas.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSel(t.id)}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${sel === t.id ? "bg-secondary font-semibold" : "hover:bg-muted"}`}
                >
                  <span className="font-mono text-xs text-muted-foreground">{t.modulo}</span> {t.id}
                  <span className="block text-xs font-normal text-muted-foreground">
                    {t.nombre}
                  </span>
                </button>
              ))}
            </div>
          </Seccion>
          {tabla && (
            <div className="xl:col-span-2">
              <Seccion titulo={`${tabla.id} · ${tabla.nombre}`}>
                <p className="mb-4 text-sm text-muted-foreground">{tabla.uso}</p>
                <Tabla
                  filas={tabla.campos}
                  clave={(c) => c[0] ?? ""}
                  columnas={[
                    { titulo: "Campo", valor: (c) => <code className="text-xs">{c[0]}</code> },
                    { titulo: "Descripción", valor: (c) => c[1] },
                    { titulo: "Concepto en el Hub", valor: (c) => c[2] },
                  ]}
                />
              </Seccion>
            </div>
          )}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <Seccion titulo="Capa semántica (definiciones de negocio)">
            <Tabla
              filas={semantica}
              clave={(s) => s[0] ?? ""}
              columnas={[
                { titulo: "Métrica", valor: (s) => <strong>{s[0]}</strong> },
                { titulo: "Definición propuesta", valor: (s) => s[1] },
              ]}
            />
          </Seccion>
          <Seccion titulo="Probalo con los datos de la demo">
            <div className="grid gap-2">
              {preguntas.map((q) => (
                <Link
                  key={q}
                  to="/chat"
                  search={{ q }}
                  className="flex items-center gap-2 rounded-lg border p-3 text-sm transition hover:border-accent hover:bg-muted"
                >
                  <MessageSquareText className="size-4 shrink-0 text-primary dark:text-sidebar-primary" />
                  {q}
                </Link>
              ))}
            </div>
          </Seccion>
        </div>
      </Contenido>
    </main>
  );
}
