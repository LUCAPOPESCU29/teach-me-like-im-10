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

function generateQuizFromContent(
  topic: string,
  levels: { level: number; content: string }[]
): QuizQuestion[] {
  const allContent = levels.map((l) => l.content).join("\n\n");

  // Extract bold terms (between ** or within <strong> from markdown)
  const boldTerms: string[] = [];
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;
  while ((match = boldRegex.exec(allContent)) !== null) {
    const term = match[1].trim();
    if (term.length > 2 && term.length < 60 && !boldTerms.includes(term)) {
      boldTerms.push(term);
    }
  }

  // Extract sentences that contain key information
  const sentences = allContent
    .replace(/\*\*/g, "")
    .replace(/[#*_`]/g, "")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 30 && s.length < 200);

  // Shuffle helper
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const questions: QuizQuestion[] = [];
  const usedSentences = new Set<number>();

  // --- Strategy 1: "What is [bold term]?" definition questions ---
  const definitionSentences = sentences.filter((s) =>
    boldTerms.some(
      (t) =>
        s.toLowerCase().includes(t.toLowerCase()) &&
        (s.toLowerCase().includes(" is ") ||
          s.toLowerCase().includes(" are ") ||
          s.toLowerCase().includes(" means ") ||
          s.toLowerCase().includes(" refers to ") ||
          s.toLowerCase().includes(" called "))
    )
  );

  for (const sent of shuffle(definitionSentences).slice(0, 2)) {
    const term = boldTerms.find((t) =>
      sent.toLowerCase().includes(t.toLowerCase())
    );
    if (!term) continue;

    const idx = sentences.indexOf(sent);
    if (usedSentences.has(idx)) continue;
    usedSentences.add(idx);

    // Build plausible wrong answers
    const wrongOptions = generateWrongOptions(sent, topic, sentences, 3);
    const correctOption = trimToOption(sent);
    if (!correctOption || wrongOptions.length < 3) continue;

    const options = shuffle([correctOption, ...wrongOptions]);
    questions.push({
      question: `Based on what you learned, which statement about "${term}" is correct?`,
      options,
      correct: options.indexOf(correctOption),
      explanation: sent,
      difficulty: "easy",
    });
  }

  // --- Strategy 2: True/False style (which is true about [topic]) ---
  const factSentences = shuffle(
    sentences.filter((s, i) => !usedSentences.has(i) && s.length > 40)
  );

  for (const sent of factSentences.slice(0, 2)) {
    const idx = sentences.indexOf(sent);
    if (usedSentences.has(idx)) continue;
    usedSentences.add(idx);

    const correctOption = trimToOption(sent);
    const wrongOptions = generateWrongOptions(sent, topic, sentences, 3);
    if (!correctOption || wrongOptions.length < 3) continue;

    const options = shuffle([correctOption, ...wrongOptions]);
    questions.push({
      question: `Which of the following is true about ${topic.toLowerCase()}?`,
      options,
      correct: options.indexOf(correctOption),
      explanation: sent,
      difficulty: "medium",
    });
  }

  // --- Strategy 3: Fill-in-the-blank (harder) ---
  const longerSentences = shuffle(
    sentences.filter(
      (s, i) =>
        !usedSentences.has(i) &&
        s.length > 50 &&
        boldTerms.some((t) => s.toLowerCase().includes(t.toLowerCase()))
    )
  );

  for (const sent of longerSentences.slice(0, 1)) {
    const term = boldTerms.find((t) =>
      sent.toLowerCase().includes(t.toLowerCase())
    );
    if (!term) continue;

    const blanked = sent.replace(new RegExp(term, "i"), "______");
    const wrongTerms = shuffle(
      boldTerms.filter((t) => t.toLowerCase() !== term.toLowerCase())
    ).slice(0, 3);

    if (wrongTerms.length < 3) {
      wrongTerms.push(
        ...["entropy", "fusion", "wavelength", "catalyst"].slice(
          0,
          3 - wrongTerms.length
        )
      );
    }

    const options = shuffle([term, ...wrongTerms.slice(0, 3)]);
    questions.push({
      question: `Fill in the blank: "${blanked}"`,
      options,
      correct: options.indexOf(term),
      explanation: sent,
      difficulty: "hard",
    });
  }

  // Ensure we have at least 3 questions, pad with topic-level questions
  if (questions.length < 3) {
    const remaining = sentences.filter((_, i) => !usedSentences.has(i));
    for (const sent of shuffle(remaining).slice(0, 5 - questions.length)) {
      const correctOption = trimToOption(sent);
      const wrongOptions = generateWrongOptions(sent, topic, sentences, 3);
      if (!correctOption || wrongOptions.length < 3) continue;

      const options = shuffle([correctOption, ...wrongOptions]);
      questions.push({
        question: `Which statement about ${topic.toLowerCase()} is accurate?`,
        options,
        correct: options.indexOf(correctOption),
        explanation: sent,
        difficulty: questions.length < 3 ? "easy" : "medium",
      });
    }
  }

  return shuffle(questions).slice(0, 5);
}

function trimToOption(sentence: string): string {
  let s = sentence.trim();
  if (s.length > 120) {
    s = s.substring(0, 117) + "...";
  }
  return s;
}

function generateWrongOptions(
  correctSentence: string,
  topic: string,
  allSentences: string[],
  count: number
): string[] {
  const wrong: string[] = [];
  const correctLower = correctSentence.toLowerCase();

  // Find sentences that are different enough from the correct one
  const candidates = allSentences
    .filter((s) => {
      const sLower = s.toLowerCase();
      // Must be different enough
      const overlap = sLower.split(" ").filter((w) => correctLower.includes(w)).length;
      const ratio = overlap / sLower.split(" ").length;
      return ratio < 0.5 && s !== correctSentence && s.length > 20;
    })
    .map((s) => trimToOption(s));

  // Add real sentences as plausible distractors
  for (const c of candidates) {
    if (wrong.length >= count) break;
    if (!wrong.includes(c)) wrong.push(c);
  }

  // If we still need more, generate negated/twisted versions
  const fillers = [
    `${topic} is not affected by external forces or interactions`,
    `This concept was disproven in recent scientific studies`,
    `${topic} only exists in theoretical models, not in reality`,
    `The opposite effect occurs under normal conditions`,
  ];

  for (const f of fillers) {
    if (wrong.length >= count) break;
    if (!wrong.includes(f)) wrong.push(f);
  }

  return wrong.slice(0, count);
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
