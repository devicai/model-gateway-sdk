import OpenAI, { type ClientOptions } from 'openai';

export const DEFAULT_GATEWAY_URL = 'https://llm-metering-proxy.devic.ai/openai/v1';

export interface DevicOpenAIOptions extends ClientOptions {
  /** Devic tenant this usage should be attributed to and limited by. */
  tenantId: string;
  /** Your Devic API key (`devic-xxx`) — only used to resolve your tenant/limits, never sent to OpenAI. */
  devicApiKey: string;
  /** Optional subtenant, for per-end-user limits within a tenant. */
  subtenantId?: string;
  /** Override the metering gateway URL (e.g. for local development against llm-metering-proxy). */
  devicGatewayUrl?: string;
}

/**
 * Drop-in replacement for the official `OpenAI` client: same constructor
 * surface plus `tenantId`/`devicApiKey`. `apiKey` is still your real OpenAI
 * key and is still sent to OpenAI as usual (BYOK) — Devic's gateway never
 * stores it, only forwards it. Every resource (`chat.completions`,
 * `embeddings`, ...) is untouched, so anything new OpenAI ships keeps
 * working without changes here.
 */
export class DevicOpenAI extends OpenAI {
  constructor(opts: DevicOpenAIOptions) {
    const { tenantId, devicApiKey, subtenantId, devicGatewayUrl, ...rest } = opts;
    if (!tenantId) throw new Error('DevicOpenAI: "tenantId" is required.');
    if (!devicApiKey) throw new Error('DevicOpenAI: "devicApiKey" is required.');

    super({
      ...rest,
      baseURL: devicGatewayUrl ?? DEFAULT_GATEWAY_URL,
      defaultHeaders: {
        ...rest.defaultHeaders,
        'x-devic-api-key': devicApiKey,
        'x-devic-tenant-id': tenantId,
        ...(subtenantId ? { 'x-devic-subtenant-id': subtenantId } : {}),
      },
    });
  }
}
