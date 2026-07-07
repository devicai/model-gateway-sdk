# @devic/model-gateway-sdk

**Experimental.** A multi-provider LLM SDK that meters your usage against [Devic](https://devic.ai)'s
tenant/subtenant usage limits — the same engine Devic uses internally for its own assistants and agents.
`OpenAIClient` is the first client this package exports; more provider clients (Anthropic, Gemini, ...)
will be added as they're integrated, sharing the same metering/error contract.

You keep using your own provider API key (BYOK) exactly as before. Devic's gateway never stores it — it
only forwards your request to the provider and records how many tokens/what it cost against your tenant.

## Why a wrapper, not a fork

`OpenAIClient` extends the official `openai` package's `OpenAI` class. It only overrides `baseURL` and
`defaultHeaders` in the constructor — every resource (`chat.completions`, `embeddings`, `responses`, ...)
is the untouched implementation from `openai`. Whatever OpenAI ships next keeps working here without any
changes to this package.

## Install

```bash
npm install @devic/model-gateway-sdk openai
```

## Usage

```ts
import { OpenAIClient, isTenantLimitExceeded } from '@devic/model-gateway-sdk';

const client = new OpenAIClient({
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

- **`OpenAIClient` only.** Other provider clients are planned but not implemented yet.
- **No streaming.** `stream: true` requests are rejected by the gateway with a 400. Non-streaming JSON
  endpoints (chat completions, embeddings, the responses API, ...) all work, since the gateway is a
  generic passthrough rather than endpoint-specific logic.
- **BYOK.** Devic never custodies your provider API key.

Planned next, not yet implemented: streaming support, additional provider clients.

## How it works

This package only changes where requests go and what headers accompany them — see the
[`model-gateway`](../backend/model-gateway) service for the actual metering logic (API key resolution,
tenant limit checks, usage recording, cost calculation).
