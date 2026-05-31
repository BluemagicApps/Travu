"use client";

import { motion } from "framer-motion";

export type VoiceOrbState = "idle" | "listening" | "speaking";

export function VoiceOrb({
  state,
  size = 40,
}: {
  state: VoiceOrbState;
  size?: number;
}) {
  const haloScale =
    state === "listening" ? [1, 1.4, 1] : state === "speaking" ? [1, 1.15, 1] : 1;
  const orbScale = state === "listening" ? [1, 1.06, 1] : 1;
  const halo = size * 1.5;

  return (
    <div
      className="relative grid shrink-0 place-items-center"
      style={{ width: halo, height: halo }}
      aria-hidden
    >
      <motion.span
        className="absolute rounded-full"
        style={{
          width: halo,
          height: halo,
          backgroundImage: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
          opacity: state === "idle" ? 0.18 : 0.4,
          filter: "blur(8px)",
        }}
        animate={state === "idle" ? { scale: 1 } : { scale: haloScale }}
        transition={{
          duration: state === "listening" ? 1.0 : 1.6,
          repeat: state === "idle" ? 0 : Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.span
        className="relative rounded-full shadow-lg"
        style={{
          width: size,
          height: size,
          backgroundImage: "linear-gradient(135deg, var(--accent-from), var(--accent-to))",
        }}
        animate={state === "listening" ? { scale: orbScale } : { scale: 1 }}
        transition={{ duration: 1.4, repeat: state === "listening" ? Infinity : 0, ease: "easeInOut" }}
      />
      {state === "speaking" && (
        <motion.span
          className="absolute inset-0 rounded-full ring-2 ring-white/60"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </div>
  );
}
