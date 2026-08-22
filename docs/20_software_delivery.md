# Arquitectura y entrega de software

## Arquitectura mínima sostenible

Separar interfaz, aplicación, dominio e infraestructura. La regla comercial no debe depender directamente de Vercel, Supabase, Sperant o un modelo específico.

## Contratos

Usar schemas versionados para eventos y respuestas. Los cambios aditivos suelen ser compatibles; renombrar o eliminar campos exige migración.

## Pruebas por riesgo

- Unitarias: reglas, cálculos y transformaciones.
- Contrato: schemas entre repositorios.
- Integración: base de datos y APIs.
- End-to-end: flujo principal del usuario.
- Smoke: disponibilidad después del despliegue.

## CI/CD

Cada cambio debe ejecutar formato, análisis estático, pruebas, escaneo de secretos y build. Producción necesita rollback, migraciones seguras y health check.

## Observabilidad

Logs dicen qué ocurrió; métricas muestran cuánto; trazas explican dónde. Incluir correlation_id, event_id, model_version y duración. Nunca registrar tokens ni PII innecesaria.

## Resiliencia

Timeout siempre; reintentos con backoff y jitter solo ante errores transitorios; circuit breaker ante caída persistente; idempotency key para escrituras; cola y dead-letter para trabajo asíncrono.
