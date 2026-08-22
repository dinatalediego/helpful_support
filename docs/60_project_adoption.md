# Mapa de adopción para los proyectos

## bd_replica_crm / medallio_dw

Prioridad: contratos de tablas, incremental auditable, freshness, reconciliación Redshift–Postgres, feature snapshots, prediction log, model registry y experiments. Resultado: score diario reproducible y medible.

## dntl_chatbot

Prioridad: contrato de evento NIDO, webhook firmado, deduplicación, estado conversacional, handoff humano, consentimiento y métricas. El chatbot consume decisiones; no debe contener la lógica del modelo.

## Pricing inmobiliario

Añadir snapshots de stock/precio, elasticidad o causalidad con cautela, forecast de absorción, optimización bajo guardrails y simulación de escenarios. Nunca evaluar cambios solo con ventas observadas sin controlar disponibilidad y tiempo.

## expertos_en_lavados / limpia-fast

Laboratorio barato para instrumentar adquisición → conversación → cotización → servicio. Usar experimentos pequeños, CAC, conversión y margen, conservando consentimiento y atribución.

## dntl_datos

Fortalecer conectores con caché, schemas, freshness, licencias y estado de fuente. PWA después de telemetría básica; Android solo si una capacidad nativa lo justifica.

## dntl_economia

Agregar provenance, fecha de vigencia, visualizaciones explicables y evaluaciones de personalización. Es ideal para demostrar comunicación científica y RAG con fuentes.

## Regla de priorización

Primero una vertical con usuario y resultado real; luego convertir los componentes repetidos en plataforma compartida.
