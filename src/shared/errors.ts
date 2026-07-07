import { APIError } from 'openai';

export interface TenantLimitExceededDetails {
  allowed: false;
  blockingRule?: Record<string, any>;
  current?: number;
  limit?: number;
  resetsAt?: number;
  message?: string;
}

export interface TenantLimitExceededInfo {
  statusCode: 429;
  error: 'TENANT_LIMIT_EXCEEDED';
  message: string;
  details?: TenantLimitExceededDetails;
  retryAfter?: number;
}

/**
 * Narrows an error thrown by the SDK to the tenant-limit-exceeded case raised
 * by the Devic gateway, so callers don't need to know the underlying
 * `APIError`/`RateLimitError` shape to read `.current`, `.limit`, `.retryAfter`.
 *
 * @example
 * try {
 *   await client.chat.completions.create({ ... });
 * } catch (err) {
 *   if (isTenantLimitExceeded(err)) {
 *     console.log(err.error.details?.resetsAt, err.error.retryAfter);
 *   }
 *   throw err;
 * }
 */
export function isTenantLimitExceeded(
  err: unknown,
): err is APIError & { error: TenantLimitExceededInfo } {
  return (
    err instanceof APIError &&
    err.status === 429 &&
    (err.error as any)?.error === 'TENANT_LIMIT_EXCEEDED'
  );
}
