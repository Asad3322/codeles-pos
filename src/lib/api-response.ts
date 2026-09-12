import { NextResponse } from "next/server";
import type { ApiResponse } from "@/types";

export function apiSuccess<T>(data: T, message?: string, status = 200) {
  const body: ApiResponse<T> = { success: true, data, message };
  return NextResponse.json(body, { status });
}

export function apiError(error: string, status = 400) {
  let resolvedStatus = status;
  if (error === "Forbidden" && (status === 400 || status === 401)) {
    resolvedStatus = 403;
  } else if (error === "Unauthorized" && status === 400) {
    resolvedStatus = 401;
  }
  const body: ApiResponse = { success: false, error };
  return NextResponse.json(body, { status: resolvedStatus });
}
