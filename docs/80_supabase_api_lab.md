# Supabase API Lab v0.2

Laboratorio vivo para aprender APIs con el proyecto personal de Supabase sin mezclar datos de `limpiafast-growth-os`.

## Capacidades desplegadas

- Data API REST para catálogo y ejemplos.
- RPC PostgreSQL `hs_search_library`.
- Auth y RLS para prácticas privadas.
- Realtime sobre `hs_learning_runs`.
- Edge Function autenticada `hs-api-lab`.
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

1. Crea tu usuario de laboratorio en Supabase Auth.
2. Ejecuta:

```powershell
py examples/supabase_authenticated_lab.py
```

La contraseña no se muestra ni se guarda. El flujo inicia sesión, inserta una práctica privada protegida por RLS y consulta la Edge Function con el JWT.

## Ejercicio 4: Realtime

Suscríbete a cambios de `hs_learning_runs` desde un cliente autenticado. La tabla ya pertenece a la publicación `supabase_realtime`; RLS continúa determinando qué filas puede recibir el usuario.

## Prueba remota

```powershell
py -m helpful_support.cli remote-doctor
```

Debe confirmar 12 familias y resultados para `webhook idempotencia`.

## Criterio para pgvector

No añadir embeddings todavía. Registra consultas y feedback; migra a búsqueda híbrida cuando exista un conjunto de evaluación donde FTS no recupere la fuente correcta. Así podrás medir si la complejidad añade valor.

## Riesgos aceptados

Los asesores advierten que las tablas con permisos Data API también son visibles a través de GraphQL. Es intencional para el catálogo público y seguro para objetos privados porque RLS aplica por usuario. Los índices nuevos pueden figurar temporalmente como no utilizados hasta acumular tráfico.
