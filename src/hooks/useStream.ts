import { useState, useCallback } from 'react';

export const useStream = () => {
  const [streaming, setStreaming] = useState(false);

  const handleStream = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("Response body is not readable");
    }

    const decoder = new TextDecoder();
    const storyElement = document?.getElementById("generated-story");
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
              if (content && storyElement) {
                storyElement.innerHTML += content;
              }
            } catch (e: any) {
              console.error("Failed to generate story", e);
            }
          }
        }
      }
    } finally {
      reader.cancel();
    }
  }, []);

  return { streaming, setStreaming, handleStream };
};