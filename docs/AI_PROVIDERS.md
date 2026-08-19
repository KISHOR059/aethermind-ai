# AetherMind AI Provider Architecture

This document describes the AI Provider architecture for AetherMind, detailing the primary **Google Gemini 3.5 Flash** integration, the **Ollama** fallback and local development provider, structured output parsing, error handling, security practices, and operational configuration.

---

## 1. Overview & Architecture

AetherMind uses a decoupled, provider-agnostic AI subsystem. The application and feature services never interact directly with low-level AI SDKs or vendor APIs. All requests flow through a unified four-stage pipeline backed by an extensible provider interface.

```
                  ┌──────────────────────────────────────────────┐
                  │          Frontend Client (Web App)          │
                  │  POST /api/v1/ai/* (Provider-Agnostic API)   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                 AiController                 │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                  AiService                   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                  AIPipeline                  │
                  │  Stage 1: ContextBuilder (Safe user data)   │
                  │  Stage 2: PromptBuilder (Templates)         │
                  │  Stage 3: AI Provider Execution             │
                  │  Stage 4: ResponseParser (Zod Validation)   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │              AIProvider Interface            │
                  │     (FallbackProvider / Orchestrator)        │
                  └──────────────┬───────────────────────────────┘
                                 │
                 ┌───────────────┴───────────────┐
                 ▼                               ▼
  ┌──────────────────────────────┐ ┌──────────────────────────────┐
  │        GeminiProvider        │ │        OllamaProvider        │
  │     (Primary / Cloud)        │ │  (Fallback / Local Dev)      │
  │     @google/genai SDK        │ │     JSON API / Native        │
  │      gemini-3.5-flash        │ │        llama3.2:3b           │
  └──────────────────────────────┘ └──────────────────────────────┘
```

### Key Architectural Tenets
1. **Provider Agnosticism**: AI feature services (`Plan My Day`, `Task Breakdown`, `Task Prioritization`, `Smart Reschedule`, `Weekly Review`, `Productivity Insights`, and `AI Assistant Chat`) invoke the pipeline through standard prompt IDs without knowledge of the underlying model or provider.
2. **Resilience via Fallback**: Transient outages, rate limits, network timeouts, or service errors in the primary provider (Gemini) automatically trigger an optional fallback to Ollama without throwing errors to the user.
3. **Strict Validation**: All model outputs must pass through strict JSON parsing and Zod schema validation. Neither provider is permitted to bypass schema validation.
4. **Zero Secret Leakage**: `GEMINI_API_KEY` exists exclusively in the backend runtime. Context builders scrub all sensitive fields (passwords, hashes, JWT secrets, refresh tokens).

---

## 2. Environment Configuration

All AI configuration is validated at startup via Zod in `apps/api/src/config/env.ts`.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | `string` | `gemini` | Primary AI provider (`gemini` or `ollama`) |
| `GEMINI_API_KEY` | `string` | `""` | Google Gemini API key (Required when `AI_PROVIDER=gemini`) |
| `GEMINI_MODEL` | `string` | `gemini-3.5-flash` | Gemini model ID to use for inference |
| `AI_THINKING_LEVEL` | `string` | `medium` | Thinking/reasoning level (`none`, `low`, `medium`, `high`) |
| `AI_FALLBACK_PROVIDER`| `string` | `ollama` | Fallback provider (`ollama`, `gemini`, or `none`) |
| `AI_GEMINI_TIMEOUT_MS`| `number` | `30000` | Timeout in milliseconds for Gemini API requests |
| `AI_OLLAMA_TIMEOUT_MS`| `number` | `120000` | Timeout in milliseconds for Ollama local inference |
| `OLLAMA_BASE_URL` | `string` | `http://localhost:11434` | Base URL of local or remote Ollama server |
| `OLLAMA_MODEL` | `string` | `llama3.2:3b` | Ollama model identifier |

### Example Configuration (`.env`)

```env
# Primary Provider: Google Gemini
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...your-gemini-key
GEMINI_MODEL=gemini-3.5-flash
AI_THINKING_LEVEL=medium
AI_GEMINI_TIMEOUT_MS=30000

# Fallback Provider: Local Ollama
AI_FALLBACK_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
AI_OLLAMA_TIMEOUT_MS=120000
```

---

## 3. Provider Implementations

### 3.1 AIProvider Interface

Both providers and the fallback orchestrator adhere to `AIProvider`:

```typescript
export interface AIProvider {
  readonly modelInformation: ModelInformation;
  readonly status: ProviderStatus;

  generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;
  healthCheck?(): Promise<ProviderHealth>;
}
```

### 3.2 Gemini Provider (`GeminiProvider`)

- **SDK**: Official Google Gen AI SDK (`@google/genai`).
- **Model**: `gemini-3.5-flash`.
- **Structured Output**: Instructs the model using `config: { responseMimeType: "application/json" }`.
- **Thinking / Reasoning**: Supports Gemini 3.5 Flash thinking budgets (`none` $\rightarrow$ 0, `low` $\rightarrow$ 256, `medium` $\rightarrow$ 1024, `high` $\rightarrow$ 2048 tokens).
- **Transient Retry**: Automatically retries transient errors (HTTP 429 rate limit, 503 unavailable, network drops) up to 2 times using exponential backoff with jitter.
- **Fail-Fast**: Non-transient errors (e.g. HTTP 404 Model Not Found, 401/403 Invalid API key) fail immediately without wasteful retries.
- **Timeout**: Enforced via `Promise.race` against `AI_GEMINI_TIMEOUT_MS`.

### 3.3 Ollama Provider (`OllamaProvider`)

- **Transport**: Native HTTP POST to `${OLLAMA_BASE_URL}/api/generate`.
- **Structured Output**: Requests JSON with `format: "json"`.
- **Normalization**: Automatically strips markdown code fences (````json ... ````) and cleans UTF-8 byte order marks.
- **Timeout**: AbortController-backed cancellation bound to `AI_OLLAMA_TIMEOUT_MS`.
- **Health Check**: Pings `${OLLAMA_BASE_URL}/api/tags` to report live connectivity.

### 3.4 Fallback Provider (`FallbackProvider`)

The `FallbackProvider` acts as a transparent proxy. When `AI_FALLBACK_PROVIDER` is set and differs from `AI_PROVIDER`:
1. Requests are sent to the primary provider.
2. If the primary provider encounters a transient failure (HTTP 429 rate limit, 502/503 service outage, timeout, or network disconnect), the orchestrator catches the error, logs a warning, and re-routes the request to the fallback provider.
3. If the fallback completes the request, execution metrics are tagged with `fallbackUsed: true`, `primaryProvider: "Gemini"`, and `fallbackReason: "<error details>"`.
4. If `AI_FALLBACK_PROVIDER=none`, fallback is disabled and errors from the primary provider bubble up directly.

---

## 4. Structured JSON Output & Zod Validation

Existing AI features depend on deterministic, validated JSON structures. The pipeline enforces a four-stage lifecycle:

1. **Context Building**: Aggregates sanitized user data, user workspace tasks, time, and system rules into a structured context object.
2. **Prompt Building**: Renders prompt fragments (System, User, Assistant) with unambiguous JSON schema instructions and negative constraints (no comments, no extra keys, valid double quotes).
3. **Provider Inference**: The provider requests structured JSON mode (`responseMimeType: "application/json"` or `format: "json"`).
4. **Parsing & Zod Validation**:
   - `ResponseParser` extracts and parses the JSON payload.
   - The JSON object is validated against the feature's strict Zod schema (e.g. `dailyPlannerResponseSchema`, `taskBreakdownResponseSchema`, `smartRescheduleResponseSchema`).
   - If invalid JSON is returned, the pipeline performs a single self-correction retry before raising an `AIResponseError`.

### Supported AI Features & Schemas

| Feature | Endpoint | Schema | Thinking Level |
| :--- | :--- | :--- | :--- |
| **Plan My Day** | `POST /api/v1/ai/plan-day` | `DailyPlannerResponse` | Medium |
| **Task Breakdown** | `POST /api/v1/ai/tasks/:taskId/breakdown` | `TaskBreakdownResponse` | Medium |
| **Task Prioritization** | `POST /api/v1/ai/prioritize` | `TaskPrioritizationResponse` | Low |
| **Smart Reschedule** | `POST /api/v1/ai/reschedule` | `SmartRescheduleResponse` | Medium |
| **Weekly Review** | `POST /api/v1/ai/weekly-review` | `WeeklyReviewResponse` | Medium |
| **Productivity Insights** | `POST /api/v1/ai/productivity-insights` | `ProductivityInsightsResponse` | Low |
| **AI Assistant Chat** | `POST /api/v1/ai/chat` | `AssistantChatResponse` | Medium |

---

## 5. Error Handling & HTTP Status Mapping

All AI errors are mapped to normalized application errors:

| Underlying Error Condition | Application Error | HTTP Status | Error Code |
| :--- | :--- | :--- | :--- |
| Model Not Found / Retired (404) | `AIProviderError` | 404 | `AI_PROVIDER_ERROR` |
| Gemini / Ollama Rate Limit (429) | `AIRateLimitError` | 429 | `AI_RATE_LIMIT` |
| Gemini / Ollama Timeout | `AIProviderTimeoutError` | 504 | `AI_PROVIDER_TIMEOUT` |
| Invalid API Key / Auth Failure | `AIProviderError` | 401 | `AI_PROVIDER_ERROR` |
| Service Unavailable / Connection Refused | `AIProviderError` | 503 | `AI_PROVIDER_ERROR` |
| Malformed Schema / Invalid JSON Output | `AIResponseError` | 502 | `AI_RESPONSE_INVALID` |
| Task Not Found | `NotFoundError` | 404 | `NOT_FOUND` |

---

## 6. Security Considerations

1. **Backend Isolation**: `GEMINI_API_KEY` is never exposed to the frontend, included in API responses, or compiled into client JavaScript bundles.
2. **Safe Context Sanitization**: The `UserContextProvider` only extracts safe identity fields (`id`, `firstName`, `lastName`, `email`, `role`). Passwords, password hashes, refresh tokens, and JWT secrets are strictly excluded.
3. **Log Sanitization**: Structured logs capture request IDs, prompt IDs, durations, token counts, and error names. Full prompts and authentication tokens are excluded from standard telemetry.

---

## 7. Metrics & Observability

Every AI execution returns comprehensive metrics:

```typescript
{
  "executionTime": 842,
  "provider": "Gemini",
  "model": "gemini-3.5-flash",
  "tokenUsage": {
    "inputTokens": 450,
    "outputTokens": 180,
    "totalTokens": 630
  },
  "promptVersion": "1.0.0",
  "fallbackUsed": false,
  "stageTimings": {
    "contextTimeMs": 15,
    "promptTimeMs": 2,
    "llmTimeMs": 820,
    "parseTimeMs": 5,
    "totalTimeMs": 842,
    "cached": false
  }
}
```

---

## 8. Health Check Endpoint

Health status is available via:

```http
GET /api/v1/ai/health
```

### Sample Response (Gemini Primary + Ollama Fallback)

```json
{
  "status": "success",
  "data": {
    "provider": "Gemini",
    "model": "gemini-3.5-flash",
    "status": "healthy",
    "version": "1.0.0",
    "isAvailable": true,
    "fallback": {
      "provider": "Ollama",
      "model": "llama3.2:3b",
      "status": "healthy",
      "isAvailable": true
    }
  },
  "message": "AI service is available"
}
```
