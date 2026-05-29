"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { hasPerk, PERK } from "@/lib/perks";
import PageTransition from "@/components/PageTransition";

// ── Card types ──

type Suit = "♠" | "♥" | "♦" | "♣";
type Rank = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";

interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  hidden: boolean;
}

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
const BET_OPTIONS = [10, 25, 50, 100, 250];

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      let value = parseInt(rank);
      if (rank === "A") value = 11;
      else if (["J", "Q", "K"].includes(rank)) value = 10;
      deck.push({ suit, rank, value, hidden: false });
    }
  }
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function calcHand(cards: Card[]): number {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    if (card.hidden) continue;
    total += card.value;
    if (card.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && calcHand(cards) === 21;
}

function getSuitColor(suit: Suit): string {
  return suit === "♥" || suit === "♦" ? "#ef4444" : "#e2e8f0";
}

type GameState = "betting" | "playing" | "dealer-turn" | "result";
type Result = "win" | "lose" | "push" | "blackjack" | null;

// ── Stats tracking ──

const STATS_KEY = "tmi10_blackjack_stats";

interface BJStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  xpWon: number;
  xpLost: number;
  biggestWin: number;
}

function getStats(): BJStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    return raw ? JSON.parse(raw) : { gamesPlayed: 0, wins: 0, losses: 0, pushes: 0, blackjacks: 0, xpWon: 0, xpLost: 0, biggestWin: 0 };
  } catch {
    return { gamesPlayed: 0, wins: 0, losses: 0, pushes: 0, blackjacks: 0, xpWon: 0, xpLost: 0, biggestWin: 0 };
  }
}

function saveStats(stats: BJStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// ── Card component ──

function CardFace({ card, index, delay = 0 }: { card: Card; index: number; delay?: number }) {
  const color = getSuitColor(card.suit);

  if (card.hidden) {
    return (
      <motion.div
        className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        }}
        initial={{ opacity: 0, rotateY: 180, x: 50 }}
        animate={{ opacity: 1, rotateY: 0, x: 0 }}
        transition={{ delay: delay + index * 0.15, duration: 0.4, type: "spring" }}
      >
        <div className="text-white/10 text-2xl font-display">?</div>
        <div
          className="absolute inset-1 rounded-lg border border-white/[0.05]"
          style={{
            background: "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.02) 4px, rgba(255,255,255,0.02) 8px)",
          }}
        />
      </motion.div>
    );
  }

  return (
    <motion.div
      className="relative w-16 h-24 sm:w-20 sm:h-28 rounded-xl flex flex-col items-center justify-center shrink-0"
      style={{
        background: "linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)",
        border: `1px solid ${color}30`,
        boxShadow: `0 4px 12px rgba(0,0,0,0.3), 0 0 8px ${color}10`,
      }}
      initial={{ opacity: 0, rotateY: 180, x: 50 }}
      animate={{ opacity: 1, rotateY: 0, x: 0 }}
      transition={{ delay: delay + index * 0.15, duration: 0.4, type: "spring" }}
    >
      <span className="text-lg sm:text-xl font-mono font-bold" style={{ color }}>{card.rank}</span>
      <span className="text-lg sm:text-xl" style={{ color }}>{card.suit}</span>
      {/* Corner indicators */}
      <span className="absolute top-1 left-1.5 text-[8px] sm:text-[9px] font-mono" style={{ color, opacity: 0.6 }}>{card.rank}</span>
      <span className="absolute bottom-1 right-1.5 text-[8px] sm:text-[9px] font-mono rotate-180" style={{ color, opacity: 0.6 }}>{card.rank}</span>
    </motion.div>
  );
}

export default function BlackjackPage() {
  const { data } = useAuth();
  const router = useRouter();

  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<Card[]>([]);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [dealerHand, setDealerHand] = useState<Card[]>([]);
  const [bet, setBet] = useState(25);
  const [customBet, setCustomBet] = useState("");
  const [gameState, setGameState] = useState<GameState>("betting");
  const [result, setResult] = useState<Result>(null);
  const [message, setMessage] = useState("");
  const [xpChange, setXpChange] = useState(0);
  const [stats, setStats] = useState<BJStats>(getStats());
  const [doubledDown, setDoubledDown] = useState(false);

  const loadXP = useCallback(async () => {
    const xpState = await data.getXP();
    setXp(xpState.totalXP);
    setLoading(false);
  }, [data]);

  useEffect(() => {
    loadXP();
    setStats(getStats());
  }, [loadXP]);

  function deal() {
    if (xp < bet) return;
    const newDeck = createDeck();
    const p1 = newDeck.pop()!;
    const d1 = newDeck.pop()!;
    const p2 = newDeck.pop()!;
    const d2 = { ...newDeck.pop()!, hidden: true };

    setDeck(newDeck);
    setPlayerHand([p1, p2]);
    setDealerHand([d1, d2]);
    setGameState("playing");
    setResult(null);
    setMessage("");
    setXpChange(0);
    setDoubledDown(false);
    setCustomBet("");

    // Check for player blackjack
    if (isBlackjack([p1, p2])) {
      const revealedD2 = { ...d2, hidden: false };
      setDealerHand([d1, revealedD2]);
      if (isBlackjack([d1, revealedD2])) {
        endGame([p1, p2], [d1, revealedD2], newDeck, "push");
      } else {
        endGame([p1, p2], [d1, revealedD2], newDeck, "blackjack");
      }
    }
  }

  function hit() {
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);

    if (calcHand(newHand) > 21) {
      const revealedDealer = dealerHand.map((c) => ({ ...c, hidden: false }));
      setDealerHand(revealedDealer);
      endGame(newHand, revealedDealer, newDeck, "lose");
    }
  }

  function stand() {
    dealerPlay([...deck], [...dealerHand]);
  }

  function doubleDown() {
    if (xp < bet * 2 || playerHand.length !== 2) return;
    setDoubledDown(true);
    const newDeck = [...deck];
    const card = newDeck.pop()!;
    const newHand = [...playerHand, card];
    setDeck(newDeck);
    setPlayerHand(newHand);

    if (calcHand(newHand) > 21) {
      const revealedDealer = dealerHand.map((c) => ({ ...c, hidden: false }));
      setDealerHand(revealedDealer);
      endGame(newHand, revealedDealer, newDeck, "lose", true);
    } else {
      dealerPlay(newDeck, [...dealerHand], newHand, true);
    }
  }

  function dealerPlay(currentDeck: Card[], currentDealer: Card[], pHand?: Card[], isDouble?: boolean) {
    setGameState("dealer-turn");
    const revealed = currentDealer.map((c) => ({ ...c, hidden: false }));
    let dHand = [...revealed];
    const dk = [...currentDeck];
    const finalPlayerHand = pHand || playerHand;

    // Dealer hits on 16 or less, stands on 17+
    while (calcHand(dHand) < 17) {
      dHand.push(dk.pop()!);
    }

    setDealerHand(dHand);
    setDeck(dk);

    const playerTotal = calcHand(finalPlayerHand);
    const dealerTotal = calcHand(dHand);

    if (dealerTotal > 21) {
      endGame(finalPlayerHand, dHand, dk, "win", isDouble);
    } else if (playerTotal > dealerTotal) {
      endGame(finalPlayerHand, dHand, dk, "win", isDouble);
    } else if (playerTotal < dealerTotal) {
      endGame(finalPlayerHand, dHand, dk, "lose", isDouble);
    } else {
      endGame(finalPlayerHand, dHand, dk, "push", isDouble);
    }
  }

  async function endGame(_pHand: Card[], _dHand: Card[], _dk: Card[], outcome: Result, isDouble?: boolean) {
    setGameState("result");
    setResult(outcome);

    const effectiveBet = isDouble ? bet * 2 : bet;
    let change = 0;
    let msg = "";
    const newStats = { ...stats, gamesPlayed: stats.gamesPlayed + 1 };

    switch (outcome) {
      case "blackjack":
        change = Math.floor(effectiveBet * 1.5);
        msg = `Blackjack! +${change} XP`;
        newStats.wins++;
        newStats.blackjacks++;
        newStats.xpWon += change;
        if (change > newStats.biggestWin) newStats.biggestWin = change;
        break;
      case "win":
        change = effectiveBet;
        msg = `You win! +${change} XP`;
        newStats.wins++;
        newStats.xpWon += change;
        if (change > newStats.biggestWin) newStats.biggestWin = change;
        break;
      case "lose":
        change = -effectiveBet;
        msg = `Dealer wins. -${effectiveBet} XP`;
        newStats.losses++;
        newStats.xpLost += effectiveBet;
        break;
      case "push":
        change = 0;
        msg = "Push! XP returned.";
        newStats.pushes++;
        break;
    }

    setXpChange(change);
    setMessage(msg);
    setStats(newStats);
    saveStats(newStats);

    if (change !== 0) {
      await data.addXP(change, "blackjack");
      await loadXP();
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white/30 font-mono text-sm animate-pulse">Shuffling deck...</div>
      </main>
    );
  }

  const playerTotal = calcHand(playerHand);
  const dealerTotal = calcHand(dealerHand);
  const canDoubleDown = gameState === "playing" && playerHand.length === 2 && xp >= bet * 2;
  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  return (
    <PageTransition>
      <main className="min-h-screen max-w-2xl mx-auto px-4 sm:px-6 py-8 pb-24">
        {/* Header */}
        <motion.div
          className="mb-6"
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
            <h1 className="font-display text-3xl sm:text-4xl text-white">
              <span className="mr-2">🃏</span>Blackjack
            </h1>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <span className="text-yellow-400">&#11088;</span>
              <span className="text-white font-mono text-lg font-bold">{xp.toLocaleString()}</span>
              <span className="text-white/30 text-sm font-sans">XP</span>
            </div>
          </div>
        </motion.div>

        {/* Game table */}
        <motion.div
          className="rounded-2xl border border-emerald-500/15 bg-gradient-to-b from-emerald-900/20 via-emerald-950/30 to-emerald-900/10 p-5 sm:p-8 mb-6 relative overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Felt texture overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "8px 8px",
          }} />

          {/* Dealer section */}
          <div className="relative z-10 mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/40 text-xs font-sans uppercase tracking-wider">Dealer</span>
              {gameState !== "betting" && (
                <>
                  <span className="text-white/60 text-xs font-mono bg-white/[0.06] px-2 py-0.5 rounded-md">
                    {dealerHand.some((c) => c.hidden) ? "?" : dealerTotal}
                  </span>
                  {dealerHand.some((c) => c.hidden) && hasPerk(PERK.CARD_COUNTER) && (() => {
                    const visible = dealerHand.find((c) => !c.hidden);
                    if (!visible) return null;
                    const lo = visible.value + 1;
                    const hi = visible.value + 11;
                    return (
                      <span className="text-amber-400/50 text-[10px] font-mono bg-amber-500/[0.08] px-1.5 py-0.5 rounded-md border border-amber-500/15">
                        🃏 {lo}-{hi}
                      </span>
                    );
                  })()}
                </>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3 min-h-[6rem] sm:min-h-[7rem]">
              {dealerHand.map((card, i) => (
                <CardFace key={`d-${i}`} card={card} index={i} />
              ))}
              {gameState === "betting" && (
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl border border-dashed border-white/[0.06] flex items-center justify-center">
                  <span className="text-white/10 text-xs font-sans">cards</span>
                </div>
              )}
            </div>
          </div>

          {/* Divider with result */}
          <div className="relative z-10 flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-white/[0.06]" />
            <AnimatePresence mode="wait">
              {result ? (
                <motion.span
                  key="result"
                  className="text-sm font-sans font-medium px-3 py-1 rounded-full"
                  style={{
                    color: result === "win" || result === "blackjack" ? "#4ade80" : result === "lose" ? "#f87171" : "#fbbf24",
                    backgroundColor: result === "win" || result === "blackjack" ? "rgba(74,222,128,0.1)" : result === "lose" ? "rgba(248,113,113,0.1)" : "rgba(251,191,36,0.1)",
                    border: `1px solid ${result === "win" || result === "blackjack" ? "rgba(74,222,128,0.2)" : result === "lose" ? "rgba(248,113,113,0.2)" : "rgba(251,191,36,0.2)"}`,
                  }}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {message}
                </motion.span>
              ) : gameState === "betting" ? (
                <span className="text-white/15 text-xs font-sans">place your bet</span>
              ) : (
                <span className="text-white/15 text-xs font-sans">
                  {doubledDown ? `doubled: ${bet * 2} XP` : `bet: ${bet} XP`}
                </span>
              )}
            </AnimatePresence>
            <div className="flex-1 h-px bg-white/[0.06]" />
          </div>

          {/* Player section */}
          <div className="relative z-10 mt-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-white/40 text-xs font-sans uppercase tracking-wider">You</span>
              {gameState !== "betting" && (
                <span
                  className="text-xs font-mono px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: playerTotal === 21 ? "rgba(74,222,128,0.15)" : playerTotal > 21 ? "rgba(248,113,113,0.15)" : "rgba(255,255,255,0.06)",
                    color: playerTotal === 21 ? "#4ade80" : playerTotal > 21 ? "#f87171" : "rgba(255,255,255,0.6)",
                  }}
                >
                  {playerTotal}
                </span>
              )}
            </div>
            <div className="flex gap-2 sm:gap-3 min-h-[6rem] sm:min-h-[7rem]">
              {playerHand.map((card, i) => (
                <CardFace key={`p-${i}`} card={card} index={i} delay={0.3} />
              ))}
              {gameState === "betting" && (
                <div className="w-16 h-24 sm:w-20 sm:h-28 rounded-xl border border-dashed border-white/[0.06] flex items-center justify-center">
                  <span className="text-white/10 text-xs font-sans">cards</span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Betting phase */}
          {gameState === "betting" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {BET_OPTIONS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setBet(amount); setCustomBet(""); }}
                    disabled={xp < amount}
                    className="px-4 py-2 rounded-xl text-sm font-mono transition-all"
                    style={{
                      backgroundColor: bet === amount && !customBet ? "var(--accent)" : "rgba(255,255,255,0.04)",
                      color: bet === amount && !customBet ? "#000" : xp < amount ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.6)",
                      border: `1px solid ${bet === amount && !customBet ? "var(--accent)" : "rgba(255,255,255,0.08)"}`,
                      cursor: xp < amount ? "not-allowed" : "pointer",
                      fontWeight: bet === amount && !customBet ? 700 : 400,
                    }}
                  >
                    {amount}
                  </button>
                ))}
              </div>
              {/* Custom bet input */}
              <div className="flex items-center gap-2 justify-center">
                <span className="text-white/30 text-xs font-sans">or</span>
                <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] focus-within:border-white/20 transition-colors">
                  <span className="text-yellow-400 text-xs">&#11088;</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={customBet}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setCustomBet(val);
                      const num = parseInt(val, 10);
                      if (num > 0 && num <= xp) setBet(num);
                    }}
                    placeholder="Custom"
                    className="w-20 bg-transparent text-white font-mono text-sm text-center placeholder:text-white/20 focus:outline-none"
                  />
                  <span className="text-white/20 text-xs font-sans">XP</span>
                </div>
                {customBet && parseInt(customBet, 10) > xp && (
                  <span className="text-red-400/60 text-[10px] font-sans">too high</span>
                )}
              </div>
              <motion.button
                onClick={deal}
                disabled={xp < bet}
                className="w-full py-3 rounded-xl text-sm font-sans font-semibold transition-all"
                style={{
                  backgroundColor: xp >= bet ? "var(--accent)" : "rgba(255,255,255,0.03)",
                  color: xp >= bet ? "#000" : "rgba(255,255,255,0.2)",
                  border: `1px solid ${xp >= bet ? "var(--accent)" : "rgba(255,255,255,0.06)"}`,
                  cursor: xp < bet ? "not-allowed" : "pointer",
                }}
                whileTap={xp >= bet ? { scale: 0.97 } : {}}
              >
                {xp < bet ? "Not enough XP" : `Deal \u2014 Bet ${bet} XP`}
              </motion.button>
            </div>
          )}

          {/* Playing phase */}
          {gameState === "playing" && (
            <div className="flex gap-2">
              <motion.button
                onClick={hit}
                className="flex-1 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white font-sans text-sm font-medium hover:bg-white/[0.1] transition-all"
                whileTap={{ scale: 0.97 }}
              >
                Hit
              </motion.button>
              <motion.button
                onClick={stand}
                className="flex-1 py-3 rounded-xl border text-sm font-sans font-medium transition-all"
                style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--accent)",
                  color: "#000",
                }}
                whileTap={{ scale: 0.97 }}
              >
                Stand
              </motion.button>
              {canDoubleDown && (
                <motion.button
                  onClick={doubleDown}
                  className="flex-1 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-sm font-sans font-medium hover:bg-amber-500/20 transition-all"
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  Double
                </motion.button>
              )}
            </div>
          )}

          {/* Result phase */}
          {gameState === "result" && (
            <div className="space-y-3">
              <AnimatePresence>
                {xpChange !== 0 && (
                  <motion.div
                    className="text-center py-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span
                      className="text-2xl font-mono font-bold"
                      style={{ color: xpChange > 0 ? "#4ade80" : "#f87171" }}
                    >
                      {xpChange > 0 ? "+" : ""}{xpChange} XP
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.button
                onClick={() => {
                  setGameState("betting");
                  setPlayerHand([]);
                  setDealerHand([]);
                  setResult(null);
                  setMessage("");
                  setXpChange(0);
                }}
                className="w-full py-3 rounded-xl border text-sm font-sans font-medium transition-all"
                style={{
                  backgroundColor: "var(--accent)",
                  borderColor: "var(--accent)",
                  color: "#000",
                }}
                whileTap={{ scale: 0.97 }}
              >
                Play Again
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-8 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-white/50 text-xs font-sans uppercase tracking-wider mb-3">Stats</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <p className="text-white/70 text-lg font-mono font-bold">{stats.gamesPlayed}</p>
              <p className="text-white/25 text-[10px] font-sans">Games</p>
            </div>
            <div>
              <p className="text-emerald-400 text-lg font-mono font-bold">{winRate}%</p>
              <p className="text-white/25 text-[10px] font-sans">Win Rate</p>
            </div>
            <div>
              <p className="text-emerald-400 text-lg font-mono font-bold">+{stats.xpWon}</p>
              <p className="text-white/25 text-[10px] font-sans">XP Won</p>
            </div>
            <div>
              <p className="text-red-400 text-lg font-mono font-bold">-{stats.xpLost}</p>
              <p className="text-white/25 text-[10px] font-sans">XP Lost</p>
            </div>
          </div>
          {stats.biggestWin > 0 && (
            <div className="mt-3 pt-3 border-t border-white/[0.04] flex items-center gap-2">
              <span className="text-amber-400 text-xs">&#127942;</span>
              <span className="text-white/30 text-xs font-sans">Biggest win: <span className="text-amber-400 font-mono">{stats.biggestWin} XP</span></span>
            </div>
          )}
        </motion.div>

        {/* Shop link */}
        <motion.button
          onClick={() => router.push("/shop")}
          className="mt-4 w-full py-3 rounded-xl border border-amber-500/15 bg-amber-500/[0.04] text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/[0.08] text-sm font-sans transition-all flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span>&#128722;</span> Spend your winnings in the XP Shop
        </motion.button>
      </main>
    </PageTransition>
  );
}
