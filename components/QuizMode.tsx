"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
  difficulty: string;
}

interface QuizModeProps {
  topic: string;
  levels: { level: number; content: string }[];
  onClose: () => void;
}

type QuizState = "loading" | "intro" | "question" | "result" | "complete";

export default function QuizMode({ topic, levels, onClose }: QuizModeProps) {
  const [quizState, setQuizState] = useState<QuizState>("loading");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<AudioContext | null>(null);

  // Generate quiz questions locally from content
  useEffect(() => {
    try {
      const generated = generateQuizFromContent(topic, levels);
      if (generated.length > 0) {
        setQuestions(generated);
        setAnswers(new Array(generated.length).fill(null));
        // Small delay for the loading animation
        setTimeout(() => setQuizState("intro"), 2000);
      } else {
        setError("Could not generate questions from content");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quiz generation failed");
    }
  }, [topic, levels]);

  // Synth beep sound
  const playBeep = useCallback((freq: number, duration: number) => {
    try {
      if (!audioRef.current) {
        audioRef.current = new AudioContext();
      }
      const ctx = audioRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + duration);
    } catch {
      // Audio not available
    }
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      if (revealed) return;
      setSelected(index);
      playBeep(600, 0.1);
    },
    [revealed, playBeep]
  );

  const handleConfirm = useCallback(() => {
    if (selected === null) return;
    setRevealed(true);
    const isCorrect = selected === questions[currentQ].correct;
    if (isCorrect) {
      setScore((s) => s + 1);
      playBeep(880, 0.3);
    } else {
      playBeep(220, 0.4);
    }
    setAnswers((prev) => {
      const next = [...prev];
      next[currentQ] = selected;
      return next;
    });
  }, [selected, questions, currentQ, playBeep]);

  const handleNext = useCallback(() => {
    if (currentQ < questions.length - 1) {
      setCurrentQ((q) => q + 1);
      setSelected(null);
      setRevealed(false);
      playBeep(500, 0.08);
    } else {
      setQuizState("complete");
      playBeep(1200, 0.5);
    }
  }, [currentQ, questions.length, playBeep]);

  const startQuiz = useCallback(() => {
    setQuizState("question");
    playBeep(700, 0.15);
  }, [playBeep]);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (quizState === "intro" && e.key === "Enter") {
        startQuiz();
        return;
      }
      if (quizState !== "question") return;
      if (e.key >= "1" && e.key <= "4") {
        handleSelect(parseInt(e.key) - 1);
      }
      if (e.key === "Enter" && !revealed && selected !== null) {
        handleConfirm();
      }
      if (e.key === "Enter" && revealed) {
        handleNext();
      }
      if (e.key === "Escape") {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [quizState, revealed, selected, handleSelect, handleConfirm, handleNext, startQuiz, onClose]);

  if (error) {
    return (
      <QuizOverlay onClose={onClose}>
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">⚠ SYSTEM ERROR</div>
          <p className="text-white/50 font-mono text-sm">{error}</p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2 border border-white/20 text-white/60 rounded-lg hover:bg-white/5 font-mono text-sm"
          >
            RETURN
          </button>
        </div>
      </QuizOverlay>
    );
  }

  return (
    <QuizOverlay onClose={onClose}>
      <AnimatePresence mode="wait">
        {quizState === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <LoadingSequence />
          </motion.div>
        )}

        {quizState === "intro" && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-md mx-auto"
          >
            <HolographicBadge />
            <h2 className="font-mono text-2xl text-cyan-400 mt-6 mb-2 tracking-wider">
              KNOWLEDGE SCAN
            </h2>
            <p className="text-white/40 font-mono text-sm mb-2">
              TOPIC: <span className="text-cyan-300">{topic.toUpperCase()}</span>
            </p>
            <p className="text-white/30 font-mono text-xs mb-8">
              {questions.length} QUESTIONS • {levels.length} LEVELS ANALYZED
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {["RECALL", "COMPREHENSION", "MASTERY"].map((label, i) => (
                <div
                  key={label}
                  className="border border-cyan-500/20 rounded-lg p-3 bg-cyan-500/5"
                >
                  <div className="text-cyan-400/60 text-[10px] font-mono tracking-wider">
                    {label}
                  </div>
                  <div className="text-cyan-300 font-mono text-lg mt-1">
                    {i === 0 ? "2" : i === 1 ? "2" : "1"}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={startQuiz}
              className="group relative px-10 py-4 font-mono text-sm tracking-[0.3em] text-cyan-300 overflow-hidden rounded-lg"
            >
              <div className="absolute inset-0 border border-cyan-500/40 rounded-lg" />
              <div className="absolute inset-0 bg-cyan-500/5 group-hover:bg-cyan-500/10 transition-colors" />
              <motion.div
                className="absolute inset-0 rounded-lg"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(6,182,212,0.1)",
                    "0 0 40px rgba(6,182,212,0.2)",
                    "0 0 20px rgba(6,182,212,0.1)",
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="relative z-10">INITIATE SCAN</span>
            </button>
            <p className="text-white/20 font-mono text-[10px] mt-4">
              PRESS ENTER TO BEGIN
            </p>
          </motion.div>
        )}

        {quizState === "question" && questions[currentQ] && (
          <motion.div
            key={`q-${currentQ}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-2xl mx-auto"
          >
            {/* Progress bar */}
            <div className="flex items-center gap-3 mb-8">
              <span className="text-cyan-500/60 font-mono text-[10px] tracking-wider">
                SCAN PROGRESS
              </span>
              <div className="flex-1 h-0.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
                  animate={{
                    width: `${((currentQ + 1) / questions.length) * 100}%`,
                  }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <span className="text-cyan-400 font-mono text-xs">
                {currentQ + 1}/{questions.length}
              </span>
            </div>

            {/* Difficulty badge */}
            <div className="flex items-center gap-2 mb-4">
              <DifficultyBadge difficulty={questions[currentQ].difficulty} />
              <span className="text-white/20 font-mono text-[10px]">
                Q{currentQ + 1}
              </span>
            </div>

            {/* Question */}
            <h3 className="text-xl text-white font-serif mb-8 leading-relaxed">
              {questions[currentQ].question}
            </h3>

            {/* Options */}
            <div className="space-y-3">
              {questions[currentQ].options.map((option, i) => {
                const isCorrect = i === questions[currentQ].correct;
                const isSelected = i === selected;
                let borderColor = "border-white/10";
                let bgColor = "bg-white/[0.02]";
                let textColor = "text-white/70";
                let glowColor = "";

                if (revealed) {
                  if (isCorrect) {
                    borderColor = "border-emerald-500/60";
                    bgColor = "bg-emerald-500/10";
                    textColor = "text-emerald-300";
                    glowColor = "shadow-[0_0_20px_rgba(16,185,129,0.15)]";
                  } else if (isSelected && !isCorrect) {
                    borderColor = "border-red-500/60";
                    bgColor = "bg-red-500/10";
                    textColor = "text-red-300";
                    glowColor = "shadow-[0_0_20px_rgba(239,68,68,0.15)]";
                  } else {
                    textColor = "text-white/30";
                  }
                } else if (isSelected) {
                  borderColor = "border-cyan-500/60";
                  bgColor = "bg-cyan-500/10";
                  textColor = "text-cyan-200";
                  glowColor = "shadow-[0_0_20px_rgba(6,182,212,0.15)]";
                }

                return (
                  <motion.button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={revealed}
                    className={`w-full text-left px-5 py-4 rounded-xl border ${borderColor} ${bgColor} ${textColor} ${glowColor} transition-all duration-300 flex items-center gap-4 group disabled:cursor-default`}
                    whileHover={!revealed ? { scale: 1.01 } : {}}
                    whileTap={!revealed ? { scale: 0.99 } : {}}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg border ${
                        isSelected && !revealed
                          ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                          : revealed && isCorrect
                            ? "border-emerald-500 bg-emerald-500/20 text-emerald-300"
                            : revealed && isSelected
                              ? "border-red-500 bg-red-500/20 text-red-300"
                              : "border-white/10 text-white/30"
                      } flex items-center justify-center font-mono text-sm shrink-0 transition-all duration-300`}
                    >
                      {revealed && isCorrect
                        ? "✓"
                        : revealed && isSelected
                          ? "✗"
                          : i + 1}
                    </span>
                    <span className="font-serif text-[15px]">{option}</span>
                  </motion.button>
                );
              })}
            </div>

            {/* Explanation (after reveal) */}
            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-6 overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[10px] font-mono text-cyan-500/60 tracking-wider mb-2">
                      ANALYSIS
                    </div>
                    <p className="text-white/60 text-sm font-serif leading-relaxed">
                      {questions[currentQ].explanation}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="mt-8 flex justify-end gap-3">
              {!revealed ? (
                <button
                  onClick={handleConfirm}
                  disabled={selected === null}
                  className="px-8 py-3 font-mono text-sm tracking-wider rounded-lg border border-cyan-500/40 text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
                >
                  CONFIRM
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-8 py-3 font-mono text-sm tracking-wider rounded-lg border border-cyan-500/40 text-cyan-300 bg-cyan-500/5 hover:bg-cyan-500/10 transition-all"
                >
                  {currentQ < questions.length - 1
                    ? "NEXT →"
                    : "VIEW RESULTS"}
                </button>
              )}
            </div>

            <p className="text-white/15 font-mono text-[10px] mt-4 text-right">
              KEYS: 1-4 SELECT • ENTER CONFIRM • ESC EXIT
            </p>
          </motion.div>
        )}

        {quizState === "complete" && (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center max-w-lg mx-auto"
          >
            <ScoreDisplay score={score} total={questions.length} />

            {/* Question breakdown */}
            <div className="mt-8 space-y-2">
              {questions.map((q, i) => {
                const wasCorrect = answers[i] === q.correct;
                return (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                      wasCorrect
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-red-500/20 bg-red-500/5"
                    }`}
                  >
                    <span
                      className={`text-sm font-mono ${wasCorrect ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {wasCorrect ? "✓" : "✗"}
                    </span>
                    <span className="text-white/50 text-sm font-serif text-left flex-1 line-clamp-1">
                      {q.question}
                    </span>
                    <DifficultyBadge difficulty={q.difficulty} />
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center gap-4">
              <button
                onClick={onClose}
                className="px-8 py-3 font-mono text-sm tracking-wider rounded-lg border border-white/10 text-white/40 hover:text-white/60 hover:bg-white/5 transition-all"
              >
                RETURN
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </QuizOverlay>
  );
}

// ---- Local Quiz Generator ----

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

interface ExtractedFact {
  term: string;
  description: string; // short summary of what it is/does
  context: string; // the original sentence for explanation
}

interface NumberFact {
  question: string;
  correct: string;
  wrongs: string[];
  explanation: string;
}

function extractFacts(
  allContent: string,
  boldTerms: string[],
  sentences: string[]
): ExtractedFact[] {
  const facts: ExtractedFact[] = [];
  const usedDescriptions = new Set<string>();

  for (const term of boldTerms) {
    // Find the sentence that best defines this term
    const defSentence = sentences.find((s) => {
      const lower = s.toLowerCase();
      const tLower = term.toLowerCase();
      return (
        lower.includes(tLower) &&
        (lower.includes(" is ") ||
          lower.includes(" are ") ||
          lower.includes(" means ") ||
          lower.includes(" refers to ") ||
          lower.includes(" called ") ||
          lower.includes(" allows ") ||
          lower.includes(" uses ") ||
          lower.includes(" works "))
      );
    });

    if (defSentence) {
      const lower = defSentence.toLowerCase();
      const tLower = term.toLowerCase();
      let desc = "";

      // Try to grab the part after "is/are/means" — just the key phrase
      for (const verb of [" is ", " are ", " means ", " refers to "]) {
        const idx = lower.indexOf(verb);
        if (idx !== -1 && lower.indexOf(tLower) < idx) {
          let raw = defSentence.substring(idx + verb.length).trim();
          // Cut at first comma, semicolon or "which/where/that" to keep it short
          const cutMatch = raw.match(/^(.+?)\s*[,;]\s*(which|where|that|and|but|so|because|when)/i);
          if (cutMatch && cutMatch[1].length > 10) {
            raw = cutMatch[1].trim();
          } else {
            // Just cut at first comma or after ~45 chars
            const commaIdx = raw.indexOf(",");
            if (commaIdx > 10 && commaIdx < 50) {
              raw = raw.substring(0, commaIdx).trim();
            } else if (raw.length > 50) {
              const spaceIdx = raw.lastIndexOf(" ", 47);
              raw = raw.substring(0, spaceIdx > 15 ? spaceIdx : 47);
            }
          }
          desc = raw;
          break;
        }
      }

      // Fallback: build a short description from context
      if (!desc || desc.length < 5) {
        // Try to find what the term does: "[term] ... verb ... object"
        const verbMatch = defSentence.match(
          new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+(?:is|are|was|can|could|will|helps?|allows?|works?|uses?)\\s+(.+)", "i")
        );
        if (verbMatch) {
          let raw = verbMatch[1].trim();
          const commaIdx = raw.indexOf(",");
          if (commaIdx > 8 && commaIdx < 50) raw = raw.substring(0, commaIdx);
          else if (raw.length > 50) {
            const sp = raw.lastIndexOf(" ", 47);
            raw = raw.substring(0, sp > 15 ? sp : 47);
          }
          // Clean trailing small words
          raw = raw
            .replace(/\s+(and|or|the|a|an|of|in|to|for|with|by|from|on|at|is|are|was|that|which|who|it)\s*$/i, "")
            .replace(/\s+\S{0,3}$/, "")
            .replace(/[,;:\s]+$/, "")
            .trim();
          desc = raw;
        }
      }

      if (!desc || desc.length < 8) continue;

      // Remove trailing partial words, conjunctions, prepositions, articles
      desc = desc
        .replace(/\s+(and|or|the|a|an|of|in|to|for|with|by|from|on|at|is|are|was|that|which|who|it)\s*$/i, "")
        .replace(/\s+\S{0,3}$/, "")
        .replace(/[,;:\s]+$/, "")
        .trim();

      // If still too short after cleanup, skip
      if (desc.length < 8) continue;

      // Capitalize first letter, ensure no trailing period
      desc = desc.charAt(0).toUpperCase() + desc.slice(1);
      desc = desc.replace(/\.+$/, "");

      // Skip duplicates
      if (usedDescriptions.has(desc.toLowerCase())) continue;
      usedDescriptions.add(desc.toLowerCase());

      facts.push({ term, description: desc, context: defSentence });
    }
  }

  return facts;
}

function extractNumbers(sentences: string[], topic: string): NumberFact[] {
  const numberFacts: NumberFact[] = [];
  const numRegex = /(\d[\d,.]*)\s*(percent|%|ghz|mhz|hz|km|miles|meters|degrees|years|billion|million|thousand|watts|volts|mph|m\/s|bits|bytes|gb|mb|kb)/i;

  for (const sent of sentences) {
    const match = sent.match(numRegex);
    if (!match) continue;

    const value = match[1];
    const unit = match[2].toLowerCase();
    const num = parseFloat(value.replace(/,/g, ""));
    if (isNaN(num)) continue;

    // Generate plausible wrong numbers
    const wrongs: string[] = [];
    const multipliers = [0.1, 0.5, 2, 5, 10, 0.01];
    for (const m of shuffle(multipliers)) {
      const wrong = num * m;
      const wrongStr =
        wrong >= 1000
          ? wrong.toLocaleString()
          : wrong % 1 === 0
            ? wrong.toString()
            : wrong.toFixed(1);
      if (wrongStr !== value && !wrongs.includes(wrongStr)) {
        wrongs.push(wrongStr + " " + unit);
      }
      if (wrongs.length >= 3) break;
    }

    if (wrongs.length >= 3) {
      // Build a clean question from the sentence
      const cleanSent = sent.replace(/\*\*/g, "").replace(/[#*_`]/g, "").trim();
      numberFacts.push({
        question: cleanSent,
        correct: value + " " + unit,
        wrongs: wrongs.slice(0, 3),
        explanation: cleanSent,
      });
    }
  }

  return numberFacts;
}

function generateQuizFromContent(
  topic: string,
  levels: { level: number; content: string }[]
): QuizQuestion[] {
  const allContent = levels.map((l) => l.content).join("\n\n");

  // Extract bold terms
  const boldTerms: string[] = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;
  while ((match = boldRegex.exec(allContent)) !== null) {
    const term = match[1].trim();
    if (term.length > 2 && term.length < 50 && !boldTerms.includes(term)) {
      boldTerms.push(term);
    }
  }

  // Extract clean sentences
  const sentences = allContent
    .split(/[.!?]+/)
    .map((s) => s.replace(/\*\*/g, "").replace(/[#*_`\n]/g, " ").replace(/\s+/g, " ").trim())
    .filter((s) => s.length > 25 && s.length < 200);

  const questions: QuizQuestion[] = [];
  const usedTerms = new Set<string>();

  // --- Extract structured facts from content ---
  const facts = extractFacts(allContent, boldTerms, sentences);
  const numberFacts = extractNumbers(sentences, topic);

  // === STRATEGY 1: "What is [term]?" with SHORT original answers ===
  for (const fact of shuffle(facts).slice(0, 3)) {
    if (usedTerms.has(fact.term)) continue;
    usedTerms.add(fact.term);

    // Get other terms' descriptions as wrong answers (must be unique)
    const otherFacts = facts.filter(
      (f) =>
        f.term !== fact.term &&
        f.description.toLowerCase() !== fact.description.toLowerCase()
    );

    const genericWrongs = [
      `A type of chemical reaction`,
      `A unit of measurement`,
      `A mathematical formula`,
      `A physical law of nature`,
      `An outdated scientific theory`,
      `A method of energy storage`,
      `A form of electromagnetic radiation`,
      `A classification system`,
      `A biological process in cells`,
      `A property of sound waves`,
      `A type of molecular bond`,
      `A method of data compression`,
    ];

    // Build unique wrong answers: prefer other facts, fill with generics
    const wrongSet = new Set<string>();
    for (const f of shuffle(otherFacts)) {
      if (wrongSet.size >= 3) break;
      if (!wrongSet.has(f.description)) wrongSet.add(f.description);
    }
    for (const g of shuffle(genericWrongs)) {
      if (wrongSet.size >= 3) break;
      if (!wrongSet.has(g)) wrongSet.add(g);
    }
    const wrongAnswers = Array.from(wrongSet).slice(0, 3);
    if (wrongAnswers.length < 3) continue;

    const options = shuffle([fact.description, ...wrongAnswers]);
    questions.push({
      question: `What is "${fact.term}"?`,
      options,
      correct: options.indexOf(fact.description),
      explanation: `${fact.term} — ${fact.description.toLowerCase()}`,
      difficulty: "easy",
    });
  }

  // === STRATEGY 2: Number/value recall ===
  for (const nf of shuffle(numberFacts).slice(0, 1)) {
    // Build a short question about the number
    const options = shuffle([nf.correct, ...nf.wrongs]);
    questions.push({
      question: `According to the lesson, what is the correct value?`,
      options,
      correct: options.indexOf(nf.correct),
      explanation: nf.explanation,
      difficulty: "medium",
    });
  }

  // === STRATEGY 3: Fill in the blank (term name) ===
  const unusedTermFacts = facts.filter((f) => !usedTerms.has(f.term));
  for (const fact of shuffle(unusedTermFacts).slice(0, 2)) {
    usedTerms.add(fact.term);

    // Get other bold terms as wrong answers
    const otherTerms = boldTerms.filter(
      (t) => t.toLowerCase() !== fact.term.toLowerCase()
    );

    let wrongTerms = pickRandom(otherTerms, 3);

    // Pad with generic terms if needed
    if (wrongTerms.length < 3) {
      const generics = [
        "Photon", "Entropy", "Catalyst", "Inertia", "Amplitude",
        "Frequency", "Resonance", "Diffusion", "Kinetics", "Polarity",
      ].filter((g) => !boldTerms.some((b) => b.toLowerCase() === g.toLowerCase()));
      wrongTerms = [
        ...wrongTerms,
        ...pickRandom(generics, 3 - wrongTerms.length),
      ];
    }

    const options = shuffle([fact.term, ...wrongTerms.slice(0, 3)]);
    questions.push({
      question: `Which term matches this description: "${fact.description}"?`,
      options,
      correct: options.indexOf(fact.term),
      explanation: `The answer is "${fact.term}"`,
      difficulty: "medium",
    });
  }

  // === STRATEGY 4: True or False ===
  if (facts.length > 0 && questions.length < 5) {
    const fact = shuffle(facts)[0];
    const correctStatement = `${fact.term} — ${fact.description.charAt(0).toLowerCase()}${fact.description.slice(1)}`;

    // Create a false statement by swapping with another term
    const otherFact = facts.find((f) => f.term !== fact.term);
    const falseStatement = otherFact
      ? `${fact.term} — ${otherFact.description.charAt(0).toLowerCase()}${otherFact.description.slice(1)}`
      : `${fact.term} — an obsolete concept no longer used`;

    const options = shuffle([
      "True",
      "False",
      "Partially true",
      "Not mentioned in the lesson",
    ]);

    questions.push({
      question: `True or False: "${correctStatement}"`,
      options,
      correct: options.indexOf("True"),
      explanation: `This is correct — ${fact.term} is described this way in the lesson.`,
      difficulty: "easy",
    });
  }

  // Ensure minimum 3 questions with fallback
  if (questions.length < 3 && boldTerms.length >= 2) {
    const term = shuffle(boldTerms.filter((t) => !usedTerms.has(t)))[0] || boldTerms[0];
    const others = boldTerms.filter((t) => t !== term);
    const wrongTerms = [
      ...pickRandom(others, Math.min(others.length, 3)),
      ...pickRandom(["Fusion", "Quantum", "Entropy", "Vector"], 3),
    ].slice(0, 3);

    const options = shuffle([term, ...wrongTerms]);
    questions.push({
      question: `Which of these is a key concept discussed in the lesson about ${topic}?`,
      options,
      correct: options.indexOf(term),
      explanation: `"${term}" is one of the key concepts covered in the lesson.`,
      difficulty: "easy",
    });
  }

  return shuffle(questions).slice(0, 5);
}

// ---- Sub-components ----

function QuizOverlay({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-[#050a18]/95 backdrop-blur-xl"
        onClick={onClose}
      />

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.15) 2px, rgba(6,182,212,0.15) 4px)",
        }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(6,182,212,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(6,182,212,0.3) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Corner brackets */}
      <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-cyan-500/30" />
      <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-cyan-500/30" />
      <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-cyan-500/30" />
      <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-cyan-500/30" />

      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto px-2 py-8 scrollbar-hide">
        {children}
      </div>
    </motion.div>
  );
}

function LoadingSequence() {
  const [line, setLine] = useState(0);
  const lines = [
    "INITIALIZING NEURAL SCAN...",
    "ANALYZING KNOWLEDGE DEPTH...",
    "COMPILING ASSESSMENT MATRIX...",
    "GENERATING QUESTIONS...",
    "CALIBRATING DIFFICULTY...",
  ];

  useEffect(() => {
    if (line < lines.length - 1) {
      const timer = setTimeout(() => setLine((l) => l + 1), 600);
      return () => clearTimeout(timer);
    }
  }, [line, lines.length]);

  return (
    <div className="font-mono text-sm space-y-2">
      {lines.slice(0, line + 1).map((text, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: i === line ? 1 : 0.3, x: 0 }}
          className="flex items-center gap-3"
        >
          <span className={i === line ? "text-cyan-400" : "text-cyan-700"}>
            {i < line ? "✓" : "▸"}
          </span>
          <span className={i === line ? "text-cyan-300" : "text-cyan-700"}>
            {text}
          </span>
          {i === line && (
            <motion.span
              className="inline-block w-2 h-4 bg-cyan-400"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
        </motion.div>
      ))}
    </div>
  );
}

function HolographicBadge() {
  return (
    <motion.div
      className="relative w-24 h-24 mx-auto"
      animate={{ rotateY: [0, 360] }}
      transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
    >
      <div className="absolute inset-0 rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-purple-500/10" />
      <div className="absolute inset-2 rounded-xl border border-cyan-500/20 flex items-center justify-center">
        <span className="text-4xl">🧠</span>
      </div>
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={{
          boxShadow: [
            "0 0 20px rgba(6,182,212,0.1)",
            "0 0 40px rgba(6,182,212,0.2)",
            "0 0 20px rgba(6,182,212,0.1)",
          ],
        }}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </motion.div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const config = {
    easy: { label: "EASY", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/5" },
    medium: { label: "MED", color: "text-amber-400 border-amber-500/30 bg-amber-500/5" },
    hard: { label: "HARD", color: "text-red-400 border-red-500/30 bg-red-500/5" },
  }[difficulty] || { label: "?", color: "text-white/30 border-white/10 bg-white/5" };

  return (
    <span
      className={`px-2 py-0.5 rounded border font-mono text-[9px] tracking-wider ${config.color}`}
    >
      {config.label}
    </span>
  );
}

function ScoreDisplay({ score, total }: { score: number; total: number }) {
  const percentage = Math.round((score / total) * 100);
  const grade =
    percentage >= 80
      ? { label: "EXCEPTIONAL", color: "text-emerald-400", glow: "rgba(16,185,129,0.3)" }
      : percentage >= 60
        ? { label: "PROFICIENT", color: "text-cyan-400", glow: "rgba(6,182,212,0.3)" }
        : percentage >= 40
          ? { label: "DEVELOPING", color: "text-amber-400", glow: "rgba(245,158,11,0.3)" }
          : { label: "NOVICE", color: "text-red-400", glow: "rgba(239,68,68,0.3)" };

  return (
    <div>
      <div className="text-[10px] font-mono text-cyan-500/60 tracking-[0.4em] mb-4">
        SCAN COMPLETE
      </div>
      <motion.div
        className="relative w-32 h-32 mx-auto mb-4"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
      >
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="4"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            fill="none"
            stroke="url(#scoreGradient)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 52}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
            animate={{
              strokeDashoffset: 2 * Math.PI * 52 * (1 - score / total),
            }}
            transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-mono text-3xl text-white font-bold"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {score}/{total}
          </motion.span>
        </div>
      </motion.div>

      <motion.div
        className={`font-mono text-xl tracking-[0.3em] ${grade.color}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
        style={{ textShadow: `0 0 20px ${grade.glow}` }}
      >
        {grade.label}
      </motion.div>

      <motion.div
        className="text-white/30 font-mono text-sm mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        {percentage}% ACCURACY
      </motion.div>
    </div>
  );
}
