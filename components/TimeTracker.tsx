"use client";

import { useEffect, useRef } from "react";

const STORAGE_KEY = "tmi10_learning_time";

interface LearningSession {
  date: string;
  minutes: number;
  topic: string;
}

interface LearningTimeData {
  sessions: LearningSession[];
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

function loadSessions(): LearningSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data: LearningTimeData = JSON.parse(raw);
    return data.sessions || [];
  } catch {
    return [];
  }
}

function saveSessions(sessions: LearningSession[]) {
  if (typeof window === "undefined") return;
  const data: LearningTimeData = { sessions };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function recordMinutes(topic: string, minutes: number) {
  if (minutes < 0.5) return; // ignore sub-30-second sessions
  const sessions = loadSessions();
  const today = getToday();
  const rounded = Math.round(minutes);
  if (rounded <= 0) return;

  // Merge into existing session for same topic+date, or create new
  const existing = sessions.find(
    (s) => s.date === today && s.topic === topic
  );
  if (existing) {
    existing.minutes += rounded;
  } else {
    sessions.push({ date: today, minutes: rounded, topic });
  }
  saveSessions(sessions);
}

export default function TimeTracker({ slug }: { slug: string }) {
  const startRef = useRef<number>(Date.now());
  const accumulatedRef = useRef<number>(0);

  useEffect(() => {
    startRef.current = Date.now();
    accumulatedRef.current = 0;

    function flushTime() {
      const elapsed = (Date.now() - startRef.current) / 60000; // minutes
      if (elapsed > 0.5) {
        recordMinutes(slug, elapsed + accumulatedRef.current);
        accumulatedRef.current = 0;
      }
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Page hidden — accumulate time and pause
        const elapsed = (Date.now() - startRef.current) / 60000;
        accumulatedRef.current += elapsed;
        startRef.current = Date.now();
      } else {
        // Page visible again — reset start
        startRef.current = Date.now();
      }
    }

    function handleBeforeUnload() {
      const elapsed = (Date.now() - startRef.current) / 60000;
      const total = elapsed + accumulatedRef.current;
      if (total >= 0.5) {
        recordMinutes(slug, total);
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      // Component unmount — record accumulated time
      const elapsed = (Date.now() - startRef.current) / 60000;
      const total = elapsed + accumulatedRef.current;
      if (total >= 0.5) {
        recordMinutes(slug, total);
      }

      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [slug]);

  // Periodic flush every 5 minutes to avoid losing long sessions
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 60000;
      const total = elapsed + accumulatedRef.current;
      if (total >= 1) {
        recordMinutes(slug, total);
        accumulatedRef.current = 0;
        startRef.current = Date.now();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [slug]);

  return null; // invisible tracker
}
