# Supabase API Lab v0.3

Laboratorio vivo para aprender APIs con el proyecto personal de Supabase sin mezclar datos de `limpiafast-growth-os`.

## Capacidades desplegadas

- Data API REST para catálogo y ejemplos.
- RPC PostgreSQL `hs_search_library`.
- Auth y RLS para prácticas privadas.
- Realtime sobre `hs_learning_runs`.
- Edge Function autenticada `hs-api-lab`.
- Métricas, evidencia y feedback para cerrar cada ejecución.
- Full-text search como baseline anterior a pgvector.

## Modelo

| Objeto | Acceso |
|---|---|
| `hs_api_families` | Lectura pública; escritura solo servidor |
| `hs_api_examples` | Lectura pública; escritura solo servidor |
| `hs_learning_runs` | CRUD del propietario autenticado |
| `hs_search_feedback` | CRUD del propietario autenticado |
| `hs_search_library` | RPC pública de solo lectura |
| `hs-api-lab` | Edge Function con JWT obligatorio |

## Configuración local

Copia `.env.example` a `.env` y completa únicamente valores publicables:

```powershell
Copy-Item .env.example .env
```

Python no carga `.env` automáticamente. Para la sesión de PowerShell:

```powershell
$env:SUPABASE_URL="https://TU_PROJECT_REF.supabase.co"
$env:SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
```

No uses `SUPABASE_SECRET_KEY` ni `service_role` en clientes, navegador o ejemplos públicos.

## Ejercicio 1: REST

```powershell
py -m helpful_support.cli remote-list
```

Aprendizaje: URL, headers, API key, filtros, JSON y HTTP status.

## Ejercicio 2: RPC

```powershell
py -m helpful_support.cli remote-search "webhook idempotencia"
```

Aprendizaje: una función PostgreSQL expuesta como endpoint POST.

## Ejercicio 3: Auth + RLS + Edge Function

Para crear un run nuevo y completar todo el flujo:

```powershell
py examples/supabase_authenticated_lab.py
```

Para cerrar un run existente que continúa en `running`:

```powershell
py examples/supabase_authenticated_lab.py --run-id aae6afbf-1ad4-429c-97a3-4674349f5897
```

La contraseña no se muestra ni se guarda. El JWT vive solo en memoria. El script:

1. inicia sesión;
2. invoca la Edge Function, que usa el RPC;
3. mide la latencia;
4. actualiza el run mediante RLS a `succeeded` o `failed`;
5. conserva el HTTP status y evidencia JSON;
6. solicita una evaluación humana e inserta feedback privado.

Resultado esperado:

```text
Edge search results: 3 (... ms)
Run status: succeeded
Feedback created: ...
Ciclo cerrado: Auth → RLS → RPC → Edge → métrica → feedback
```

## Ejercicio 4: observar el UPDATE con Realtime

Abre un primer PowerShell en la raíz del repositorio:

```powershell
py -m http.server 8080
Start-Process http://localhost:8080/examples/realtime_learning_runs.html
```

En el navegador introduce URL, publishable key, usuario, contraseña y, opcionalmente, el run ID. Espera a ver `subscribed`. La página usa `@supabase/supabase-js` 2.111.0 fijado, no persiste la sesión y filtra por el `user_id` autenticado; RLS sigue siendo la autoridad.

En un segundo PowerShell ejecuta el comando del ejercicio 3. El observador mostrará el `UPDATE` con `status`, `latency_ms`, `response_status` y `evidence`.

## Comprobación en Supabase

En Table Editor:

- `hs_learning_runs`: el run debe quedar en `succeeded`, con `response_status = 200`, latencia y evidencia.
- `hs_search_feedback`: debe existir una fila del mismo usuario con la consulta, los slugs recuperados y la evaluación.

## Prueba remota

```powershell
py -m helpful_support.cli remote-doctor
```

Debe confirmar 12 familias y resultados para `webhook idempotencia`.

## Criterio para pgvector

No añadir embeddings todavía. Registra consultas y feedback; migra a búsqueda híbrida cuando exista un conjunto de evaluación donde FTS no recupere la fuente correcta. Así podrás medir si la complejidad añade valor.

## Riesgos aceptados

Las tablas con permisos Data API también pueden quedar visibles a través de GraphQL. Es intencional para el catálogo público y seguro para objetos privados porque RLS aplica por usuario. Los índices nuevos pueden figurar temporalmente como no utilizados hasta acumular tráfico.
