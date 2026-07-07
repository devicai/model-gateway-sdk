# @devicai/openai

**Experimental.** A thin wrapper — not a hard fork — around the official [`openai`](https://www.npmjs.com/package/openai)
SDK that meters your usage against [Devic](https://devic.ai)'s tenant/subtenant usage limits, the same
engine Devic uses internally for its own assistants and agents.

You keep using your own OpenAI API key (BYOK) exactly as before. Devic's gateway never stores it — it
only forwards your request to `api.openai.com` and records how many tokens/what it cost against your
tenant.

## Why a wrapper, not a fork

`DevicOpenAI` extends the official `OpenAI` class. It only overrides `baseURL` and `defaultHeaders` in
the constructor — every resource (`chat.completions`, `embeddings`, `responses`, ...) is the untouched
implementation from `openai`. Whatever OpenAI ships next keeps working here without any changes to this
package.

## Install

```bash
npm install @devicai/openai openai
```

## Usage

```ts
import { DevicOpenAI, isTenantLimitExceeded } from '@devicai/openai';

const client = new DevicOpenAI({
  apiKey: process.env.OPENAI_API_KEY,     // your real OpenAI key — sent to OpenAI as usual
  tenantId: 'acme-corp',                  // your Devic tenant
  devicApiKey: process.env.DEVIC_API_KEY, // devic-xxx
  // subtenantId: 'user-123',             // optional: per-end-user limits within the tenant
});

try {
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: 'Hello!' }],
  });

  console.log(completion.choices[0].message);
  console.log(completion.devic?.usage); // [{ metric: 'tokens', limit, current, percent, resetsAt }, ...]
} catch (err) {
  if (isTenantLimitExceeded(err)) {
    console.error(`Tenant limit hit, resets in ${err.error.retryAfter}s`);
    return;
  }
  throw err;
}
```

## Scope (v1) — this is an experiment

- **OpenAI only.** No other providers yet.
- **No streaming.** `stream: true` requests are rejected by the gateway with a 400. Non-streaming JSON
  endpoints (chat completions, embeddings, the responses API, ...) all work, since the gateway is a
  generic passthrough rather than endpoint-specific logic.
- **BYOK.** Devic never custodies your OpenAI API key.

Planned next, not yet implemented: streaming support, additional providers (Anthropic, Gemini).

## How it works

This package only changes where requests go and what headers accompany them — see the
[`llm-metering-proxy`](../backend/llm-metering-proxy) service for the actual metering logic (API key
resolution, tenant limit checks, usage recording, cost calculation).
