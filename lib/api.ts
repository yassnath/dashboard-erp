import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function fail(message: string, status = 400, meta?: Record<string, unknown>) {
  return NextResponse.json({ error: message, meta }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return fail("Validation error", 422, { issues: error.issues });
  }

  if (error instanceof Error) {
    return fail(error.message, 400);
  }

  return fail("Unexpected error", 500);
}
