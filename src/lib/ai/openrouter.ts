const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODELS = ["qwen/qwen3.8-27b:free", "nvidia/nemotron-3.5-lightning:free"];
const TIMEOUT_MS = 15_000;

export const aiEnabled = () => Boolean(process.env.OPENROUTER_API_KEY);

/** Sends one prompt to OpenRouter, trying each model in turn. Returns the reply text. */
export async function complete(system: string, user: string, timeoutMs = TIMEOUT_MS, maxTokens = 1500): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  const models = process.env.OPENROUTER_MODEL ? [process.env.OPENROUTER_MODEL] : DEFAULT_MODELS;

  let lastError: unknown;
  for (const model of models) {
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
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
      if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
      const content = (await res.json())?.choices?.[0]?.message?.content;
      if (typeof content !== "string" || !content.trim()) throw new Error("Empty reply");
      return content;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}
