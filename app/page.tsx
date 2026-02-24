"use client";

import { motion } from "framer-motion";
import TopicInput from "@/components/TopicInput";
import ExampleTopics from "@/components/ExampleTopics";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        className="text-center mb-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="font-display text-5xl sm:text-7xl text-white mb-4 leading-tight">
          Teach Me
          <br />
          <span className="text-emerald-400">Like I&apos;m 10</span>
        </h1>
        <p className="text-white/40 text-lg sm:text-xl max-w-md mx-auto font-serif">
          Pick any topic. Start simple. Go as deep as you want.
        </p>
      </motion.div>

      <TopicInput />

      <motion.div
        className="mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <ExampleTopics />
      </motion.div>

      <footer className="fixed bottom-0 left-0 right-0 py-4 text-center">
        <p className="text-white/15 text-xs font-sans">Teach Me Like I&apos;m 10</p>
      </footer>
    </main>
  );
}
