import "server-only";
import { NextResponse } from "next/server";
import { ZodError, z } from "zod";
import { Prisma } from "@/generated/prisma/client";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "BAD_REQUEST"
  | "INTERNAL";

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INTERNAL: 500,
};

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export const notFound = (what = "Resource") => new AppError("NOT_FOUND", `${what} not found`);

export function ok<T>(data: T, init?: { status?: number; meta?: Record<string, unknown> }) {
  return NextResponse.json(init?.meta ? { data, meta: init.meta } : { data }, {
    status: init?.status ?? 200,
  });
}

export function noContent() {
  return new NextResponse(null, { status: 204 });
}

export function fail(code: ErrorCode, message: string, details?: unknown) {
  return NextResponse.json(
    { error: { code, message, ...(details !== undefined && { details }) } },
    { status: STATUS[code] },
  );
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof AppError) return fail(err.code, err.message, err.details);
    if (err instanceof ZodError) {
      return fail("VALIDATION_ERROR", "Invalid input", z.flattenError(err));
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") return fail("CONFLICT", "A record with these details already exists");
      if (err.code === "P2025") return fail("NOT_FOUND", "Resource not found");
    }
    console.error("[api] unhandled error", err);
    return fail("INTERNAL", "Something went wrong. Please try again.");
  }
}

export async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new AppError("BAD_REQUEST", "Request body must be valid JSON");
  }
}

export function searchParamsObject(url: string | URL): Record<string, string> {
  const params = new URL(url).searchParams;
  const out: Record<string, string> = {};
  params.forEach((v, k) => {
    if (v !== "") out[k] = v;
  });
  return out;
}
