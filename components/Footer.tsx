"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function useTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    const update = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    update();
    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return isDark;
}

const FOOTER_LINKS = {
  Learn: [
    { label: "How It Works", href: "/how-it-works" },
    { label: "Learning Paths", href: "/paths" },
    { label: "Flashcards", href: "/flashcards" },
    { label: "Library", href: "/library" },
  ],
  Practice: [
    { label: "Math Solver", href: "/math" },
    { label: "Code", href: "/code" },
    { label: "Quiz Battle", href: "/battle" },
    { label: "Daily Challenge", href: "/daily" },
  ],
  Account: [
    { label: "Progress", href: "/progress" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Sign In", href: "/auth/login" },
  ],
};

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const isDark = useTheme();

  // Hide on learn pages
  if (pathname.startsWith("/learn/")) return null;

  return (
    <footer
      className={`w-full border-t transition-colors duration-300 relative z-10 ${
        isDark
          ? "bg-[#070b14] border-white/[0.06]"
          : "bg-slate-50 border-black/[0.06]"
      }`}
    >
      <div className="max-w-5xl mx-auto px-6 py-12 sm:py-16">
        {/* Top: Logo + Links */}
        <div className="flex flex-col sm:flex-row gap-10 sm:gap-16">
          {/* Brand */}
          <div className="sm:max-w-[200px]">
            <button
              onClick={() => router.push("/")}
              className="font-display text-xl flex items-center gap-2 mb-3"
            >
              <span className="text-emerald-400">✦</span>
              <span className={isDark ? "text-white" : "text-slate-900"}>
                TM10
              </span>
            </button>
            <p
              className={`text-sm font-sans leading-relaxed ${
                isDark ? "text-white/45" : "text-slate-500"
              }`}
            >
              Pick any topic. Start simple. Go as deep as you want.
            </p>
          </div>

          {/* Link columns */}
          <div className="flex flex-1 flex-wrap gap-10 sm:gap-12">
            {Object.entries(FOOTER_LINKS).map(([category, links]) => (
              <div key={category} className="min-w-[120px]">
                <h4
                  className={`font-sans text-xs font-semibold uppercase tracking-wider mb-4 ${
                    isDark ? "text-white/40" : "text-slate-400"
                  }`}
                >
                  {category}
                </h4>
                <ul className="space-y-2.5">
                  {links.map((link) => (
                    <li key={link.href}>
                      <button
                        onClick={() => router.push(link.href)}
                        className={`font-sans text-sm transition-colors ${
                          isDark
                            ? "text-white/50 hover:text-white/80"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div
          className={`my-10 h-px ${
            isDark ? "bg-white/[0.04]" : "bg-black/[0.06]"
          }`}
        />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p
            className={`text-xs font-sans ${
              isDark ? "text-white/30" : "text-slate-400"
            }`}
          >
            &copy; {new Date().getFullYear()} Teach Me Like I&apos;m 10
          </p>
          <div className="flex items-center gap-5">
            <a
              href="https://github.com/LUCAPOPESCU29/teach-me-like-im-10"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-colors ${
                isDark
                  ? "text-white/35 hover:text-white/60"
                  : "text-slate-400 hover:text-slate-600"
              }`}
              aria-label="GitHub"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
