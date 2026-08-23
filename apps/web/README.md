# Helpful Support API Experience Lab v0.4

Webapp educativa conectada al laboratorio Supabase existente. No añade otro backend: el navegador usa la publishable key, Supabase Auth entrega un JWT temporal y PostgreSQL aplica RLS.

## Experiencias

- **API X-Ray:** REST, RPC y Edge Function con request, response, status y latencia.
- **Auth / RLS Challenge:** login, INSERT/SELECT/UPDATE propio y prueba segura de una fila sintética no autorizada.
- **Realtime Monitor:** WebSocket sobre `hs_learning_runs` y visualización de INSERT/UPDATE.

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
