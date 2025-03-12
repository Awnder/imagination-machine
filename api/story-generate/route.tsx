"use server";

import { storyPrompt } from "../../utils/prompts";

export async function POST(req: Request) {
  const words = await req.json();

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_STORY_GEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-zero:free",
        messages: [
          {
            role: "system",
            content: storyPrompt,
          },
          {
            role: "user",
            content: words,
          },
        ],
        stream: true,
      }),
    },
  );

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      // Append new chunk to buffer
      buffer += decoder.decode(value, { stream: true });
      // Process complete lines from buffer
      while (true) {
        const lineEnd = buffer.indexOf("\n");
        if (lineEnd === -1) break;
        const line = buffer.slice(0, lineEnd).trim();
        buffer = buffer.slice(lineEnd + 1);
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0].delta.content;
            if (content) {
              await writer.write(content);
            }
          } catch (e: any) {
            await writer.abort(e);
            return new Response(e.message, { status: 500 });
          }
        }
      }
    }
  } finally {
    await writer.close();
    reader.cancel();
  }

  return new Response(readable, {
    headers: { "Content-Type": "text/plain" },
  });
}
