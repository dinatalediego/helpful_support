# Decision Loop inmobiliario v0.5

Demo pública y sintética que enseña el camino mínimo desde un dato hasta una decisión y su resultado observado.

## Historia que se verifica

```text
GET snapshot ficticio
  → POST priorizar lead
  → POST recomendar unidad
  → POST consultar proyecto
  → POST decidir asignación
  → Supabase Broadcast
  → la interfaz recibe el evento
```

La cuarta acción no se marca como observada por el solo hecho de que la API responda. Requiere `ACK` del servidor Realtime y recepción del payload por WebSocket.

## Contrato

La misma Route Handler atiende `GET` y `POST` en `/api/real-estate-demo`.

| Acción | Entrada mínima | Regla | Salida visible |
|---|---|---|---|
| `prioritize` | snapshot de tres leads | intención + recencia + etapa + financiamiento | ranking y lead elegido |
| `recommend` | `leadId` | distrito + dormitorios + presupuesto + disponibilidad | unidad elegida y score |
| `consult` | `projectSlug`, `question` | recuperación de campos de una ficha | respuesta y fuentes visibles |
| `assign` | `leadId`, `unitCode` | asesor habilitado con menor carga | evento de asignación |

Cada respuesta incluye `traceId` y `latencyMs`. Las reglas son deliberadamente simples para que el visitante pueda discutirlas y reemplazarlas.

## Realtime

El navegador crea un tópico público diferente por instancia, con `broadcast.self = true` y `broadcast.ack = true`. Después de obtener la decisión `assign`, publica `lead-assigned` y escucha el mismo evento.

Esto demuestra:

- conexión WebSocket;
- entrega al servidor Supabase;
- retorno del payload a la interfaz;
- correlación mediante `traceId` y `eventId`.

No demuestra persistencia, entrega a Sperant ni recepción por otro usuario. El Realtime Monitor v0.4 autenticado continúa siendo la prueba separada de Postgres Changes con RLS.

## Límites intencionales

- Todos los nombres, proyectos, precios y cargas son ficticios.
- No existe PII.
- No se escribe en CRM ni en PostgreSQL.
- No hay modelo de machine learning ni LLM.
- El ranking no predice conversión; aplica una regla determinística.
- La consulta del proyecto recupera una ficha, no genera conocimiento nuevo.
- El resultado Realtime es efímero y desaparece al cerrar la pestaña.

## Definition of Done

1. `GET /api/real-estate-demo` retorna tres leads y cuatro unidades.
2. Las cuatro acciones `POST` retornan HTTP 200 con `traceId`.
3. El resultado esperado es Lead A-184 → FJM-0804 → Faro Jesús María → Asesora Centro.
4. El navegador muestra `Supabase SUBSCRIBED`.
5. La cuarta tarjeta muestra `ACK servidor: ok`.
6. La cuarta tarjeta cambia a `OBSERVADO` únicamente tras recibir el evento.
7. Lint, TypeScript y build terminan sin errores.
8. Vercel reporta el deployment como `READY`.
