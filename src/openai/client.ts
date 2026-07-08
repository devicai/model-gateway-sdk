import OpenAI, { type ClientOptions } from 'openai';

export const DEFAULT_GATEWAY_URL = 'https://model-gateway.devic.ai/openai/v1';

/** Same fields Devic's own tenant auto-detection reads (domain/logo inference happens gateway-side). */
export interface DevicTenantMetadata {
  name?: string;
  email?: string;
  imageUrl?: string;
}

export interface DevicSubtenantMetadata {
  id?: string;
  name?: string;
  email?: string;
  imageUrl?: string;
}

export interface OpenAIClientOptions extends ClientOptions {
  /** Your Devic API key (`devic-xxx`) — only used to identify the caller, never sent to OpenAI. */
  devicApiKey: string;
  /**
   * Devic tenant this usage should be attributed to and limited by. Optional —
   * without it, requests still go through the gateway (BYOK passthrough) but
   * no tenant usage limits are checked or recorded.
   */
  tenantId?: string;
  /** Optional subtenant, for per-end-user limits within a tenant. Only meaningful together with `tenantId`. */
  subtenantId?: string;
  /**
   * Identifying details for this tenant (company name, contact email, logo).
   * Used the same way Devic's own assistants/agents identify tenants: fills
   * in missing fields and infers the tenant's domain/logo from the email
   * domain — it never overwrites values already known for this tenant.
   */
  tenantMetadata?: DevicTenantMetadata;
  /** Same idea as `tenantMetadata`, but for the individual subtenant/end-user. */
  subtenantMetadata?: DevicSubtenantMetadata;
  /** Override the metering gateway URL (e.g. for local development against model-gateway). */
  devicGatewayUrl?: string;
}

/**
 * Drop-in replacement for the official `OpenAI` client: same constructor
 * surface plus `devicApiKey`/`tenantId`. `apiKey` is still your real OpenAI
 * key and is still sent to OpenAI as usual (BYOK) — Devic's gateway never
 * stores it, only forwards it. Every resource (`chat.completions`,
 * `embeddings`, ...) is untouched, so anything new OpenAI ships keeps
 * working without changes here.
 */
export class OpenAIClient extends OpenAI {
  constructor(opts: OpenAIClientOptions) {
    const {
      tenantId,
      devicApiKey,
      subtenantId,
      tenantMetadata,
      subtenantMetadata,
      devicGatewayUrl,
      ...rest
    } = opts;
    if (!devicApiKey) throw new Error('OpenAIClient: "devicApiKey" is required.');

    const metadata =
      tenantId && (tenantMetadata || subtenantMetadata)
        ? JSON.stringify({ tenantMetadata, subtenantMetadata })
        : undefined;

    super({
      ...rest,
      baseURL: devicGatewayUrl ?? DEFAULT_GATEWAY_URL,
      defaultHeaders: {
        ...rest.defaultHeaders,
        'x-devic-api-key': devicApiKey,
        ...(tenantId ? { 'x-devic-tenant-id': tenantId } : {}),
        ...(subtenantId ? { 'x-devic-subtenant-id': subtenantId } : {}),
        ...(metadata ? { 'x-devic-tenant-metadata': metadata } : {}),
      },
    });
  }
}
