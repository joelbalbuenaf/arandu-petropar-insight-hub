export const presentationSlides = [
  { title: "Decidir con datos, a tiempo", chapter: "Centro de Decisiones", notes: "La propuesta completa sigue las seis imágenes: información a tiempo, anticipar y atender. El Hub Analítico es una solución del primer paso, no toda la oferta. El gráfico usa datos ficticios del prototipo." },
  { title: "El dato debe llegar antes de la decisión", chapter: "El problema", notes: "La línea de tiempo es un escenario ilustrativo, no un diagnóstico verificado de Petropar. No afirmamos que un pedido tarda tres días: el piloto deberá medir el tiempo real y las idas y vueltas." },
  { title: "Tres pasos. Se avanza de a uno.", chapter: "La propuesta", notes: "Paso 1: pedidos completos, reportes reutilizables en el Hub y equipo capacitado. Paso 2: alertas, pronósticos y simulaciones. Paso 3 opcional: atención con información oficial. Acordar criterios de aceptación antes de ampliar." },
  { title: "Información a tiempo", chapter: "Paso 1 · Información a tiempo", notes: "El ejemplo de conversación muestra un flujo propuesto para aclarar pedidos; no es una función implementada. El Hub sí tiene un prototipo navegable con datos ficticios y Arandu. La captura muestra una solución concreta dentro del primer paso." },
  { title: "Anticipar para preparar la decisión", chapter: "Paso 2 · Anticipar", notes: "Capacidades propuestas sobre fuentes SAP y FUELFACS, sujetas a acceso y validación: cobertura y demanda, control de pérdidas, desempeño de red y simulaciones de compras o precios. No automatizar precios ni decisiones del directorio. El gráfico solo muestra ventas de ejemplo, no un pronóstico real." },
  { title: "Atender con información oficial", chapter: "Paso 3 · Atender · Opcional", notes: "El asistente de atención es una propuesta opcional, distinta de Arandu para análisis interno. Su implementación necesitará contenidos aprobados, reglas de derivación y un canal autorizado. La conversación es ilustrativa: no se ha buscado una estación ni derivado un pedido real." },
] as const;

export function normalizeSlide(value: unknown) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.max(1, Math.min(presentationSlides.length, parsed)) : 1;
}
