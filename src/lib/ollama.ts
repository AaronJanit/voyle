// Voyle — Ollama Cloud client
// Streams chat completions from an Ollama Cloud endpoint.

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Call Ollama Cloud's /api/chat endpoint with streaming.
 * Returns the raw Response so the caller can pipe the stream.
 *
 * Assumes the native Ollama API format:
 * POST {baseUrl}/api/chat
 * Body: { model, messages, stream: true }
 * Response: newline-delimited JSON (NDJSON) stream
 */
export async function streamChat(
  messages: ChatMessage[]
): Promise<Response> {
  const baseUrl = process.env.OLLAMA_BASE_URL;
  const apiKey = process.env.OLLAMA_API_KEY;
  const model = process.env.OLLAMA_MODEL;

  if (!baseUrl || !apiKey || !model) {
    throw new Error("Ollama Cloud not configured. Set OLLAMA_BASE_URL, OLLAMA_API_KEY, and OLLAMA_MODEL in .env.local");
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/chat`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "Unknown error");
    throw new Error(`Ollama Cloud error ${response.status}: ${text}`);
  }

  return response;
}

/**
 * Parse the NDJSON stream from Ollama and yield content tokens.
 * Each line is a JSON object like: { message: { content: "..." }, done: false }
 */
export async function* parseOllamaStream(
  response: Response
): AsyncGenerator<string> {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const json = JSON.parse(trimmed);
        if (json.message?.content) {
          yield json.message.content as string;
        }
        if (json.done) return;
      } catch {
        // Skip malformed lines
      }
    }
  }
}