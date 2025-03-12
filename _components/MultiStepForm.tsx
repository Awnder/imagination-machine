"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import TransitionButton from "./TransitionButton";

export default function MultiStepForm() {
  const [step, setStep] = useState(0);
  const [words, setWords] = useState([{ description: "", word: "" }]);

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    const newWords = [...words];
    newWords[index].word = value;
    setWords(newWords);
  };

  const handleRemoveWord = () => {
    if (words.length > 1) {
      setWords(words.slice(0, -1));
    }
  }

  const handleGenerate = async () => {
    nextStep();

    const response = await fetch("/api/story-generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ words }),
    });

    if (!response.ok) {
      console.error("Failed to generate story");
      console.error(response);
      return;
    }
    
    const story = await response.text();
    const storyElement = document?.getElementById("generated-story");
    if (storyElement) {
      storyElement.innerHTML = story;
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
              <div className="flex flex-row items-center gap-2">
                <TransitionButton
                  onClick={handleRemoveWord}
                >
                  Remove word
                </TransitionButton>
                <TransitionButton
                  onClick={() =>
                    setWords([...words, { description: "", word: "" }])
                  }
                >
                  Add Word
                </TransitionButton>
              </div>
            </div>
            <div className="flex flex-row gap-2">
              <TransitionButton onClick={prevStep}>Back</TransitionButton>
              <TransitionButton onClick={handleGenerate}>Generate</TransitionButton>
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-col align-center justify-center text-center gap-2">
            <h2>Your Story</h2>
            <div id="generated-story"></div>
            <TransitionButton onClick={() => setStep(0)}>
              Start Over
            </TransitionButton>
          </div>
        )}
      </motion.div>
    </div>
  );
}
