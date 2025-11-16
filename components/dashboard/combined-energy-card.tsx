"use client"

import { motion } from "framer-motion"
import { EnergyCheck } from "@/components/dashboard/energy-check"
import { cn } from "@/lib/utils"   // Tailwind merge util (make sure this exists)

/* ---------------- ChakraDots ---------------- */
const ChakraDots = () => {
  const dots = [
    { name: "Crown", color: "#7E57C2", glow: "rgba(126,87,194,0.55)" },
    { name: "Third Eye", color: "#5C6BC0", glow: "rgba(92,107,192,0.55)" },
    { name: "Throat", color: "#42A5F5", glow: "rgba(66,165,245,0.55)" },
    { name: "Heart", color: "#66BB6A", glow: "rgba(102,187,106,0.55)" },
    { name: "Solar", color: "#FDD835", glow: "rgba(253,216,53,0.55)" },
    { name: "Sacral", color: "#FB8C00", glow: "rgba(251,140,0,0.55)" },
    { name: "Root", color: "#EF5350", glow: "rgba(239,83,80,0.55)" },
  ]

  return (
    <div className="relative mx-auto w-full max-w-[180px] py-3">
      <div
        aria-hidden
        className="absolute left-1/2 top-2 bottom-2 -translate-x-1/2 w-px bg-gradient-to-b from-gray-200 to-gray-300"
      />
      <ul className="relative min-h-[180px] sm:min-h-[220px] flex flex-col items-center justify-between gap-3">
        {dots.map((d, i) => (
          <motion.span
            key={i}
            className="block rounded-full ring-2 ring-white h-4 w-4 sm:h-5 sm:w-5"
            style={{ backgroundColor: d.color }}
            animate={{
              scale: [1, 1.2, 1],
              y: [0, -1, 0],
              boxShadow: [`0 0 12px ${d.glow}`, "0 0 0 transparent"],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              delay: i * 0.14,
              ease: "easeInOut",
            }}
          />
        ))}
      </ul>
    </div>
  )
}

/* ---------------- CombinedEnergyCard ---------------- */
export const CombinedEnergyCard = ({ className }: { className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 22 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.8 }}
    className={cn("w-full", className)}
  >
    <div className="w-full rounded-2xl bg-white/20 backdrop-blur-md p-4 sm:p-5 shadow-md border border-white/30">
      <ChakraDots />
      <div className="my-3 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      <div className="w-full text-center text-white">
        <EnergyCheck />
      </div>
    </div>
  </motion.div>

)
