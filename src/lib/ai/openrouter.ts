const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
// Free models, fastest and most faithful first (checked October 2026; the free list changes, so
// re-test when replies start failing). Override with OPENROUTER_MODEL.
const DEFAULT_MODELS = [
  "poolside/laguna-s-2.1:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
  "nvidia/nemotron-3.5-lightning:free",
];
const TIMEOUT_MS = 15_000;

export const aiEnabled = () => Boolean(process.env.OPENROUTER_API_KEY);

export interface CompleteOptions {
  /** Longest wait for any one model. */
  timeoutMs?: number;
  maxTokens?: number;
  /** Overall time across every model tried, so the request finishes inside the function's limit. */
  budgetMs?: number;
  /** Reject a reply (e.g. it fails validation) and try the next model instead. */
  accept?: (reply: string) => boolean;
  /** Model order for this task, when the default order suits it badly. OPENROUTER_MODEL still wins. */
  models?: string[];
  /** Ask every model at once and take the first accepted reply, instead of one after another. */
  race?: boolean;
}

/** Sends one prompt to OpenRouter and returns the first accepted reply text. */
export async function complete(
  system: string,
  user: string,
  { timeoutMs = TIMEOUT_MS, maxTokens = 1500, budgetMs = Infinity, accept, models: preferred, race = false }: CompleteOptions = {}
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const models = process.env.OPENROUTER_MODEL ? [process.env.OPENROUTER_MODEL] : (preferred ?? DEFAULT_MODELS);

  const ask = async (model: string, signal: AbortSignal) => {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://horus.to",
          "X-Title": "Horus",
        },
        body: JSON.stringify({
          model,
          temperature: 0,
          max_tokens: maxTokens,
          // Reasoning models otherwise spend the whole token budget thinking and return nothing
          reasoning: { enabled: false },
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal,
      });
      if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
      const content = (await res.json())?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("Empty reply");
      if (accept && !accept(content)) throw new Error(`Unusable reply from ${model}`);
      return content;
    } catch (error) {
      // Model and reason only (status, timeout, rejected reply); never the prompt or reply text
      if (!(error instanceof Error && error.name === "AbortError")) {
        const reason = error instanceof Error ? (error.name === "TimeoutError" ? "timed out" : error.message) : "failed";
        console.warn(`[openrouter] ${model}: ${reason}`);
      }
      throw error;
    }
  };

  if (race) {
    // The first accepted reply wins; the rest are cancelled
    const winner = new AbortController();
    const signal = AbortSignal.any([winner.signal, AbortSignal.timeout(Math.min(timeoutMs, budgetMs))]);
    try {
      return await Promise.any(models.map((model) => ask(model, signal)));
    } catch (error) {
      throw error instanceof AggregateError ? error.errors.at(-1) : error;
    } finally {
      winner.abort();
    }
  }

  const deadline = Date.now() + budgetMs;
  let lastError: unknown = new Error("No model replied in time");
  for (const model of models) {
    const remaining = deadline - Date.now();
    if (remaining < 1000) break;
    try {
      return await ask(model, AbortSignal.timeout(Math.min(timeoutMs, remaining)));
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
