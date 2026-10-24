import type { ApiError } from "@/lib/types";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public fieldErrors: Record<string, string[]> = {},
    public details?: unknown,
  ) {
    super(message);
  }
}

export async function apiFetch<T = unknown>(url: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined && { "Content-Type": "application/json" }), ...headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 204) return undefined as T;

  const body = (await res.json().catch(() => null)) as ({ data: T } & Partial<ApiError>) | null;
  if (!res.ok || !body || body.error) {
    const err = body?.error;
    throw new ApiClientError(
      res.status,
      err?.code ?? "INTERNAL",
      err?.message ?? "Something went wrong. Please try again.",
      err?.details?.fieldErrors ?? {},
      err?.details,
    );
  }
  return body.data;
}

export function applyFieldErrors(
  err: unknown,
  setError: (name: never, error: { message: string }) => void,
): boolean {
  if (!(err instanceof ApiClientError)) return false;
  const entries = Object.entries(err.fieldErrors);
  for (const [field, messages] of entries) {
    if (messages?.[0]) setError(field as never, { message: messages[0] });
  }
  return entries.length > 0;
}
