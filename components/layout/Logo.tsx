"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { PlaneTakeoff } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="TRAVU home">
      <motion.span
        initial={{ rotate: -10 }}
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.12, rotate: 0 }}
        whileTap={{ scale: 0.94 }}
        className="btn-accent grid h-10 w-10 place-items-center rounded-2xl shadow-lg shadow-sky-500/30 ring-1 ring-white/20"
      >
        <PlaneTakeoff className="h-5 w-5 text-white" strokeWidth={2.75} />
      </motion.span>
      <span className="text-gradient text-2xl font-black tracking-tight sm:text-[1.7rem]">
        TRAVU
      </span>
    </Link>
  );
}
