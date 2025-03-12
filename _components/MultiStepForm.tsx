"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { marked } from "marked";
import TransitionButton from "./TransitionButton";

export default function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [words, setWords] = useState([{ word: "" }]);
  const [streaming, setStreaming] = useState(false);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const { value } = e.target;
    const newWords = [...words];
    newWords[index].word = value;
    setWords(newWords);
  };

  const handleRemoveWord = () => {
    if (words.length > 1) {
      setWords(words.slice(0, -1));
    }
  };

  const handleGenerate = async () => {
    nextStep();
    setStreaming(true);

    await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
    })
      .then((response) => handleStream(response))
      .catch((error) => console.error("Failed to generate story", error));

    // wait until end of stream to format markdown
    const storyElement = document?.getElementById("generated-story");
    if (storyElement) {
      storyElement.innerHTML = await marked(storyElement.innerHTML);
    }

    setStreaming(false);
  };

  const handleStream = async (response: Response) => {
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
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -100 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      >
        {step === 0 && (
          <div className="flex flex-col text-center gap-2">
            <h2>Welcome to the Imagination Machine</h2>
            <p>Let's build something cool!</p>
            <TransitionButton onClick={nextStep}>Imagine</TransitionButton>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col gap-2">
              <h2>Enter Words</h2>
              {words.map((word, index) => (
                <div key={index} className="flex flex-row items-center gap-2">
                  <label htmlFor={`word${index}`}>Word {index + 1}</label>
                  <input
                    type="text"
                    id={`word${index}`}
                    name={`word${index}`}
                    value={word.word}
                    onChange={(e) => handleChange(e, index)}
                    className="border rounded px-2 py-1"
                  />
                </div>
              ))}
              <div className="flex flex-row align-center justify-center gap-2">
                <TransitionButton onClick={handleRemoveWord}>
                  Remove word
                </TransitionButton>
                <TransitionButton
                  onClick={() => setWords([...words, { word: "" }])}
                >
                  Add Word
                </TransitionButton>
              </div>
            </div>
            <div className="flex flex-row align-center justify-center gap-2 w-full">
              <TransitionButton onClick={prevStep} className="flex-1">
                Back
              </TransitionButton>
              <TransitionButton onClick={handleGenerate} className="flex-1">
                Generate
              </TransitionButton>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col align-center justify-center text-center gap-2">
            {streaming ? <h2>Generating Story...</h2> : <h2>Your Story</h2>}
            <div id="generated-story"></div>
            {!streaming && (
              <div className="flex flex-row align-center justify-center gap-2">
                <TransitionButton onClick={nextStep}>
                  Create Image
                </TransitionButton>
                <TransitionButton onClick={() => setStep(0)}>
                  Start Over
                </TransitionButton>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
