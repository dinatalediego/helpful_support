# Checklist de cierre completo

## Descubrimiento

- Usuario, decisión, dolor y alternativa actual identificados.
- Métrica primaria, guardrails y condición de abandono acordados.

## Datos

- Fuente, dueño, contrato, calidad y vigencia documentados.
- Datos sensibles minimizados.
- Dataset y features reproducibles sin leakage.

## Software

- Un comando de arranque.
- Configuración por ambiente y ningún secreto en Git.
- Pruebas según riesgo, CI verde y errores comprensibles.
- Migración, rollback y backup comprobados.

## Modelo o reglas

- Baseline explícito.
- Evaluación temporal y segmentada.
- Calibración y capacidad operativa consideradas.
- Versión, evidencia y explicación registradas.

## Producción

- Logs, métricas, health check y alertas accionables.
- Reintentos, idempotencia y recuperación.
- Owner y runbook definidos.

## Resultado

- Uso real instrumentado.
- Comparación contra baseline o control.
- Costo por resultado y aprendizaje registrados.
- Decisión: escalar, mantener, iterar o retirar.

Un repositorio está cerrado cuando otra persona puede ejecutarlo, entender su riesgo y verificar su aporte.
