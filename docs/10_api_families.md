# Familias de APIs

Una API debe evaluarse por el problema que resuelve, no por popularidad.

## Contrato mínimo de adopción

Para cada integración documentar: propietario, autenticación, ambiente, endpoint, schema, paginación, rate limit, timeout, reintentos, idempotencia, errores, costo, datos sensibles, retención y mecanismo de prueba.

## Patrones fundamentales

### REST

Adecuado para lectura/escritura síncrona. Añadir timeout, validación de status, paginación y backoff. No reintentar ciegamente operaciones no idempotentes.

### Webhooks

El proveedor empuja un evento. Verificar firma, conservar payload RAW, responder rápido, procesar en segundo plano y deduplicar por event_id.

### GraphQL

Útil cuando el consumidor requiere formas distintas de datos. Controlar profundidad, complejidad y autorización por campo.

### Streaming y colas

Para desacoplar productores y consumidores. Definir clave, orden, reintentos, dead-letter queue y política de replay.

## Selección por proyectos

- Lead scoring: CRM + eventos + mensajería + experimentación.
- Pricing: datos públicos + geoespacial + storage + optimización.
- RAG: documentos + LLM + vectores + seguridad.
- DNTL Datos: open data + caché + observabilidad.
- Limpia Fast: marketing + WhatsApp + pagos + analítica.

El catálogo completo y consultable vive en `catalog/api_families.json`.
