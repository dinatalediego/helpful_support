# Seguridad, privacidad y costos

## Amenazas mínimas

Secretos en Git, dependencias vulnerables, autorización rota, SQL injection, SSRF, archivos maliciosos, prompt injection, exposición de PII y abuso de endpoints.

## Controles

- Secretos solo en variables o secret manager.
- Menor privilegio y separación dev/staging/prod.
- Validación de entrada y consultas parametrizadas.
- Firmas de webhook y rotación de claves.
- Dependencias fijadas y actualizaciones automatizadas.
- Backups probados mediante restauración.
- Inventario de datos, retención y eliminación.

## FinOps

Por cada servicio registrar costo fijo, costo por unidad, límite mensual, caché, alertas y estrategia de degradación. Las APIs LLM requieren medir tokens, latencia, tasa de error y costo por resultado útil.

## Privacidad

Minimizar: si un campo no mejora una decisión, no conservarlo. Pseudonimizar identificadores para modelado. Restringir documentos y features según finalidad.
