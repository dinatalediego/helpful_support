# Helpful Support — Software & Science Field Library

Biblioteca práctica y buscable para convertir ideas de software, datos y ciencia en sistemas operables.

## Qué resuelve

Cada tema conecta concepto, decisión, contrato, ejemplo ejecutable y evidencia de cierre. La v0.5 combina cuatro superficies:

- **Local:** Markdown + SQLite FTS5, gratuito y reproducible.
- **Remoto:** Supabase Data API + Auth/RLS + RPC + Realtime + Edge Function + feedback.
- **Visual:** Next.js + Vercel para observar las APIs trabajando en tiempo real.
- **Decisión:** demo inmobiliaria con reglas explicables y evidencia Realtime.

## Decision Experience Lab v0.5

La interfaz ubicada en `apps/web` abre con un camino mínimo inmobiliario de cuatro acciones:

1. Priorizar tres leads ficticios con una regla visible.
2. Recomendar una unidad disponible según distrito, dormitorios y presupuesto.
3. Consultar la ficha ficticia del proyecto sin generación de texto libre.
4. Asignar el lead y marcar el resultado como observado solo cuando el evento regresa por Supabase Broadcast.

La demo no escribe en CRM, no persiste eventos y no afirma mejora comercial. Su objetivo es demostrar el circuito navegador → API → regla → decisión → WebSocket → interfaz. Consulta la [guía del Decision Loop](docs/95_real_estate_decision_loop.md).

## API Experience Lab v0.4

La webapp ubicada en `apps/web` incluye tres experiencias conectadas al proyecto Supabase:

- API X-Ray para inspeccionar REST, RPC y Edge Function.
- Auth/RLS Challenge para diferenciar identidad y autorización por fila.
- Realtime Monitor para observar INSERT y UPDATE por WebSocket.

```powershell
cd apps/web
npm ci
npm run dev
```

Consulta la [guía del laboratorio visual](docs/90_api_experience_lab.md).

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

Para completar Auth → RLS → RPC → Edge → métrica → feedback:

```powershell
py examples/supabase_authenticated_lab.py
```

Para cerrar un run existente:

```powershell
py examples/supabase_authenticated_lab.py --run-id UUID_DEL_RUN
```

El observador [Realtime](examples/realtime_learning_runs.html) permite ver el cambio de estado en vivo.

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
- [API Experience Lab](docs/90_api_experience_lab.md)
- [Decision Loop inmobiliario](docs/95_real_estate_decision_loop.md)
- [Catálogo estructurado](catalog/api_families.json)

## Arquitectura

```text
Markdown + JSON ──> SQLite FTS5 ──> CLI local
       │
       └──────────> Supabase Data API
                         ├─ REST / RPC
                         ├─ Auth + RLS
                         ├─ Realtime
                         ├─ Edge Function
                         └─ Métricas + feedback
```

## Capacidades v0.5

- 12 familias de APIs.
- Cliente HTTP genérico con timeout, reintentos y backoff.
- Cliente Supabase sin dependencias para REST, Auth, RPC y Functions.
- Catálogo público y registros de aprendizaje privados.
- Búsqueda PostgreSQL flexible por prefijos.
- Edge Function con JWT obligatorio.
- Cierre de runs con status HTTP, latencia y evidencia JSON.
- Feedback de recuperación protegido por RLS.
- Observador Realtime autenticado sin persistencia de sesión.
- Interfaz visual con request/response, desafíos RLS y stream Realtime.
- Demo inmobiliaria sintética con priorización, matching, consulta sustentada y asignación Broadcast.
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
