"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Types ─── */
type SoundType = "pop" | "chime" | "levelUp" | "whoosh" | "complete";

interface CelebrationContextType {
  showXPToast: (amount: number, label?: string) => void;
  fireConfetti: () => void;
  playSound: (type: SoundType) => void;
  celebrate: (opts: { xp?: number; confetti?: boolean; sound?: SoundType }) => void;
  muted: boolean;
  toggleMute: () => void;
}

const CelebrationContext = createContext<CelebrationContextType | null>(null);

export function useCelebration() {
  const ctx = useContext(CelebrationContext);
  if (!ctx) throw new Error("useCelebration must be inside CelebrationProvider");
  return ctx;
}

/* ─── Sound synthesis ─── */
function createSound(ctx: AudioContext, type: SoundType) {
  const now = ctx.currentTime;

  if (type === "pop") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.08);
    osc.type = "sine";
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  if (type === "chime") {
    [880, 1100, 1320].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = now + i * 0.08;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.08, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
      osc.start(t);
      osc.stop(t + 0.3);
    });
  }

  if (type === "levelUp") {
    [523, 659, 784, 1047].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "triangle";
      const t = now + i * 0.12;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  if (type === "whoosh") {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(2000, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  if (type === "complete") {
    [659, 784, 988, 1319].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = "sine";
      const t = now + i * 0.1;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  }
}

/* ─── Confetti particle ─── */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  shape: "rect" | "circle";
}

const CONFETTI_COLORS = [
  "#4ade80", "#fbbf24", "#f472b6", "#60a5fa", "#a78bfa",
  "#34d399", "#fb923c", "#f43f5e", "#38bdf8", "#c084fc",
];

function spawnParticles(): Particle[] {
  const particles: Particle[] = [];
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight * 0.35;

  for (let i = 0; i < 80; i++) {
    const angle = (Math.random() * Math.PI * 2);
    const speed = 4 + Math.random() * 8;
    particles.push({
      x: cx + (Math.random() - 0.5) * 60,
      y: cy + (Math.random() - 0.5) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 4 + Math.random() * 6,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 15,
      life: 0,
      maxLife: 60 + Math.random() * 40,
      shape: Math.random() > 0.5 ? "rect" : "circle",
    });
  }
  return particles;
}

/* ─── Provider ─── */
export default function CelebrationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; amount: number; label?: string }[]>([]);
  const [confettiActive, setConfettiActive] = useState(false);
  const [muted, setMuted] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const toastIdRef = useRef(0);

  // Load mute preference
  useEffect(() => {
    const saved = localStorage.getItem("tmi10_muted");
    if (saved === "true") setMuted(true);
  }, []);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      localStorage.setItem("tmi10_muted", String(next));
      return next;
    });
  }, []);

  const playSound = useCallback(
    (type: SoundType) => {
      if (muted) return;
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === "suspended") {
          audioCtxRef.current.resume();
        }
        createSound(audioCtxRef.current, type);
      } catch {
        // Audio not available
      }
    },
    [muted]
  );

  const showXPToast = useCallback((amount: number, label?: string) => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, amount, label }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2200);
  }, []);

  // Confetti canvas animation
  const animateConfetti = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;

      for (const p of particlesRef.current) {
        p.life++;
        if (p.life > p.maxLife) continue;
        alive++;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gravity
        p.vx *= 0.99; // drag
        p.rotation += p.rotationSpeed;

        const alpha = 1 - p.life / p.maxLife;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      if (alive > 0) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setConfettiActive(false);
      }
    };

    animate();
  }, []);

  const fireConfetti = useCallback(() => {
    particlesRef.current = spawnParticles();
    setConfettiActive(true);
    cancelAnimationFrame(animFrameRef.current);
    // Small delay to ensure canvas is mounted
    requestAnimationFrame(() => animateConfetti());
  }, [animateConfetti]);

  const celebrate = useCallback(
    (opts: { xp?: number; confetti?: boolean; sound?: SoundType }) => {
      if (opts.xp) showXPToast(opts.xp);
      if (opts.confetti) fireConfetti();
      if (opts.sound) playSound(opts.sound);
    },
    [showXPToast, fireConfetti, playSound]
  );

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <CelebrationContext.Provider
      value={{ showXPToast, fireConfetti, playSound, celebrate, muted, toggleMute }}
    >
      {children}

      {/* ─── XP Toast overlay ─── */}
      <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              className="absolute flex flex-col items-center"
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -60 }}
              transition={{ type: "spring", stiffness: 400, damping: 15 }}
            >
              {/* Glow background */}
              <div className="absolute w-32 h-32 rounded-full bg-emerald-400/20 blur-3xl" />
              <div className="relative">
                <span className="text-5xl sm:text-6xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-300 via-emerald-400 to-cyan-400 drop-shadow-[0_0_30px_rgba(52,211,153,0.4)]">
                  +{toast.amount}
                </span>
                <span className="block text-center text-emerald-300/80 text-sm font-mono tracking-widest mt-1">
                  {toast.label || "XP"}
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ─── Confetti canvas ─── */}
      {confettiActive && (
        <canvas
          ref={canvasRef}
          className="fixed inset-0 pointer-events-none z-[99]"
          style={{ width: "100vw", height: "100vh" }}
        />
      )}
    </CelebrationContext.Provider>
  );
}
