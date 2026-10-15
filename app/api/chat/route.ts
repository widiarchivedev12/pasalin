import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { createGroq } from "@ai-sdk/groq";
import { retrieveChunks } from "@/lib/retrieve";
import { buildSystemPrompt } from "@/lib/prompt";
import { ratelimit } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export const maxDuration = 30;

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  // Rate limiting per IP
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "anonymous";

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);
  if (!success) {
    return new Response(
      JSON.stringify({
        error: "Terlalu banyak permintaan. Coba lagi dalam beberapa saat.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  const { messages, documentId }: { messages: UIMessage[]; documentId?: number } =
    await req.json();

  const lastUserPart = messages
    .findLast((m) => m.role === "user")
    ?.parts.find((p) => p.type === "text");

  if (!lastUserPart || lastUserPart.type !== "text") {
    return new Response("Pesan tidak ditemukan", { status: 400 });
  }

  const retrieved = await retrieveChunks(lastUserPart.text, 5, documentId);
  const systemPrompt = buildSystemPrompt(retrieved);

  const result = streamText({
    model: groq(process.env.MODEL_ID ?? "llama-3.3-70b-versatile"),
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
