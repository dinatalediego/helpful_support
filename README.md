# Helpful Support — Software & Science Field Library

Biblioteca práctica y buscable para convertir ideas de software, datos y ciencia en sistemas operables.

## Qué resuelve

Cada tema conecta concepto, decisión, contrato, ejemplo ejecutable y evidencia de cierre. La v0.2 combina dos laboratorios:

- **Local:** Markdown + SQLite FTS5, gratuito y reproducible.
- **Remoto:** Supabase Data API + Auth/RLS + RPC + Realtime + Edge Function.

## Inicio rápido local

Requiere Python 3.11+ y no necesita dependencias externas.

```powershell
py scripts/verify.py
py -m helpful_support.cli search "webhooks idempotencia"
py -m helpful_support.cli api-family geospatial
```

## Inicio rápido Supabase

Configura `SUPABASE_URL` y `SUPABASE_PUBLISHABLE_KEY` como indica [Supabase API Lab](docs/80_supabase_api_lab.md):

```powershell
py -m helpful_support.cli remote-doctor
py -m helpful_support.cli remote-list
py -m helpful_support.cli remote-search "webhook idempotencia"
```

Para completar Auth → RLS → Edge Function:

```powershell
py examples/supabase_authenticated_lab.py
```

## Mapa de la biblioteca

- [Mapa de aprendizaje](docs/00_learning_map.md)
- [Familias de APIs](docs/10_api_families.md)
- [Arquitectura y entrega](docs/20_software_delivery.md)
- [Data Science operable](docs/30_applied_data_science.md)
- [RAG y sistemas de conocimiento](docs/40_rag_systems.md)
- [Seguridad, privacidad y costos](docs/50_safety_costs.md)
- [Mapa hacia tus proyectos](docs/60_project_adoption.md)
- [Checklist de cierre](docs/70_definition_of_done.md)
- [Supabase API Lab](docs/80_supabase_api_lab.md)
- [Catálogo estructurado](catalog/api_families.json)

## Arquitectura

```text
Markdown + JSON ──> SQLite FTS5 ──> CLI local
       │
       └──────────> Supabase Data API
                         ├─ REST / RPC
                         ├─ Auth + RLS
                         ├─ Realtime
                         └─ Edge Function
```

## Capacidades v0.2

- 12 familias de APIs.
- Cliente HTTP genérico con timeout, reintentos y backoff.
- Cliente Supabase sin dependencias para REST, Auth, RPC y Functions.
- Catálogo público y registros de aprendizaje privados.
- Búsqueda PostgreSQL flexible por prefijos.
- Edge Function con JWT obligatorio.
- Pruebas unitarias y GitHub Actions.
- Política de seguridad y definición de terminado.

## Principios

- Empezar con la opción más simple que permita medir.
- Separar datos, lógica de negocio, modelo e interfaz.
- Registrar evidencia antes de automatizar decisiones.
- Diseñar reintentos, idempotencia y límites desde el primer webhook.
- Nunca guardar secretos ni datos personales en Git.
- Un proyecto termina cuando existe evidencia de uso y resultado.

## Próxima evolución

Se recopilarán búsquedas y feedback antes de incorporar embeddings. `pgvector` y búsqueda híbrida se justificarán con un conjunto de evaluación donde el baseline FTS no recupere correctamente las fuentes.

## Licencia

MIT. Ver [LICENSE](LICENSE).
