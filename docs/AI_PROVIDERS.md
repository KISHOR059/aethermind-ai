# AetherMind AI Provider Architecture: Google Gemini 3.5 Flash

This document describes the AI Provider architecture for AetherMind, detailing the primary **Google Gemini 3.5 Flash** integration via the official `@google/genai` SDK, structured output parsing, Zod schema validation, transient error handling, security practices, and production deployment considerations.

---

## 1. Overview & Architecture

AetherMind employs a decoupled, modular AI subsystem built on the principle of **Dependency Inversion**. Application and domain services never communicate directly with vendor SDKs. All AI capabilities flow through a unified four-stage pipeline backed by an abstract provider contract (`AIProvider`).

```
                  ┌──────────────────────────────────────────────┐
                  │          Frontend Client (Web App)          │
                  │  POST /api/v1/ai/* (Authenticated via JWT)   │
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
                  │  Stage 1: ContextBuilder (Sanitized context) │
                  │  Cache Check: AICacheService (TTL Cache)     │
                  │  Stage 2: PromptBuilder (Templates & Schemas)│
                  │  Stage 3: AI Provider Execution              │
                  │  Stage 4: ResponseParser (Zod Validation)    │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │              AIProvider Interface            │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │                GeminiProvider                │
                  │              @google/genai SDK               │
                  │               gemini-3.5-flash               │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTPS
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            Google Gemini Cloud API           │
                  └──────────────────────────────────────────────┘
```

### Key Architectural Tenets

1. **Clean Separation of Concerns**: AI features (`Plan My Day`, `Task Breakdown`, `Task Prioritization`, `Smart Reschedule`, `Weekly Review`, `Productivity Insights`, and `AI Assistant Chat`) invoke the pipeline through standard prompt IDs without knowledge of transport details.
2. **Deterministic Validation**: All model outputs pass through double-pass JSON extraction and strict Zod schema validation before reaching the caller.
3. **Transient Fault Tolerance**: `GeminiProvider` automatically retries transient HTTP 429 rate limits, 503 service outages, and network dropouts with exponential backoff and jitter.
4. **Zero Secret Leakage**: `GEMINI_API_KEY` exists exclusively in the backend runtime. Context builders scrub sensitive security fields (passwords, hashes, JWT secrets, refresh tokens).
5. **In-Memory Caching**: `AICacheService` provides deterministic in-memory response caching for idempotent tasks to reduce latency and token consumption.

---

## 2. Environment Configuration

All AI configuration is validated at backend application startup via Zod in `apps/api/src/config/env.ts`.

| Variable | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `AI_PROVIDER` | `enum(["gemini"])` | `"gemini"` | Active AI provider identifier (locked to `"gemini"`) |
| `GEMINI_API_KEY` | `string` | `""` | Google Gemini API key (Required in production) |
| `GEMINI_MODEL` | `string` | `"gemini-3.5-flash"` | Gemini model identifier used for inference |
| `AI_THINKING_LEVEL` | `enum(["none","low","medium","high"])` | `"medium"` | Model reasoning budget tier |
| `AI_GEMINI_TIMEOUT_MS` | `number` | `30000` | HTTP request timeout in milliseconds (1s – 120s) |

### Example Configuration (`apps/api/.env`)

```env
# Google Gemini AI Configuration
AI_PROVIDER=gemini
GEMINI_API_KEY=AIzaSy...your-gemini-key
GEMINI_MODEL=gemini-3.5-flash
AI_THINKING_LEVEL=medium
AI_GEMINI_TIMEOUT_MS=30000
```

> [!IMPORTANT]
> In production environments (`NODE_ENV=production`), the API server verifies that `GEMINI_API_KEY` is present and non-empty during startup, failing fast if credentials are missing.

---

## 3. Provider Implementation

### 3.1 AIProvider Interface

Business logic and pipeline stages depend exclusively on the `AIProvider` contract:

```typescript
export interface AIProvider {
  readonly modelInformation: ModelInformation;
  readonly status: ProviderStatus;

  generateText(request: GenerateTextRequest): Promise<GenerateTextResponse>;
  healthCheck?(): Promise<ProviderHealth>;
}
```

### 3.2 Gemini Provider (`GeminiProvider`)

`GeminiProvider` implements `AIProvider` using the official Google Gen AI SDK (`@google/genai`):

- **SDK**: Official `@google/genai` SDK.
- **Model**: `gemini-3.5-flash` by default.
- **Structured JSON Mode**: Configures model inference with `responseMimeType: "application/json"` and optional OpenAPI response schemas.
- **Thinking / Reasoning Budgets**: Maps `AI_THINKING_LEVEL` to token budgets:
  - `"none"` $\rightarrow$ 0 tokens
  - `"low"` $\rightarrow$ 256 tokens
  - `"medium"` $\rightarrow$ 1,024 tokens
  - `"high"` $\rightarrow$ 2,048 tokens
- **Automatic Transient Retries**: Automatically retries transient errors (HTTP 429 rate limit, 503 unavailable, network drops, empty responses) up to 2 times using exponential backoff with randomized jitter.
- **Fail-Fast Error Handling**: Non-transient errors (HTTP 401/403 invalid API key, 404 model not found) fail immediately without wasteful retries.
- **Timeout Management**: Bound to `AI_GEMINI_TIMEOUT_MS` using `Promise.race` and `AbortController`.

### 3.3 Provider Factory (`createAIProvider`)

`apps/api/src/modules/ai/providers/provider.factory.ts` instantiates and returns the configured `GeminiProvider`:

```typescript
import type { AIProvider } from "./ai-provider.interface.js";
import { GeminiProvider } from "./gemini.provider.js";

export function createAIProvider(): AIProvider {
  return new GeminiProvider();
}
```

---

## 4. Structured Output & Zod Validation

The pipeline guarantees that model output matches domain expectations:

1. **Context Construction**: `ContextBuilder` aggregates sanitized user tasks, deadlines, priorities, temporal context, and user settings.
2. **Prompt Construction**: `PromptBuilder` combines context with system directives enforcing strict JSON output rules (no markdown fences, double quotes, no extra fields).
3. **Inference Execution**: `GeminiProvider` executes inference with `responseMimeType: "application/json"`.
4. **Response Parsing & Validation**:
   - `ResponseParser` extracts the raw JSON payload.
   - The payload is validated against the feature's strict Zod schema.
   - If invalid JSON is returned, the pipeline executes a single deterministic self-correction prompt before returning an error.

### Supported AI Features & Schemas

| Feature | Endpoint | Schema | Thinking Level |
| :--- | :--- | :--- | :--- |
| **Plan My Day** | `POST /api/v1/ai/plan-day` | `DailyPlannerResponse` | `medium` |
| **Task Breakdown** | `POST /api/v1/ai/tasks/:taskId/breakdown` | `TaskBreakdownResponse` | `medium` |
| **Task Prioritization** | `POST /api/v1/ai/prioritize` | `TaskPrioritizationResponse` | `low` |
| **Smart Reschedule** | `POST /api/v1/ai/reschedule` | `SmartRescheduleResponse` | `medium` |
| **Weekly Review** | `POST /api/v1/ai/weekly-review` | `WeeklyReviewResponse` | `medium` |
| **Productivity Insights** | `POST /api/v1/ai/productivity-insights` | `ProductivityInsightsResponse` | `low` |
| **AI Assistant Chat** | `POST /api/v1/ai/chat` | `AssistantChatResponse` | `medium` |

---

## 5. Error Handling & HTTP Status Mapping

All provider and pipeline errors are normalized to typed domain exceptions:

| Condition | Exception | HTTP Status | Error Code |
| :--- | :--- | :---: | :--- |
| Rate Limit Exceeded (429) | `AIRateLimitError` | 429 | `AI_RATE_LIMIT` |
| Provider Timeout | `AIProviderTimeoutError` | 504 | `AI_PROVIDER_TIMEOUT` |
| Invalid API Key / Auth (401/403) | `AIProviderError` | 401 / 403 | `AI_PROVIDER_ERROR` |
| Model Not Found (404) | `AIProviderError` | 404 | `AI_PROVIDER_ERROR` |
| Cloud Service Unavailable (503) | `AIProviderError` | 503 | `AI_PROVIDER_ERROR` |
| Malformed Schema / Invalid JSON | `AIResponseError` | 502 | `AI_RESPONSE_INVALID` |
| Task Not Found | `NotFoundError` | 404 | `NOT_FOUND` |

---

## 6. Security & Secrets Management

1. **Server-Side Isolation**: `GEMINI_API_KEY` is strictly confined to the backend process. It is never transmitted to the browser or embedded in frontend bundles.
2. **Context Sanitization**: Context builders exclude all authentication credentials, password hashes, session tokens, and refresh cookies from LLM context.
3. **Prompt Injection Resistance**: User inputs (task titles, descriptions, notes) are encapsulated in designated untrusted data tags (`<task_context>`, `<task_details>`, `<user_message>`), preventing prompt escape attempts.

---

## 7. Metrics & Observability

Every AI execution returns comprehensive execution metrics:

```json
{
  "executionTime": 2541,
  "provider": "Gemini",
  "model": "gemini-3.5-flash",
  "tokenUsage": {
    "inputTokens": 1031,
    "outputTokens": 430,
    "totalTokens": 1461
  },
  "promptVersion": "1.0.0",
  "retryCount": 0,
  "stageTimings": {
    "contextTimeMs": 28,
    "promptTimeMs": 0,
    "llmTimeMs": 2510,
    "parseTimeMs": 2,
    "totalTimeMs": 2541,
    "cached": false
  }
}
```

---

## 8. Health Check Endpoint

AI provider availability can be monitored via:

```http
GET /api/v1/ai/health
```

### Response Example

```json
{
  "success": true,
  "message": "AI service is available",
  "data": {
    "provider": "Gemini",
    "model": "gemini-3.5-flash",
    "status": "healthy",
    "version": "1.0.0",
    "isAvailable": true
  }
}
```

---

## 9. Production & Cloud Deployment Notes

- **Zero Local Daemons**: The AI engine requires no local daemon, no `localhost:11434` port, no local GPU/VRAM hardware, and no local model weight files.
- **Serverless & Container Compatibility**: With typical Gemini 3.5 Flash latencies of 1.5s – 5.0s, the AI provider functions seamlessly within standard serverless function timeouts (e.g. Vercel, AWS Lambda, Google Cloud Run).
- **Client Communication**: The web client communicates exclusively with the AetherMind Express API (`/api/v1/ai/*`). The browser never communicates directly with Google Gemini.

---

## 10. Historical Migration Note

> [!NOTE]
> *Historical Architecture Note*: Earlier versions of AetherMind supported local inference via Ollama (`llama3.2:3b`) with a proxy fallback orchestrator (`FallbackProvider`). Ollama and multi-provider fallback proxies were permanently decommissioned in favor of a streamlined, cloud-first **Google Gemini 3.5 Flash** architecture to eliminate latency bottlenecks, reduce operational overhead, and enable serverless cloud deployments.
