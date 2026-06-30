// Voyle — chat API route
// POST /api/chat → streams a response from Ollama Cloud.
// Body: { messages: ChatMessage[] }

import { NextRequest } from "next/server";
import { streamChat, parseOllamaStream, ChatMessage } from "@/lib/ollama";
import { getSystemPrompt } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { messages?: ChatMessage[]; conversationId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userMessages = body.messages;
  if (!userMessages || !Array.isArray(userMessages) || userMessages.length === 0) {
    return Response.json({ error: "No messages provided" }, { status: 400 });
  }

  // Load the system prompt (Supabase-backed with hard-coded fallback)
  const systemPrompt = await getSystemPrompt();

  // Prepend the system prompt
  const fullMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...userMessages,
  ];

  // Stream from Ollama
  let ollamaResponse: Response;
  try {
    ollamaResponse = await streamChat(fullMessages);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return Response.json({ error: msg }, { status: 500 });
  }

  // Create a transformed stream that:
  // 1. Extracts content tokens from NDJSON
  // 2. Forwards them to the client as plain text
  const encoder = new TextEncoder();

  const transformedStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const token of parseOllamaStream(ollamaResponse)) {
          controller.enqueue(encoder.encode(token));
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(`\n[Error: ${e instanceof Error ? e.message : "stream error"}]`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(transformedStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}