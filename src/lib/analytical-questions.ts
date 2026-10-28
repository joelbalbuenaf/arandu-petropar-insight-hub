export const categoriasPreguntas = {
  Ventas: ["Grafica la evolución mensual de diésel, naftas y etanol.", "¿Cuál fue el mes con mayor venta de diésel?", "¿Qué producto creció más entre enero y septiembre?", "¿Qué meses muestran caídas de ventas?", "Analiza el mix de combustibles líquidos.", "Grafica el GLP por separado y explica su evolución."],
  Territorio: ["Compara ventas y metas de los departamentos disponibles.", "¿Qué departamento concentra más volumen?", "¿Dónde hay mayor brecha contra la meta?", "¿Qué regiones priorizarías para crecer?", "¿Qué datos faltan para analizar ventas por estación?"],
  Operadores: ["¿Qué operador está por debajo de su meta?", "Ordena operadores por volumen y crecimiento.", "Analiza la brecha de Distribuidores Mayoristas y propone acciones con su impacto en ML.", "¿Qué operadores tienen el mejor margen?", "Compara productividad por estación solo en redes con estaciones.", "¿Qué oportunidades muestran los clientes industriales? Contrasta crecimiento, margen y meta."],
  "Metas y presupuesto": ["Grafica metas vs. realizado de combustibles líquidos por mes.", "¿Cuál es la brecha acumulada contra la meta?", "¿Cuánto falta a cada operador para llegar al 100%?", "Compara presupuesto y ejecución por operador y prioriza los desvíos.", "¿Qué operadores gastan por encima de su presupuesto?", "Relaciona cumplimiento, margen y ejecución presupuestaria."],
  Forecast: ["Proyecta las ventas de combustibles líquidos para octubre a diciembre y explica las limitaciones.", "¿Cuál es la proyección de diésel para el cierre del año?", "Simula un escenario de demanda 10% mayor para el cuarto trimestre.", "Compara escenarios de demanda de -10%, base y +10%.", "¿Qué datos necesitamos para validar el forecast?"],
  "Logística y mercado": ["¿Cuántos días de stock tenemos y qué riesgo hay?", "Grafica capacidad y stock por planta.", "Compara importaciones fluviales y terrestres.", "¿Qué riesgos plantea el nivel del río?", "Compara nuestro precio de diésel con el mercado", "Grafica la participación de mercado.", "¿Cómo cambió Brent entre julio y septiembre?"],
  Oportunidades: ["Prepara un resumen ejecutivo con tres oportunidades, evidencia y próximos pasos.", "¿Qué alertas comerciales atenderías primero?", "¿Qué hipótesis explicarían la caída del canal mayorista? No las presentes como hechos.", "Propón indicadores para monitorear el plan comercial.", "¿Qué análisis no podemos realizar aún con estos datos?"],
};
export type ChartId = "ventas" | "glp" | "territorio" | "operadores" | "metas" | "presupuesto" | "forecast" | "stock" | "importaciones" | "mercado" | "precios";
export const chartIds: ChartId[] = ["ventas", "glp", "territorio", "operadores", "metas", "presupuesto", "forecast", "stock", "importaciones", "mercado", "precios"];
export function parseAnalyticalResponse(text: string) {
  const charts: ChartId[] = [];
  const clean = text.replace(/\[\[grafico:([a-z]+)\]\]/g, (_, id: string) => {
    if (chartIds.includes(id as ChartId) && !charts.includes(id as ChartId)) charts.push(id as ChartId);
    return "";
  });
  return { text: clean, charts: charts.slice(0, 3) };
}