# Data Science operable

## Del modelo a la decisión

Definir: población elegible, momento del score, horizonte, label, acción, capacidad operativa y resultado. Un score sin acción asignada no es un producto.

## Riesgos frecuentes

- Leakage por usar información conocida después de la predicción.
- Split aleatorio cuando el sistema opera en el tiempo.
- Optimizar AUC ignorando capacidad diaria.
- Probabilidades no calibradas.
- Sesgo de selección: solo se observa resultado de leads atendidos.
- Confundir predicción con impacto causal.

## Evaluación recomendada

Baseline de regla comercial y regresión logística. Validación temporal. Métricas técnicas: PR-AUC, calibration error y estabilidad. Métricas operativas: Precision@K, lift@K y cobertura. Métricas de negocio: conversiones incrementales, monto, tiempo y costo por acción.

## Operación

Registrar prediction_id, entity_id, features_version, model_version, score, decisión, explicación, actor, timestamp y outcome. Ejecutar shadow mode antes de intervenir. Promover challenger solo con criterios predefinidos.

## Métodos que completarían tu perfil

- Uplift modeling: a quién sí cambia el contacto.
- Survival analysis: cuándo puede convertir o caer.
- Optimización: asignación lead–asesor y pricing con restricciones.
- Causal impact: efecto de campaña o cambio de precio.
- Forecast probabilístico: absorción con intervalos.
