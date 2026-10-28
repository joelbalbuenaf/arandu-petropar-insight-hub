# Hub Analítico Petropar · Arandu

Demo navegable de un hub de inteligencia comercial para Petropar (Petróleos Paraguayos):
reportes, mapas, cinco módulos de soluciones y **Arandu**, un agente que responde preguntas sobre
los datos con cifras, gráficos y próximos pasos.

> **Todos los datos son ficticios.** Se generan de forma determinística (siempre los mismos
> números) para mostrar el producto. SAP y las fuentes reales no están conectados.

## Qué incluye

| Área                             | Contenido                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Inicio                           | KPIs con variación interanual, centro de alertas, accesos a soluciones y reportes                                                    |
| Reportes Comerciales             | Resumen, territorio (mapa + drill-down a estaciones), operadores, metas, presupuesto, forecast con intervalo y backtest, estadística |
| Logística / Mercado / Operadores | Stock, importaciones y río; precios, participación y vacíos de cobertura; red por operador                                           |
| Soluciones                       | Red de estaciones, evaluador de sitios, radar de competencia, radar B2B, consulta SAP                                                |
| Arandu (`/chat`)                 | Agente con 11 herramientas sobre los datos; gráficos calculados por el servidor                                                      |
| Presentación (`/presentacion`)   | Propuesta ejecutiva de 6 diapositivas, exportable a PDF                                                                              |

Extras: filtros en la URL (links compartibles), paleta de comandos (**Ctrl + K**), modo oscuro,
exportación CSV y PDF.

## Requisitos

- Node 22 (con nvm: `nvm install 22 && nvm use 22`)
- npm (el `.npmrc` del repo activa `legacy-peer-deps`)

## Puesta en marcha

```sh
npm install
cp .env.example .env      # opcional: agregar ANTHROPIC_API_KEY
npm run dev               # http://localhost:8080
```

### Arandu: modo Claude o modo demo

- **Con `ANTHROPIC_API_KEY`** en `.env`: Arandu usa Claude (`claude-opus-5-5` por defecto) con
  herramientas, razonamiento visible y caché del prompt. Variables opcionales: `ARANDU_MODEL`,
  `ARANDU_EFFORT` (`low` · `medium` · `high` · `xhigh` · `max`).
- **Sin key**: modo demo. Interpreta la pregunta con reglas y responde con las mismas herramientas
  y datos, sin IA y sin costo. El chat muestra qué modo está activo.

En ambos modos los valores de los gráficos los calcula el servidor desde `src/lib/data/`: la IA
solo elige qué graficar.

## Scripts

| Comando                              | Qué hace                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------- |
| `npm run dev`                        | Servidor de desarrollo (puerto 8080)                                              |
| `npm run build`                      | Build de producción (nitro, preset `node-server`; otro preset con `NITRO_PRESET`) |
| `npm start`                          | Sirve el build (`PORT`, por defecto 3000)                                         |
| `npm test`                           | Tests (Vitest)                                                                    |
| `npm run lint` / `npm run typecheck` | ESLint + Prettier / TypeScript                                                    |

Con Docker: `docker build -t petropar-hub . && docker run -p 3000:3000 -e ANTHROPIC_API_KEY=... petropar-hub`.

## Arquitectura

```
src/lib/data/        Datos de demo y análisis: generador con semilla, motor de consulta,
                     forecast (estacionalidad + tendencia + backtest), alertas, geografía,
                     evaluador de sitios, correlación y z-score
src/lib/charts.ts    Catálogo de gráficos (lo usan dashboards y Arandu)
src/lib/arandu/      Agente: herramientas, prompt, Claude (tool runner), modo demo, stream a la UI
src/routes/          Páginas (TanStack Start, rutas por archivo) y /api/chat
src/components/      ChartView, HubMap (MapLibre), filtros, alertas, chat, pestañas
```

Reglas de datos: combustibles líquidos en millones de litros (ML); GLP en miles de toneladas
(kt), nunca sumado con líquidos; operadores como universo independiente de la serie por
departamento; metas solo para 2026; presupuesto = costos comerciales.

Mapas: MapLibre GL con teselas de OpenFreeMap (no requiere key).
