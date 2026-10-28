# Presentación Petropar

- [x] Reorientar seis diapositivas según las imágenes: información a tiempo, anticipar y atender; el Hub como una solución.
- [x] Añadir navegación, vista general, presentación y exportación por impresión.
- [x] Verificar contenido, navegación y legibilidad de la propuesta revisada.

# Hub independiente de Lovable

- [x] Fase 0: config propia de Vite + nitro (node-server), Node 22, CI, errores en español.
- [x] Fase 1: datos de demo 2025–2026 por departamento, estaciones, competencia y prospectos; forecast con backtest e intervalo; alertas; estadística.
- [x] Fase 2: Arandu con Claude (tool runner, streaming, caché, fallback) y modo demo sin IA.
- [x] Fase 3: filtros en la URL, KPIs con variación, alertas, mapas MapLibre, Ctrl+K, modo oscuro, CSV/PDF.
- [x] Fase 4: cinco módulos de soluciones navegables.
- [x] Fase 5: tests (42), build de producción verificado, Dockerfile, README.

# Pendiente

- [ ] Probar Arandu con una `ANTHROPIC_API_KEY` real (verificar herramientas, gráficos y `cache_read_input_tokens`).
- [ ] Publicar: repositorio en GitHub (activa el CI) y hosting (VPS/Docker o Vercel con `NITRO_PRESET`).
- [ ] Con datos reales: reemplazar el generador de `src/lib/data/` por conectores (SAP, estaciones, competencia).
