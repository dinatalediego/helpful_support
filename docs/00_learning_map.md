# Mapa de desarrollo con software y ciencia

## Las capas que suelen omitirse

Un proyecto exitoso combina ocho competencias: descubrimiento del problema, diseño de producto, ingeniería de software, ingeniería de datos, ciencia/modelado, experimentación causal, operación/observabilidad y gobierno/seguridad. Un notebook cubre principalmente una de ellas.

## Secuencia recomendada

1. Formular una decisión concreta y su responsable.
2. Definir evento, entidad, etiqueta y horizonte temporal.
3. Construir un baseline simple y una métrica de negocio.
4. Diseñar contratos de datos y APIs.
5. Automatizar con pruebas y trazabilidad.
6. Desplegar de forma gradual.
7. Comparar decisión asistida contra control.
8. Retirar, mantener o escalar según evidencia.

## Temas de alto retorno para Diego

### Ingeniería de software

- Diseño modular, tipado, excepciones y pruebas.
- APIs REST, webhooks, idempotencia y colas.
- Git, revisiones, CI/CD y versionado semántico.
- Observabilidad: logs estructurados, métricas y trazas.
- Seguridad por diseño y gestión de secretos.

### Ingeniería de datos

- Modelado dimensional y contratos.
- Incrementales, CDC, snapshots y lineage.
- Calidad, freshness y reconciliación.
- Orquestación y recuperación ante fallas.

### Ciencia aplicada

- Leakage temporal, calibración y validación por tiempo.
- Causalidad, uplift y experimentación.
- Drift, champion/challenger y model registry.
- Optimización bajo restricciones.
- Human-in-the-loop y evaluación de decisiones.

### Producto

- Problema, usuario, acción y resultado.
- Instrumentación de eventos.
- Métrica North Star y guardrails.
- Coste total de propiedad y criterio de retiro.
