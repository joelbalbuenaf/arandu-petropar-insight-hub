## Convenciones del proyecto

- Node 22 (nvm). Instalar con `npm install` (el `.npmrc` del repo activa `legacy-peer-deps`).
- Datos de demo: una sola fuente en `src/lib/data/` (generador determinístico con semilla). Pantallas, gráficos y Arandu leen de ahí, así las cifras coinciden siempre. `src/lib/petropar-data.ts` es una fachada de compatibilidad.
- Arandu: `POST /api/chat`. Con `ANTHROPIC_API_KEY` usa Claude con herramientas (`src/lib/arandu/`); sin key responde en modo demo con las mismas herramientas, sin IA. Los hilos se guardan en localStorage.
- Gráficos: la IA solo elige qué graficar; los valores siempre los calcula el servidor desde `src/lib/data/`. Nunca graficar números generados por el modelo.
- Unidades: combustibles líquidos (diésel, naftas, etanol) en millones de litros (ML); GLP en miles de toneladas (kt) y nunca se suma con líquidos. Operadores son un universo independiente de la serie por departamento.
- Todo es demo con datos ficticios: distinguir siempre capacidades propuestas/demo de integraciones reales (SAP, estaciones, prospectos).
- La presentación ejecutiva vive en `/presentacion`, fuera de `AppShell`; un `ScaledSlide` de 1920×1080 sirve para lienzo, vista general e impresión.
- Mapas: MapLibre GL con teselas OpenFreeMap (sin key). Coordenadas ficticias aproximadas.
