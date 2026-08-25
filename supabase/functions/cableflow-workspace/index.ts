/**
 * CableFlow workspace sync — create / get / put AppData by secret UUID.
 *
 * Auth: public (no login). Possession of the workspace UUID is the secret.
 * DB: service role via PostgREST (RLS blocks anon direct access).
 *
 * POST JSON body:
 *   { "action": "create", "code": "<uuid>", "payload": { ...AppData } }
 *   { "action": "get", "code": "<uuid>" }
 *   { "action": "put", "code": "<uuid>", "payload": { ...AppData } }
 *
 * CORS enabled for browser clients.
 */

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
}

type Action = "create" | "get" | "put"

type RequestBody = {
  action?: Action
  code?: string
  payload?: unknown
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}

function isValidUuid(value: string): boolean {
  return UUID_RE.test(value)
}

function getEnv(name: string): string {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing env ${name}`)
  return value
}

async function rest(
  path: string,
  init: RequestInit & { prefer?: string } = {},
): Promise<Response> {
  const url = `${getEnv("SUPABASE_URL")}/rest/v1/${path}`
  const headers: Record<string, string> = {
    apikey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    Authorization: `Bearer ${getEnv("SUPABASE_SERVICE_ROLE_KEY")}`,
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  }
  if (init.prefer) headers.Prefer = init.prefer
  return fetch(url, { ...init, headers })
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405)
  }

  let body: RequestBody
  try {
    body = (await req.json()) as RequestBody
  } catch {
    return jsonResponse({ error: "invalid_json" }, 400)
  }

  const action = body.action
  const code = typeof body.code === "string" ? body.code.trim() : ""

  if (!action || !["create", "get", "put"].includes(action)) {
    return jsonResponse({ error: "invalid_action" }, 400)
  }

  if (!code || !isValidUuid(code)) {
    return jsonResponse({ error: "invalid_code" }, 400)
  }

  try {
    if (action === "create") {
      const payload = body.payload ?? {}
      const now = new Date().toISOString()
      const res = await rest("cableflow_workspaces", {
        method: "POST",
        prefer: "return=representation",
        body: JSON.stringify({
          id: code,
          payload,
          payload_version:
            typeof (payload as { version?: number })?.version === "number"
              ? (payload as { version: number }).version
              : 3,
          created_at: now,
          updated_at: now,
          last_access_at: now,
        }),
      })

      if (res.status === 409) {
        return jsonResponse({ error: "already_exists" }, 409)
      }
      if (!res.ok) {
        const text = await res.text()
        console.error("create failed", res.status, text)
        return jsonResponse({ error: "create_failed" }, 500)
      }

      const rows = (await res.json()) as Array<{
        id: string
        updated_at: string
        payload: unknown
      }>
      const row = rows[0]
      return jsonResponse({
        ok: true,
        code: row?.id ?? code,
        updatedAt: row?.updated_at ?? now,
        payload: row?.payload ?? payload,
      })
    }

    if (action === "get") {
      const res = await rest(
        `cableflow_workspaces?id=eq.${encodeURIComponent(code)}&select=id,payload,payload_version,updated_at`,
        { method: "GET" },
      )
      if (!res.ok) {
        const text = await res.text()
        console.error("get failed", res.status, text)
        return jsonResponse({ error: "get_failed" }, 500)
      }
      const rows = (await res.json()) as Array<{
        id: string
        payload: unknown
        payload_version: number
        updated_at: string
      }>
      const row = rows[0]
      if (!row) {
        return jsonResponse({ error: "not_found" }, 404)
      }

      // Touch last_access_at (best-effort)
      void rest(`cableflow_workspaces?id=eq.${encodeURIComponent(code)}`, {
        method: "PATCH",
        prefer: "return=minimal",
        body: JSON.stringify({ last_access_at: new Date().toISOString() }),
      })

      return jsonResponse({
        ok: true,
        code: row.id,
        updatedAt: row.updated_at,
        payloadVersion: row.payload_version,
        payload: row.payload,
      })
    }

    // put
    if (body.payload === undefined || body.payload === null) {
      return jsonResponse({ error: "missing_payload" }, 400)
    }

    const now = new Date().toISOString()
    const payload = body.payload
    const res = await rest(`cableflow_workspaces?id=eq.${encodeURIComponent(code)}`, {
      method: "PATCH",
      prefer: "return=representation",
      body: JSON.stringify({
        payload,
        payload_version:
          typeof (payload as { version?: number })?.version === "number"
            ? (payload as { version: number }).version
            : 3,
        updated_at: now,
        last_access_at: now,
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error("put failed", res.status, text)
      return jsonResponse({ error: "put_failed" }, 500)
    }

    const rows = (await res.json()) as Array<{ id: string; updated_at: string }>
    if (!rows[0]) {
      return jsonResponse({ error: "not_found" }, 404)
    }

    return jsonResponse({
      ok: true,
      code: rows[0].id,
      updatedAt: rows[0].updated_at,
    })
  } catch (err) {
    console.error(err)
    return jsonResponse({ error: "internal_error" }, 500)
  }
})
