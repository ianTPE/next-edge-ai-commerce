import type { Context } from 'hono';
import type { ApiErr } from '../types';

export const ErrorCodes = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export function errorResponse(
  c: Context,
  code: ErrorCode,
  message: string,
  status: number,
  details?: unknown
) {
  const response: ApiErr = {
    ok: false,
    error: { code, message, ...(details && { details }) },
  };
  return c.json(response, status as 400 | 401 | 403 | 404 | 409 | 429 | 500);
}

export function unauthorized(c: Context, message = 'Unauthorized') {
  return errorResponse(c, ErrorCodes.UNAUTHORIZED, message, 401);
}

export function forbidden(c: Context, message = 'Forbidden') {
  return errorResponse(c, ErrorCodes.FORBIDDEN, message, 403);
}

export function notFound(c: Context, message = 'Not found') {
  return errorResponse(c, ErrorCodes.NOT_FOUND, message, 404);
}

export function validationError(c: Context, message: string, details?: unknown) {
  return errorResponse(c, ErrorCodes.VALIDATION_ERROR, message, 400, details);
}

export function conflict(c: Context, message: string) {
  return errorResponse(c, ErrorCodes.CONFLICT, message, 409);
}

export function internalError(c: Context, message = 'Internal server error') {
  return errorResponse(c, ErrorCodes.INTERNAL_ERROR, message, 500);
}
