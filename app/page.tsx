"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import TopicInput from "@/components/TopicInput";
import ExampleTopics from "@/components/ExampleTopics";
import DailyChallenge from "@/components/DailyChallenge";
import FooterShowcase from "@/components/FooterShowcase";
import { useAuth } from "@/components/AuthProvider";
import type { LangCode } from "@/lib/utils";
import TiltCard from "@/components/TiltCard";
import SplitText from "@/components/SplitText";
import Aurora from "@/components/Aurora";

export default function Home() {
  const { data, isGuest } = useAuth();
  const router = useRouter();
  const [lang, setLang] = useState<LangCode>("en");

  useEffect(() => {
    const saved = data.getLang() as LangCode;
    if (saved) setLang(saved);
  }, [data]);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 pt-24 sm:pt-32 pb-4 relative overflow-hidden">
      {/* Aurora animated background */}
      <Aurora />

      {/* Hero section */}
      <motion.div
        className="text-center mb-12 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
      >
        {/* Level dots decoration */}
        <motion.div
          className="flex items-center justify-center gap-2 mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          {["#4ade80", "#fbbf24", "#f97316", "#f43f5e", "#a855f7"].map((color, i) => (
            <motion.div
              key={color}
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: color, opacity: 0.6 }}
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </motion.div>

        <h1 className="font-display text-5xl sm:text-7xl text-white mb-5 leading-tight" style={{ perspective: 600 }}>
          <SplitText text="Teach Me" delay={0.2} stagger={0.04} />
          <br />
          <SplitText
            text="Like I'm 10"
            delay={0.5}
            stagger={0.04}
            charClassName="text-emerald-400"
          />
        </h1>
        <p className="text-white/35 text-lg sm:text-xl max-w-lg mx-auto font-serif leading-relaxed">
          Pick any topic. Start simple. Go as deep as you want.
        </p>
        <motion.button
          onClick={() => router.push("/how-it-works")}
          className="mt-5 px-5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-white/[0.08] hover:border-white/[0.15] font-sans text-sm transition-all duration-300 inline-flex items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="text-base">&#x1F4BB;</span> How does it work?
        </motion.button>
      </motion.div>

      <TiltCard className="w-full max-w-xl" glareColor="rgba(52, 211, 153, 0.06)">
        <DailyChallenge />
      </TiltCard>

      <TopicInput lang={lang} />

      <motion.div
        className="mt-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <ExampleTopics />
      </motion.div>

      {/* Feature showcase carousel */}
      <FooterShowcase />

      {/* Brand footer */}
      <footer className="w-full py-6 sm:py-4 text-center pb-20 sm:pb-6">
        <p className="text-white/10 text-xs font-sans">
          Teach Me Like I&apos;m 10
          {isGuest && (
            <>
              {" · "}
              <button
                onClick={() => router.push("/auth/login")}
                className="text-white/20 hover:text-white/40 transition-colors underline"
              >
                Sign in to save progress
              </button>
            </>
          )}
        </p>
      </footer>
    </main>
  );
}
