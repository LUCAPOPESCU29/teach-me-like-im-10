"use client";

import { motion } from "framer-motion";

interface Participant {
  id: string;
  name: string;
  score: number | null;
  total: number;
  completedAt: string | null;
}

interface PodiumProps {
  participants: Participant[];
  maxParticipants: number;
}

const MEDALS = ["&#129351;", "&#129352;", "&#129353;"]; // gold, silver, bronze
const MEDAL_COLORS = ["#facc15", "#94a3b8", "#d97706"];
const MEDAL_GLOWS = ["rgba(250,204,21,0.08)", "rgba(148,163,184,0.06)", "rgba(217,119,6,0.06)"];
const HEIGHTS = [160, 120, 90];

export default function Podium({ participants, maxParticipants }: PodiumProps) {
  const completed = participants.filter((p) => p.completedAt != null);
  const waiting = participants.filter((p) => p.completedAt == null);
  const sorted = [...completed].sort((a, b) => (b.score || 0) - (a.score || 0));

  // Podium order: 2nd, 1st, 3rd (left, center, right)
  const podiumSlots = [sorted[1] || null, sorted[0] || null, sorted[2] || null];

  return (
    <div>
      {/* Podium */}
      <div className="flex items-end justify-center gap-4 mb-8">
        {podiumSlots.map((participant, displayIdx) => {
          // displayIdx 0=left(2nd), 1=center(1st), 2=right(3rd)
          const rank = displayIdx === 0 ? 1 : displayIdx === 1 ? 0 : 2;
          const height = HEIGHTS[rank];

          return (
            <motion.div
              key={displayIdx}
              className="flex flex-col items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: rank * 0.3 + 0.2, duration: 0.5 }}
            >
              {participant ? (
                <>
                  <div
                    className="text-2xl mb-2"
                    dangerouslySetInnerHTML={{ __html: MEDALS[rank] }}
                  />
                  <p className="text-white font-sans text-sm mb-1 truncate max-w-[100px] text-center">
                    {participant.name}
                  </p>
                  <p
                    className="font-mono text-lg font-bold mb-2"
                    style={{ color: MEDAL_COLORS[rank] }}
                  >
                    {participant.score}/{participant.total}
                  </p>
                </>
              ) : (
                <>
                  <div className="text-2xl mb-2 opacity-20" dangerouslySetInnerHTML={{ __html: MEDALS[rank] }} />
                  <p className="text-white/20 font-sans text-xs mb-1">Waiting...</p>
                  <p className="text-white/10 font-mono text-lg mb-2">-/-</p>
                </>
              )}
              <motion.div
                className="rounded-t-xl w-24 sm:w-28 relative overflow-hidden"
                style={{
                  backgroundColor: participant
                    ? `${MEDAL_COLORS[rank]}10`
                    : "rgba(255,255,255,0.015)",
                  borderTop: `2px solid ${participant ? MEDAL_COLORS[rank] : "rgba(255,255,255,0.04)"}`,
                  borderLeft: `1px solid ${participant ? `${MEDAL_COLORS[rank]}20` : "rgba(255,255,255,0.04)"}`,
                  borderRight: `1px solid ${participant ? `${MEDAL_COLORS[rank]}20` : "rgba(255,255,255,0.04)"}`,
                  boxShadow: participant ? `0 -8px 30px ${MEDAL_GLOWS[rank]}` : "none",
                }}
                initial={{ height: 0 }}
                animate={{ height }}
                transition={{ delay: rank * 0.3 + 0.4, duration: 0.6, ease: "easeOut" }}
              >
                <div className="flex items-center justify-center h-full">
                  <span
                    className="font-mono text-3xl font-bold"
                    style={{ color: participant ? `${MEDAL_COLORS[rank]}40` : "rgba(255,255,255,0.05)" }}
                  >
                    {rank + 1}
                  </span>
                </div>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* 4th participant (if any) */}
      {sorted[3] && (
        <motion.div
          className="flex items-center justify-center gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02] max-w-xs mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <span className="text-white/30 font-mono text-sm">4th</span>
          <span className="text-white/60 font-sans text-sm">{sorted[3].name}</span>
          <span className="text-white/40 font-mono text-sm ml-auto">
            {sorted[3].score}/{sorted[3].total}
          </span>
        </motion.div>
      )}

      {/* Waiting participants */}
      {waiting.length > 0 && (
        <motion.div
          className="mt-6 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <p className="text-white/20 font-mono text-xs mb-2">Still playing...</p>
          <div className="flex justify-center gap-3">
            {waiting.map((p) => (
              <span key={p.id} className="text-white/30 font-sans text-sm">
                {p.name}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty slots */}
      {participants.length < maxParticipants && (
        <motion.p
          className="text-center text-white/15 font-mono text-xs mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          {maxParticipants - participants.length} spot{maxParticipants - participants.length !== 1 ? "s" : ""} left
        </motion.p>
      )}
    </div>
  );
}
