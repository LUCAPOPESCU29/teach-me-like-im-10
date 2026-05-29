"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useAccent } from "@/components/AccentProvider";
import { useProfileCustom } from "@/components/ProfileCustomization";
import { getGuestFreezes, FREEZE_COST, MAX_FREEZES } from "@/lib/xp";
import { getActivePerks, savePerks, hasPerk } from "@/lib/perks";
import { isPro, PRO_SHOP_ITEMS } from "@/lib/limits";
import PageTransition from "@/components/PageTransition";

// ── Shop item definitions ──

const SHOP_KEY = "tmi10_shop_purchases";

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: string;
  category: "themes" | "avatars" | "effects" | "power-ups" | "perks";
  preview?: string; // hex color or emoji
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic";
  perk?: string; // perk description shown after purchase
}

const RARITY_COLORS = {
  common: { border: "rgba(255,255,255,0.1)", bg: "rgba(255,255,255,0.03)", text: "rgba(255,255,255,0.5)", label: "Common" },
  rare: { border: "rgba(96,165,250,0.3)", bg: "rgba(96,165,250,0.06)", text: "#60a5fa", label: "Rare" },
  epic: { border: "rgba(168,85,247,0.3)", bg: "rgba(168,85,247,0.06)", text: "#a855f7", label: "Epic" },
  legendary: { border: "rgba(251,191,36,0.3)", bg: "rgba(251,191,36,0.06)", text: "#fbbf24", label: "Legendary" },
  mythic: { border: "rgba(244,63,94,0.4)", bg: "rgba(244,63,94,0.08)", text: "#fb7185", label: "Mythic" },
};

const SHOP_ITEMS: ShopItem[] = [
  // Themes (accent colors — some free, some premium)
  { id: "theme_mint", name: "Mint Breeze", description: "A cool minty accent", price: 50, icon: "🌿", category: "themes", preview: "#6ee7b7", rarity: "common" },
  { id: "theme_lavender", name: "Lavender Dream", description: "Soft purple haze", price: 75, icon: "💜", category: "themes", preview: "#c4b5fd", rarity: "common" },
  { id: "theme_sunset", name: "Sunset Glow", description: "Warm orange horizon", price: 100, icon: "🌅", category: "themes", preview: "#fb923c", rarity: "rare" },
  { id: "theme_ocean", name: "Deep Ocean", description: "Dark teal depths", price: 100, icon: "🌊", category: "themes", preview: "#0d9488", rarity: "rare" },
  { id: "theme_rose_gold", name: "Rose Gold", description: "Elegant and luxurious", price: 200, icon: "🌹", category: "themes", preview: "#f9a8d4", rarity: "epic" },
  { id: "theme_aurora", name: "Northern Lights", description: "Shimmering aurora borealis", price: 300, icon: "🌌", category: "themes", preview: "#34d399", rarity: "epic" },
  { id: "theme_solar", name: "Solar Flare", description: "Blazing golden energy", price: 500, icon: "☀️", category: "themes", preview: "#facc15", rarity: "legendary" },
  { id: "theme_void", name: "Void Walker", description: "Mysterious dark energy", price: 500, icon: "🕳️", category: "themes", preview: "#818cf8", rarity: "legendary" },

  // Premium avatars
  { id: "avatar_dragon", name: "Dragon", description: "Fearsome guardian of knowledge", price: 150, icon: "🐲", category: "avatars", rarity: "rare" },
  { id: "avatar_unicorn", name: "Unicorn", description: "Magical learner", price: 150, icon: "🦄", category: "avatars", rarity: "rare" },
  { id: "avatar_phoenix", name: "Phoenix", description: "Rise from the ashes", price: 200, icon: "🔥", category: "avatars", rarity: "epic" },
  { id: "avatar_alien", name: "Alien Scholar", description: "Intergalactic intelligence", price: 200, icon: "👽", category: "avatars", rarity: "epic" },
  { id: "avatar_wizard", name: "Wizard", description: "Master of arcane knowledge", price: 300, icon: "🧙", category: "avatars", rarity: "epic" },
  { id: "avatar_crown", name: "Royal Crown", description: "The ultimate learner", price: 500, icon: "👑", category: "avatars", rarity: "legendary" },
  { id: "avatar_galaxy_brain", name: "Galaxy Brain", description: "Infinite knowledge", price: 750, icon: "🧠", category: "avatars", rarity: "legendary" },

  // Profile effects
  { id: "effect_sparkle", name: "Sparkle Border", description: "Your profile shimmers", price: 200, icon: "✨", category: "effects", rarity: "rare" },
  { id: "effect_fire", name: "Fire Border", description: "Profile ablaze", price: 300, icon: "🔥", category: "effects", rarity: "epic" },
  { id: "effect_rainbow", name: "Rainbow Border", description: "Full spectrum glow", price: 400, icon: "🌈", category: "effects", rarity: "epic" },
  { id: "effect_lightning", name: "Lightning Border", description: "Electric energy", price: 500, icon: "⚡", category: "effects", rarity: "legendary" },

  // Power-ups
  { id: "freeze_1", name: "Streak Freeze", description: "Protect your streak for 1 day", price: FREEZE_COST, icon: "❄️", category: "power-ups", rarity: "common" },
  { id: "xp_boost_2x", name: "2x XP Boost", description: "Double XP for your next topic", price: 150, icon: "⚡", category: "power-ups", rarity: "rare" },
  { id: "xp_boost_3x", name: "3x XP Boost", description: "Triple XP for your next topic", price: 350, icon: "🚀", category: "power-ups", rarity: "epic" },
  { id: "freeze_bundle", name: "Freeze Bundle", description: "5 streak freezes at once", price: 400, icon: "🧊", category: "power-ups", rarity: "epic" },
  { id: "xp_boost_5x", name: "5x XP Boost", description: "5x XP for your next topic", price: 1000, icon: "💫", category: "power-ups", rarity: "legendary" },

  // Perks (permanent upgrades)
  { id: "perk_quiz_bonus", name: "Quiz Scholar", description: "+25% XP from all quizzes permanently", price: 2500, icon: "🎓", category: "perks", rarity: "epic", perk: "+25% quiz XP" },
  { id: "perk_streak_shield", name: "Streak Shield", description: "Auto-freeze 1 missed day per week", price: 5000, icon: "🛡️", category: "perks", rarity: "legendary", perk: "Auto-freeze once/week" },
  { id: "perk_daily_bonus", name: "VIP Daily Bonus", description: "2x daily login reward XP", price: 7500, icon: "💎", category: "perks", rarity: "legendary", perk: "2x daily login XP" },
  { id: "perk_lucky_spin", name: "Lucky Spinner", description: "2 daily spins instead of 1", price: 10000, icon: "🍀", category: "perks", rarity: "legendary", perk: "2 spins per day" },
  { id: "perk_xp_passive", name: "XP Generator", description: "+5 XP every hour passively", price: 15000, icon: "⚙️", category: "perks", rarity: "mythic", perk: "+5 XP/hour passive" },
  { id: "perk_double_all", name: "Golden Touch", description: "Permanent +50% XP from everything", price: 25000, icon: "👑", category: "perks", rarity: "mythic", perk: "+50% all XP" },
  { id: "perk_blackjack_edge", name: "Card Counter", description: "See dealer's hidden card value range", price: 30000, icon: "🃏", category: "perks", rarity: "mythic", perk: "Blackjack hints" },
  { id: "perk_infinite_freeze", name: "Frost Titan", description: "Unlimited streak freezes forever", price: 50000, icon: "🏔️", category: "perks", rarity: "mythic", perk: "Unlimited freezes" },
  { id: "perk_prestige", name: "Prestige Mode", description: "Golden profile + animated name + exclusive badge", price: 100000, icon: "✨", category: "perks", rarity: "mythic", perk: "Golden prestige" },
];

const CATEGORIES = [
  { id: "perks", label: "Perks", icon: "👑" },
  { id: "themes", label: "Themes", icon: "🎨" },
  { id: "avatars", label: "Avatars", icon: "😎" },
  { id: "effects", label: "Effects", icon: "✨" },
  { id: "power-ups", label: "Power-ups", icon: "⚡" },
] as const;

function getPurchases(): Set<string> {
  try {
    const raw = localStorage.getItem(SHOP_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function savePurchases(purchases: Set<string>) {
  localStorage.setItem(SHOP_KEY, JSON.stringify([...purchases]));
}

function getActiveEffect(): string | null {
  try {
    return localStorage.getItem("tmi10_active_effect");
  } catch {
    return null;
  }
}

function setActiveEffect(effectId: string | null) {
  if (effectId) {
    localStorage.setItem("tmi10_active_effect", effectId);
  } else {
    localStorage.removeItem("tmi10_active_effect");
  }
}

function getXPBoost(): { multiplier: number; id: string } | null {
  try {
    const raw = localStorage.getItem("tmi10_xp_boost");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function setXPBoost(multiplier: number, id: string) {
  localStorage.setItem("tmi10_xp_boost", JSON.stringify({ multiplier, id }));
}

export default function ShopPage() {
  const { data } = useAuth();
  const { setColor } = useAccent();
  const { setAvatar } = useProfileCustom();
  const router = useRouter();

  const [xp, setXp] = useState(0);
  const [freezes, setFreezes] = useState(0);
  const [purchases, setPurchases] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState<string>("perks");
  const [activePerks, setActivePerks] = useState<Set<string>>(new Set());
  const [buying, setBuying] = useState<string | null>(null);
  const [justBought, setJustBought] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeEffect, setActiveEffectState] = useState<string | null>(null);
  const [activeBoost, setActiveBoost] = useState<{ multiplier: number; id: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const loadState = useCallback(async () => {
    const xpState = await data.getXP();
    setXp(xpState.totalXP);
    setFreezes(xpState.freezes ?? getGuestFreezes());
    setPurchases(getPurchases());
    setActiveEffectState(getActiveEffect());
    setActiveBoost(getXPBoost());
    setActivePerks(getActivePerks());
    setLoading(false);
  }, [data]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  const filteredItems = SHOP_ITEMS.filter((item) => item.category === activeCategory);

  function isOwned(item: ShopItem): boolean {
    if (item.id === "freeze_1" || item.id === "freeze_bundle") return false; // always purchasable
    if (item.id === "xp_boost_2x" || item.id === "xp_boost_3x" || item.id === "xp_boost_5x") {
      return activeBoost?.id === item.id;
    }
    if (item.category === "perks") return activePerks.has(item.id);
    return purchases.has(item.id);
  }

  function isEquipped(item: ShopItem): boolean {
    if (item.category === "effects") return activeEffect === item.id;
    return false;
  }

  async function handleBuy(item: ShopItem) {
    if (buying) return;

    // Freeze special cases
    if (item.id === "freeze_1") {
      if (freezes >= MAX_FREEZES) {
        setError("Max freezes owned");
        setTimeout(() => setError(""), 2000);
        return;
      }
    }
    if (item.id === "freeze_bundle" && freezes >= MAX_FREEZES) {
      setError("Max freezes owned");
      setTimeout(() => setError(""), 2000);
      return;
    }

    if (xp < item.price) {
      setError("Not enough XP");
      setTimeout(() => setError(""), 2000);
      return;
    }

    setBuying(item.id);
    setError("");

    try {
      if (item.id === "freeze_1") {
        const success = await data.buyFreeze();
        if (!success) {
          setError("Purchase failed");
          setTimeout(() => setError(""), 2000);
          setBuying(null);
          return;
        }
      } else {
        // Deduct XP
        await data.addXP(-item.price, "shop_purchase");

        // Save purchase
        const newPurchases = new Set(purchases);
        newPurchases.add(item.id);
        savePurchases(newPurchases);
        setPurchases(newPurchases);

        // Auto-apply based on category
        if (item.category === "themes" && item.preview) {
          setColor(item.preview);
        } else if (item.category === "avatars") {
          setAvatar(item.icon);
        } else if (item.category === "effects") {
          setActiveEffect(item.id);
          setActiveEffectState(item.id);
        } else if (item.id === "xp_boost_2x") {
          setXPBoost(2, item.id);
          setActiveBoost({ multiplier: 2, id: item.id });
        } else if (item.id === "xp_boost_3x") {
          setXPBoost(3, item.id);
          setActiveBoost({ multiplier: 3, id: item.id });
        } else if (item.id === "xp_boost_5x") {
          setXPBoost(5, item.id);
          setActiveBoost({ multiplier: 5, id: item.id });
        } else if (item.id === "freeze_bundle") {
          // Buy up to 5 freezes (or fill to max)
          for (let i = 0; i < 5 && freezes + i < MAX_FREEZES; i++) {
            await data.buyFreeze();
          }
        } else if (item.category === "perks") {
          const newPerks = new Set(activePerks);
          newPerks.add(item.id);
          savePerks(newPerks);
          setActivePerks(newPerks);
        }
      }

      setJustBought(item.id);
      await loadState();
      setTimeout(() => setJustBought(null), 1500);
    } catch {
      setError("Something went wrong");
      setTimeout(() => setError(""), 2000);
    } finally {
      setBuying(null);
    }
  }

  function handleEquip(item: ShopItem) {
    if (item.category === "themes" && item.preview) {
      setColor(item.preview);
    } else if (item.category === "avatars") {
      setAvatar(item.icon);
    } else if (item.category === "effects") {
      const newEffect = activeEffect === item.id ? null : item.id;
      setActiveEffect(newEffect);
      setActiveEffectState(newEffect);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">Loading shop...</div>
      </main>
    );
  }

  return (
    <PageTransition>
      <main className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Header */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/30 hover:text-white/60 transition-colors font-sans mb-4 inline-block"
          >
            &larr; Home
          </button>
          <div className="flex items-center justify-between">
            <h1 className="font-display text-3xl sm:text-4xl text-white">XP Shop</h1>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <span className="text-yellow-400">&#11088;</span>
              <span className="text-white font-mono text-lg font-bold">{xp.toLocaleString()}</span>
              <span className="text-white/30 text-sm font-sans">XP</span>
            </div>
          </div>
          <p className="text-white/30 text-sm font-sans mt-2">
            Spend your hard-earned XP on themes, avatars, effects, and power-ups.
          </p>
        </motion.div>

        {/* Pro upsell banner */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.05] px-5 py-4 flex items-center justify-between gap-4 cursor-pointer group"
          onClick={() => router.push("/pro")}
          style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(16,185,129,0.03) 100%)" }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3">
            <span className="text-2xl">✦</span>
            <div>
              <p className="text-white font-sans font-medium text-sm">Upgrade to Pro — unlock the full shop</p>
              <p className="text-white/40 text-xs font-sans mt-0.5">All perks included · Audio · PDF export · Unlimited topics · from $3.33/mo</p>
            </div>
          </div>
          <span className="shrink-0 px-4 py-1.5 rounded-xl text-xs font-sans font-semibold text-black" style={{ background: "linear-gradient(135deg,#34d399,#10b981)" }}>
            View Pro →
          </span>
        </motion.div>

        {/* Active boost banner */}
        <AnimatePresence>
          {activeBoost && (
            <motion.div
              className="mb-6 px-4 py-3 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] flex items-center gap-3"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <span className="text-xl">{activeBoost.multiplier === 2 ? "&#9889;" : "&#128640;"}</span>
              <span className="text-amber-300 text-sm font-sans">
                {activeBoost.multiplier}x XP boost active &mdash; applies to your next topic!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Category tabs */}
        <motion.div
          className="flex gap-1 mb-6 bg-white/[0.03] rounded-xl p-1 w-fit"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-sans transition-all"
              style={{
                backgroundColor: activeCategory === cat.id ? "var(--accent)" : "transparent",
                color: activeCategory === cat.id ? "#000" : "rgba(255,255,255,0.4)",
                fontWeight: activeCategory === cat.id ? 600 : 400,
              }}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="mb-4 px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/[0.06] text-red-400 text-sm font-sans"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Items grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {filteredItems.map((item, i) => {
              const owned = isOwned(item);
              const equipped = isEquipped(item);
              const rarity = RARITY_COLORS[item.rarity];
              const canAfford = xp >= item.price;
              const isFreezeMaxed = (item.id === "freeze_1" || item.id === "freeze_bundle") && freezes >= MAX_FREEZES;
              const isProLocked = PRO_SHOP_ITEMS.has(item.id) && !isPro() && !owned;

              return (
                <motion.div
                  key={item.id}
                  className="relative rounded-2xl p-4 transition-all card-hover"
                  style={{
                    border: `1px solid ${equipped ? "var(--accent)" : rarity.border}`,
                    backgroundColor: equipped ? "rgba(52,211,153,0.06)" : rarity.bg,
                  }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  {/* Pro lock overlay */}
                  {isProLocked && (
                    <div className="absolute inset-0 z-20 rounded-2xl bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 cursor-pointer"
                      onClick={() => router.push("/pro")}
                    >
                      <span className="text-2xl">🔒</span>
                      <span className="text-xs font-sans text-white/70 font-medium">Pro only</span>
                      <span className="text-[10px] font-sans text-emerald-400 underline">Unlock with Pro →</span>
                    </div>
                  )}

                  {/* Rarity badge */}
                  <span
                    className="absolute top-3 right-3 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      color: rarity.text,
                      backgroundColor: `${rarity.text}15`,
                      border: `1px solid ${rarity.text}30`,
                    }}
                  >
                    {rarity.label}
                  </span>

                  {/* Just bought sparkle */}
                  <AnimatePresence>
                    {justBought === item.id && (
                      <motion.div
                        className="absolute inset-0 z-10 pointer-events-none rounded-2xl overflow-hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {[...Array(6)].map((_, j) => (
                          <motion.span
                            key={j}
                            className="absolute text-lg"
                            style={{
                              left: `${10 + Math.random() * 80}%`,
                              top: `${10 + Math.random() * 80}%`,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0], y: [0, -15] }}
                            transition={{ duration: 1, delay: j * 0.08 }}
                          >
                            &#10024;
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Item icon + preview */}
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                      style={{
                        backgroundColor: item.preview ? `${item.preview}15` : "rgba(255,255,255,0.04)",
                        border: `1px solid ${item.preview ? `${item.preview}30` : "rgba(255,255,255,0.06)"}`,
                      }}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-sans font-medium text-sm">{item.name}</h3>
                      <p className="text-white/30 text-xs font-sans">{item.description}</p>
                    </div>
                  </div>

                  {/* Theme color preview bar */}
                  {item.category === "themes" && item.preview && (
                    <div
                      className="h-1 rounded-full mb-3"
                      style={{ backgroundColor: item.preview, opacity: 0.6 }}
                    />
                  )}

                  {/* Perk badge when owned */}
                  {item.perk && owned && (
                    <div className="flex items-center gap-1.5 mb-3 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                      <span className="text-emerald-400 text-[10px]">&#10003;</span>
                      <span className="text-emerald-400 text-[10px] font-mono">{item.perk}</span>
                    </div>
                  )}

                  {/* Action area */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-400 text-xs">&#11088;</span>
                      <span className="text-white/60 text-sm font-mono">{item.price.toLocaleString()}</span>
                    </div>

                    {owned && item.category === "perks" ? (
                      <span className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    ) : owned && item.id !== "freeze_1" && item.id !== "freeze_bundle" ? (
                      <button
                        onClick={() => handleEquip(item)}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all"
                        style={{
                          backgroundColor: equipped ? "var(--accent)" : "rgba(255,255,255,0.06)",
                          color: equipped ? "#000" : "rgba(255,255,255,0.5)",
                          border: `1px solid ${equipped ? "var(--accent)" : "rgba(255,255,255,0.1)"}`,
                        }}
                      >
                        {equipped ? "Equipped" : "Equip"}
                      </button>
                    ) : (
                      <motion.button
                        onClick={() => handleBuy(item)}
                        disabled={buying === item.id || (!canAfford && item.id !== "freeze_1") || isFreezeMaxed}
                        className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-all"
                        style={{
                          backgroundColor: isFreezeMaxed
                            ? "rgba(255,255,255,0.03)"
                            : canAfford
                              ? "var(--accent)"
                              : "rgba(255,255,255,0.03)",
                          color: isFreezeMaxed
                            ? "rgba(255,255,255,0.2)"
                            : canAfford
                              ? "#000"
                              : "rgba(255,255,255,0.2)",
                          border: `1px solid ${
                            isFreezeMaxed
                              ? "rgba(255,255,255,0.06)"
                              : canAfford
                                ? "var(--accent)"
                                : "rgba(255,255,255,0.06)"
                          }`,
                          cursor: isFreezeMaxed || !canAfford || buying === item.id ? "not-allowed" : "pointer",
                          opacity: buying === item.id ? 0.6 : 1,
                        }}
                        whileTap={canAfford && !isFreezeMaxed ? { scale: 0.95 } : {}}
                      >
                        {buying === item.id ? "..." : isFreezeMaxed ? "Max owned" : "Buy"}
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Blackjack link */}
        <motion.button
          onClick={() => router.push("/blackjack")}
          className="mt-6 w-full py-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.04] text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-500/[0.08] text-sm font-sans transition-all flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span>🃏</span> Need more XP? Try your luck at Blackjack
        </motion.button>

        {/* Info footer */}
        <motion.div
          className="mt-4 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-white/15 text-xs font-sans">
            Earn XP by learning topics, acing quizzes, and maintaining streaks.
          </p>
        </motion.div>
      </main>
    </PageTransition>
  );
}
