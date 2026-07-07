// OpenAI client — the first of several provider clients this package will
// export as they're integrated (Anthropic, Gemini, ...).
export { OpenAIClient, DEFAULT_GATEWAY_URL } from './openai/client.js';
export type { OpenAIClientOptions } from './openai/client.js';

// Shared across every client this package exports.
export type {
  DevicRuleUsage,
  DevicUsageInfo,
  WithDevicUsage,
} from './shared/types.js';
export { isTenantLimitExceeded } from './shared/errors.js';
export type {
  TenantLimitExceededInfo,
  TenantLimitExceededDetails,
} from './shared/errors.js';
