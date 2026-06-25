// Voyle — chat API route
// POST /api/chat → streams a response from Ollama Cloud.
// Body: { messages: ChatMessage[], conversationId?: string }
// Persists user + assistant messages to the database.

import { NextRequest } from "next/server";
import { streamChat, parseOllamaStream, ChatMessage } from "@/lib/ollama";
import { SYSTEM_PROMPT } from "@/lib/prompts";
import { prisma } from "@/lib/prisma";

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

  // Prepend the system prompt
  const fullMessages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    ...userMessages,
  ];

  // Persist the latest user message
  let conversationId = body.conversationId;
  const lastUserMsg = [...userMessages].reverse().find((m) => m.role === "user");

  if (lastUserMsg) {
    try {
      if (!conversationId) {
        const conversation = await prisma.conversation.create({
          data: {
            title: lastUserMsg.content.slice(0, 50),
            messages: {
              create: { role: "user", content: lastUserMsg.content },
            },
          },
        });
        conversationId = conversation.id;
      } else {
        await prisma.message.create({
          data: {
            conversationId,
            role: "user",
            content: lastUserMsg.content,
          },
        });
      }
    } catch (e) {
      console.error("Failed to persist user message:", e);
    }
  }

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
  // 2. Collects the full assistant response for DB persistence
  let fullAssistantContent = "";
  const encoder = new TextEncoder();

  const transformedStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const token of parseOllamaStream(ollamaResponse)) {
          fullAssistantContent += token;
          controller.enqueue(encoder.encode(token));
        }
      } catch (e) {
        controller.enqueue(
          encoder.encode(`\n[Error: ${e instanceof Error ? e.message : "stream error"}]`)
        );
      } finally {
        controller.close();

        // Persist the assistant response
        if (conversationId && fullAssistantContent) {
          try {
            await prisma.message.create({
              data: {
                conversationId,
                role: "assistant",
                content: fullAssistantContent,
              },
            });
          } catch (e) {
            console.error("Failed to persist assistant message:", e);
          }
        }
      }
    },
  });

  return new Response(transformedStream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Conversation-Id": conversationId || "",
    },
  });
}