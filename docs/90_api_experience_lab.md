# API Experience Lab v0.4

Interfaz visual para comprender APIs mediante experimentos conectados a Supabase.

## Modelo mental

```text
Acción del usuario
  → request HTTP
  → API key identifica la aplicación
  → Auth/JWT identifica al usuario
  → RLS autoriza filas
  → REST/RPC/Edge procesa
  → response HTTP
  → Realtime emite cambios
  → evidencia queda en hs_learning_runs
```

## Experiencia 1: API X-Ray

Permite alternar entre:

- REST `GET /rest/v1/hs_api_families`.
- RPC `POST /rest/v1/rpc/hs_search_library`.
- Edge `POST /functions/v1/hs-api-lab`.

La pantalla expone método, endpoint, headers censurados, body, status, latencia, request ID y JSON. Los experimentos de método incorrecto y Edge sin JWT convierten los errores 4xx en material de aprendizaje.

## Experiencia 2: Auth / RLS Challenge

La secuencia es:

1. Supabase Auth valida email y contraseña.
2. El JWT permanece solo en memoria.
3. El usuario crea y lee sus runs.
4. Una actualización contra un UUID sintético devuelve cero filas.
5. El run propio se cierra con evidencia y feedback.

El resultado demuestra la diferencia entre autenticación —quién eres— y autorización —qué filas puedes operar—.

## Experiencia 3: Realtime Monitor

El cliente se suscribe a Postgres Changes de `hs_learning_runs`, filtrados por el `user_id` autenticado. Una acción genera INSERT y UPDATE para que el usuario observe ambos payloads por WebSocket.

Esta versión usa Postgres Changes porque el volumen del laboratorio es bajo y el objetivo es pedagógico. Broadcast será la evolución apropiada si el flujo crece y requiere mayor escalabilidad.

## Seguridad

- Solo publishable key en el navegador.
- Ninguna secret key ni `service_role`.
- RLS continúa siendo la autoridad.
- JWT y contraseña no se persisten.
- La prueba de acceso ajeno usa un UUID sintético.
- No se modifica el esquema interno `realtime`.

## Definition of Done

- Python: `py scripts/verify.py`.
- Web: `npm run lint`, `npm run typecheck` y `npm run build`.
- Navegador: contenido visible, sin overlay de error y llamadas REST/RPC reales.
- Supabase: publicación Realtime y políticas RLS verificadas.
- Producción: deployment Vercel READY y comprobación del endpoint público.
