"use client";
import PageTransition from "@/components/PageTransition";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import TitleShowcase from "@/components/TitleShowcase";
import { useEarnedTitles, useActiveTitle, TitleBadge, TITLES } from "@/components/TitleFlair";

export default function TitlesPage() {
  const router = useRouter();
  const { earned } = useEarnedTitles();
  const [activeTitle] = useActiveTitle();

  return (
    <PageTransition>
    <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <button
          onClick={() => router.push("/")}
          className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-6 inline-block"
        >
          &larr; Home
        </button>
      </motion.div>

      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <span className="text-4xl block mb-3">{"\uD83C\uDFC5"}</span>
        <h1 className="font-display text-3xl text-white mb-2">Titles &amp; Flair</h1>
        <p className="text-white/30 font-sans text-sm max-w-md mx-auto">
          Earn titles by exploring topics, acing quizzes, and building streaks.
          Set your favorite as your active title to show on your profile.
        </p>

        {activeTitle && (
          <div className="flex justify-center mt-4">
            <TitleBadge title={activeTitle} size="lg" />
          </div>
        )}
      </motion.div>

      {/* Stats bar */}
      <motion.div
        className="flex items-center justify-center gap-6 mb-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
      >
        <div className="text-center">
          <p className="text-emerald-400 text-2xl font-mono font-bold">{earned.length}</p>
          <p className="text-white/30 text-xs font-sans">Earned</p>
        </div>
        <div className="w-px h-8 bg-white/10" />
        <div className="text-center">
          <p className="text-white/40 text-2xl font-mono font-bold">{TITLES.length}</p>
          <p className="text-white/30 text-xs font-sans">Total</p>
        </div>
      </motion.div>

      <motion.div
        className="p-5 rounded-2xl border border-white/10 bg-white/[0.02]"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <TitleShowcase />
      </motion.div>
    </main>
      </PageTransition>
  );
}
