import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (request.method !== "POST") {
    return json({ error: "method_not_allowed", allowed: ["POST"] }, 405);
  }

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return json({ error: "missing_authorization" }, 401);
  }

  let payload: { query?: unknown; limit?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const query = typeof payload.query === "string" ? payload.query.trim() : "";
  const requestedLimit =
    typeof payload.limit === "number" && Number.isInteger(payload.limit)
      ? payload.limit
      : 8;
  const limit = Math.max(1, Math.min(requestedLimit, 20));

  if (query.length < 2 || query.length > 200) {
    return json({ error: "query_length", min: 2, max: 200 }, 422);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) {
    return json({ error: "server_configuration" }, 500);
  }

  const started = performance.now();
  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/hs_search_library`,
    {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_query: query,
        result_limit: limit,
      }),
    },
  );

  if (!response.ok) {
    return json(
      {
        error: "search_failed",
        upstream_status: response.status,
        request_id: response.headers.get("sb-request-id"),
      },
      502,
    );
  }

  const results = await response.json();
  return json({
    query,
    count: Array.isArray(results) ? results.length : 0,
    results,
    meta: {
      latency_ms: Math.round(performance.now() - started),
      retrieval: "postgres_fts_prefix",
      version: "0.2.0",
    },
  });
});
