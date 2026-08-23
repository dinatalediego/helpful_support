# Helpful Support Decision Experience Lab v0.5

Webapp educativa que conserva el API Experience Lab v0.4 y añade una demo inmobiliaria de ciclo completo. Una sola Route Handler ejecuta reglas determinísticas y Supabase Broadcast transporta la asignación final. No se añadió otra aplicación ni una base de datos demo.

## Experiencias

- **Decision Loop inmobiliario:** priorizar lead, recomendar unidad, consultar proyecto y observar una asignación Realtime.
- **API X-Ray:** REST, RPC y Edge Function con request, response, status y latencia.
- **Auth / RLS Challenge:** login, INSERT/SELECT/UPDATE propio y prueba segura de una fila sintética no autorizada.
- **Realtime Monitor:** WebSocket sobre `hs_learning_runs` y visualización de INSERT/UPDATE.

La demo inmobiliaria usa exclusivamente alias, proyectos y precios ficticios. Su evento Realtime es público, efímero y aislado por pestaña; no escribe en Sperant ni en PostgreSQL.

## Desarrollo local

Requiere Node.js 22+.

```powershell
cd apps/web
Copy-Item .env.example .env.local
npm ci
npm run dev
```

Completa `.env.local` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Ambas variables son configuración pública del cliente; nunca coloques una secret key ni `service_role`.

## Verificación

```powershell
npm run lint
npm run typecheck
npm run build
```

## Vercel

Configura **Root Directory** como `apps/web` y Node.js 22. Las variables `NEXT_PUBLIC_*` pueden sobrescribir la configuración pública predeterminada para otro proyecto Supabase.
