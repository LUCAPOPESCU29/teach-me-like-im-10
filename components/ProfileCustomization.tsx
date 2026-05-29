"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ── Avatar options ──
const AVATARS = [
  // Animals
  { id: "🦊", category: "animals" },
  { id: "🐱", category: "animals" },
  { id: "🐶", category: "animals" },
  { id: "🦉", category: "animals" },
  { id: "🐼", category: "animals" },
  { id: "🦁", category: "animals" },
  { id: "🐸", category: "animals" },
  { id: "🐧", category: "animals" },
  { id: "🦋", category: "animals" },
  { id: "🐙", category: "animals" },
  // Space & Nature
  { id: "🌍", category: "nature" },
  { id: "🌙", category: "nature" },
  { id: "⭐", category: "nature" },
  { id: "🔥", category: "nature" },
  { id: "🌊", category: "nature" },
  { id: "🌸", category: "nature" },
  { id: "🍀", category: "nature" },
  { id: "❄️", category: "nature" },
  // Objects & Fun
  { id: "🎮", category: "fun" },
  { id: "🚀", category: "fun" },
  { id: "💎", category: "fun" },
  { id: "🎯", category: "fun" },
  { id: "⚡", category: "fun" },
  { id: "🧪", category: "fun" },
  { id: "🎨", category: "fun" },
  { id: "📚", category: "fun" },
  { id: "🏆", category: "fun" },
  { id: "🎵", category: "fun" },
  { id: "👾", category: "fun" },
  { id: "🤖", category: "fun" },
];

// ── Banner color presets ──
const BANNER_COLORS = [
  { id: "emerald", from: "#059669", to: "#34d399" },
  { id: "blue", from: "#2563eb", to: "#60a5fa" },
  { id: "purple", from: "#7c3aed", to: "#a78bfa" },
  { id: "pink", from: "#db2777", to: "#f472b6" },
  { id: "amber", from: "#d97706", to: "#fbbf24" },
  { id: "red", from: "#dc2626", to: "#f87171" },
  { id: "cyan", from: "#0891b2", to: "#22d3ee" },
  { id: "rose", from: "#e11d48", to: "#fb7185" },
  { id: "indigo", from: "#4f46e5", to: "#818cf8" },
  { id: "teal", from: "#0d9488", to: "#2dd4bf" },
  { id: "sunset", from: "#ea580c", to: "#fbbf24" },
  { id: "galaxy", from: "#6d28d9", to: "#ec4899" },
];

// ── Storage ──
const STORAGE_KEY = "tmi10_profile_custom";

export interface ProfileCustomData {
  avatar: string;
  bannerId: string;
  bio: string;
}

const DEFAULT_PROFILE: ProfileCustomData = {
  avatar: "",
  bannerId: "emerald",
  bio: "",
};

// ── Context ──
interface ProfileCustomContextValue {
  profile: ProfileCustomData;
  setAvatar: (avatar: string) => void;
  setBanner: (bannerId: string) => void;
  setBio: (bio: string) => void;
  getBannerGradient: () => { from: string; to: string };
}

const ProfileCustomContext = createContext<ProfileCustomContextValue>({
  profile: DEFAULT_PROFILE,
  setAvatar: () => {},
  setBanner: () => {},
  setBio: () => {},
  getBannerGradient: () => ({ from: "#059669", to: "#34d399" }),
});

export function useProfileCustom() {
  return useContext(ProfileCustomContext);
}

export function ProfileCustomProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<ProfileCustomData>(DEFAULT_PROFILE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile({ ...DEFAULT_PROFILE, ...JSON.parse(stored) });
      }
    } catch { /* */ }
  }, []);

  const save = useCallback((updated: ProfileCustomData) => {
    setProfile(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setAvatar = useCallback((avatar: string) => {
    save({ ...profile, avatar });
  }, [profile, save]);

  const setBanner = useCallback((bannerId: string) => {
    save({ ...profile, bannerId });
  }, [profile, save]);

  const setBio = useCallback((bio: string) => {
    save({ ...profile, bio: bio.slice(0, 150) });
  }, [profile, save]);

  const getBannerGradient = useCallback(() => {
    const banner = BANNER_COLORS.find((b) => b.id === profile.bannerId) || BANNER_COLORS[0];
    return { from: banner.from, to: banner.to };
  }, [profile.bannerId]);

  return (
    <ProfileCustomContext.Provider value={{ profile, setAvatar, setBanner, setBio, getBannerGradient }}>
      {children}
    </ProfileCustomContext.Provider>
  );
}

// ── Avatar Display ──
export function ProfileAvatar({
  fallbackLetter,
  size = "lg",
}: {
  fallbackLetter: string;
  size?: "sm" | "md" | "lg";
}) {
  const { profile, getBannerGradient } = useProfileCustom();
  const gradient = getBannerGradient();
  const sizes = { sm: "w-10 h-10 text-lg", md: "w-16 h-16 text-2xl", lg: "w-20 h-20 text-3xl" };

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center border`}
      style={{
        background: `linear-gradient(135deg, ${gradient.from}30, ${gradient.to}15)`,
        borderColor: `${gradient.from}50`,
      }}
    >
      {profile.avatar ? (
        <span className={size === "sm" ? "text-xl" : size === "md" ? "text-2xl" : "text-3xl"}>
          {profile.avatar}
        </span>
      ) : (
        <span className="font-display" style={{ color: gradient.from }}>
          {fallbackLetter.toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ── Banner ──
export function ProfileBanner({ children }: { children?: ReactNode }) {
  const { getBannerGradient } = useProfileCustom();
  const gradient = getBannerGradient();

  return (
    <div
      className="w-full h-28 sm:h-36 rounded-2xl relative overflow-hidden mb-[-3rem]"
      style={{
        background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})`,
      }}
    >
      {/* Subtle pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />
      {children}
    </div>
  );
}

// ── Editor (for settings page) ──
export function ProfileEditor() {
  const { profile, setAvatar, setBanner, setBio } = useProfileCustom();
  const [bioInput, setBioInput] = useState(profile.bio);
  const [activeTab, setActiveTab] = useState<"avatar" | "banner">("avatar");

  useEffect(() => {
    setBioInput(profile.bio);
  }, [profile.bio]);

  return (
    <div className="space-y-5">
      {/* Preview */}
      <div className="rounded-2xl overflow-hidden border border-white/[0.06]">
        <ProfileBanner />
        <div className="px-4 pb-4 pt-14 bg-white/[0.02]">
          <div className="flex items-end gap-3 -mt-10">
            <ProfileAvatar fallbackLetter={profile.bio?.[0] || "U"} size="lg" />
            <div className="pb-1">
              <p className="text-white/70 text-sm font-sans font-medium">Your Profile</p>
              {profile.bio && (
                <p className="text-white/30 text-xs font-sans mt-0.5 italic">{profile.bio}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
        {(["avatar", "banner"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-lg text-xs font-sans capitalize transition-all"
            style={{
              backgroundColor: activeTab === tab ? "var(--accent)" : "transparent",
              color: activeTab === tab ? "#000" : "rgba(255,255,255,0.4)",
              fontWeight: activeTab === tab ? 600 : 400,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "avatar" && (
          <motion.div
            key="avatar"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <p className="text-white/30 text-xs font-sans mb-3">Pick an avatar</p>
            <div className="grid grid-cols-10 gap-1.5">
              {AVATARS.map((av) => (
                <button
                  key={av.id}
                  onClick={() => setAvatar(av.id)}
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all duration-150 hover:scale-110"
                  style={{
                    backgroundColor: profile.avatar === av.id ? "var(--accent)" : "rgba(255,255,255,0.04)",
                    border: profile.avatar === av.id ? "2px solid var(--accent)" : "1px solid rgba(255,255,255,0.06)",
                    boxShadow: profile.avatar === av.id ? `0 0 12px color-mix(in srgb, var(--accent) 40%, transparent)` : "none",
                  }}
                >
                  {av.id}
                </button>
              ))}
            </div>
            {profile.avatar && (
              <button
                onClick={() => setAvatar("")}
                className="mt-2 text-white/20 text-xs font-sans hover:text-white/40 transition-colors"
              >
                Remove avatar (show initial)
              </button>
            )}
          </motion.div>
        )}

        {activeTab === "banner" && (
          <motion.div
            key="banner"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            <p className="text-white/30 text-xs font-sans mb-3">Choose banner color</p>
            <div className="grid grid-cols-6 gap-2">
              {BANNER_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => setBanner(color.id)}
                  className="h-10 rounded-xl transition-all duration-150 hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
                    boxShadow: profile.bannerId === color.id
                      ? `0 0 0 2px #0a0f1a, 0 0 0 4px ${color.from}`
                      : "none",
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-white/30 text-xs font-sans">Bio</p>
          <span className="text-white/15 text-[10px] font-mono">{bioInput.length}/150</span>
        </div>
        <textarea
          value={bioInput}
          onChange={(e) => setBioInput(e.target.value.slice(0, 150))}
          onBlur={() => setBio(bioInput)}
          placeholder="Tell people about yourself..."
          rows={2}
          className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/70 text-sm font-sans placeholder:text-white/15 focus:outline-none focus:border-white/20 resize-none transition-colors"
        />
      </div>
    </div>
  );
}
