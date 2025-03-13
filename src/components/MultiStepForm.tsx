"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { marked } from "marked";
import TransitionButton from "./TransitionButton";
import WordDisplay from "./WordDisplay";
import LoadingSpinner from "./LoadingSpinner";
import { useStream } from "../hooks/useStream";
import { storyPrompt, phrasePrompt } from "../utils/prompts";
import { WordDescriptionProps } from "../interfaces";

export default function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [words, setWords] = useState<WordDescriptionProps[]>([]);
  const [newWordDescription, setNewWordDescription] = useState("");
  const { streaming, setStreaming, handleStream } = useStream();

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleWordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const { value } = e.target;
    const newWords = [...words];
    newWords[index].word = value;
    setWords(newWords);
  };

  const handleStartOver = () => {
    setStep(0);
    setWords([]);
  };

  const handleAddWord = async () => {
    const newWords = [...words, { word: "", description: "" }];
    setWords(newWords);

    const response = await handlePromptGeneration();
    if (response) {
      const text = response.choices[0].message.content;
      setNewWordDescription(text);
    }
  };

  // useEffect to change the dom when a prompt is generated
  useEffect(() => {
    if (newWordDescription) {
      const newWords = [...words];
      newWords[newWords.length - 1].description = newWordDescription;
      setWords(newWords);
    }
  }, [newWordDescription]);

  const handleRemoveWord = (index: number) => {
    if (words.length === 1) {
      return;
    }
    setWords(words.filter((_, i) => i !== index));
  };

  const handlePromptGeneration = async () => {
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
              content: phrasePrompt,
            },
            {
              role: "user",
              content: "Give me a good mad-lib prompt for a child to answer.",
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      console.error("Failed to generate prompt");
      console.error(response);
      return;
    }

    return await response.json();
  };

  const handleStoryGeneration = async () => {
    for (const word of words) {
      if (word.word === "") {
        alert("Please fill out all words");
        return;
      }
    }

    nextStep();
    setStreaming(true);

    const query = `
      Create me a story using these words and descriptions:
      ${words
        .map((word) => `Word: ${word.word}, Description: ${word.description}`)
        .join("\n")}  
    `;

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
            content: storyPrompt,
          },
          {
            role: "user",
            content: query,
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

  return (
    <div className="p-4 max-w-lg mx-auto">
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
              <h2 className="text-center">
                Use these words to generate a story!
              </h2>
              {words.map((word, index) => (
                <div key={index} className="flex flex-row items-center gap-2">
                  {word.description === "" ? (
                    <LoadingSpinner />
                  ) : (
                    <WordDisplay
                      word={word.word}
                      description={word.description}
                      index={index}
                      onChange={handleWordChange}
                      onRemove={handleRemoveWord}
                    />
                  )}
                </div>
              ))}
              <div className="flex flex-row align-center justify-center gap-2">
                <TransitionButton onClick={handleAddWord}>
                  Add Word
                </TransitionButton>
              </div>
            </div>
            <div className="flex flex-row align-center justify-center gap-2 w-full">
              <TransitionButton onClick={prevStep} className="flex-1">
                Back
              </TransitionButton>
              <TransitionButton
                onClick={handleStoryGeneration}
                className="flex-1"
              >
                Generate
              </TransitionButton>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col align-center justify-center text-center gap-2">
            {streaming ? <LoadingSpinner /> : <h2>Your Story</h2>}
            <div id="generated-story"></div>
            {!streaming && (
              <div className="flex flex-row align-center justify-center gap-2">
                <TransitionButton onClick={nextStep}>
                  Create Image
                </TransitionButton>
                <TransitionButton onClick={handleStartOver}>
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
