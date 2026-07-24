// Shared API wrapper: single place that owns fetch, timeout, abort and error handling
// for every request the app makes to the WordPress/Sanad backend.

const BASE_URL = import.meta.env.VITE_API_URL || ""

const DEFAULT_TIMEOUT_MS = 15000

const CSRF_HEADER = "X-CSRF-Token"
const CSRF_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

// In-memory only, just like the auth token — set from the login/session-check response
// (see AuthContext) and attached automatically to every write request below.
let csrfToken: string | null = null

export function setCsrfToken(token: string | null) {
  csrfToken = token
}

export interface ApiErrorShape {
  success: false
  message: string
  status: number
  error: true
}

export interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /**
   * @deprecated Auth now flows via an HttpOnly session cookie sent automatically by the
   * browser (see `credentials: "include"` below) — this is no longer read or sent as an
   * Authorization header. Kept in the type only so every existing call site across the
   * app (which still passes a token positionally) keeps compiling unchanged.
   */
  token?: string
  timeoutMs?: number
  body?: BodyInit | Record<string, unknown> | unknown[]
}

function isPlainJsonBody(body: unknown): body is Record<string, unknown> | unknown[] {
  if (body === null || body === undefined) return false
  if (typeof body !== "object") return false
  if (body instanceof FormData || body instanceof Blob || body instanceof ArrayBuffer) return false
  return true
}

function extractMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "message" in body) {
    const msg = (body as { message?: unknown }).message
    if (typeof msg === "string" && msg) return msg
  }
  return fallback
}

/**
 * Central request helper used by every function in services/api.ts.
 *
 * It never rejects for HTTP-level failures (4xx/5xx) or network/timeout errors —
 * it resolves with the parsed error body (or a normalized `ApiErrorShape`) instead,
 * so existing call sites that check `data.success` / `data.token` / `Array.isArray(data)`
 * keep working exactly as before, and no call site can produce an unhandled rejection.
 *
 * The generic defaults to `any` (matching the previous `res.json()` behavior) so every
 * existing caller across the app keeps compiling unchanged; pass an explicit `<T>` at the
 * call site to opt into a typed response.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, headers, body, signal, ...rest } = options

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
  // Allow an external signal to also abort the request (not currently used by callers,
  // kept for forward compatibility without changing any call site).
  if (signal) {
    if (signal.aborted) controller.abort()
    else signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  const finalHeaders: Record<string, string> = { ...(headers as Record<string, string> | undefined) }

  const method = (rest.method || "GET").toString().toUpperCase()
  if (csrfToken && CSRF_METHODS.has(method)) {
    finalHeaders[CSRF_HEADER] = csrfToken
  }

  let finalBody: BodyInit | undefined
  if (isPlainJsonBody(body)) {
    finalHeaders["Content-Type"] = finalHeaders["Content-Type"] || "application/json"
    finalBody = JSON.stringify(body)
  } else {
    finalBody = body as BodyInit | undefined
  }

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: finalBody,
      signal: controller.signal,
      // The JWT now lives only in an HttpOnly session cookie set by the backend —
      // this makes the browser attach/receive it automatically on every request.
      credentials: "include",
    })

    let parsed: unknown = null
    try {
      parsed = await res.json()
    } catch {
      parsed = null
    }

    if (!res.ok) {
      const message = extractMessage(parsed, res.statusText || "حدث خطأ في الاتصال بالخادم")
      if (parsed && typeof parsed === "object") {
        return parsed as T
      }
      return { success: false, message, status: res.status, error: true } as ApiErrorShape as unknown as T
    }

    return parsed as T
  } catch (err) {
    const isAbort = err instanceof DOMException && err.name === "AbortError"
    const message = isAbort ? "انتهت مهلة الاتصال، حاول مرة أخرى" : "تعذر الاتصال بالخادم"
    return { success: false, message, status: 0, error: true } as ApiErrorShape as unknown as T
  } finally {
    clearTimeout(timeoutId)
  }
}
