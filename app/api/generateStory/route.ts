import type { NextApiRequest } from "next";
import { NextResponse } from "next/server";

export async function GET(req: NextApiRequest) {
  try {
    const words = req.query.words as string[];
    if (!words || words.length === 0) {
      throw new Error("No words provided");
    }
    
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen/qwq-32b:free",
          messages: [
            {
              role: "system",
              content:
                "you are a story generator. generate a 2 sentence story using the given words. only include the story. Do not include any explanation of your reasoning or process. Bold the words the user provided to you.",
            },
            {
              role: "user",
              content: words.join(", "),
            },
          ],
          stream: true,
        }),
      },
    );

    if (!response.body || !response.ok) {
      throw new Error(response.statusText);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          controller.enqueue(`data: ${chunk}\n\n`);
        }
        controller.enqueue("data: [DONE]\n\n");
        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate story", error);
    return new NextResponse(error.message, { status: 500 });
  }
}
