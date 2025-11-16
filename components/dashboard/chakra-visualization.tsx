"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"

const chakras = [
  { name: "Root", color: "bg-red-500", position: "bottom-2" },
  { name: "Sacral", color: "bg-orange-500", position: "bottom-8" },
  { name: "Solar", color: "bg-yellow-500", position: "bottom-14" },
  { name: "Heart", color: "bg-green-500", position: "bottom-20" },
  { name: "Throat", color: "bg-blue-500", position: "bottom-26" },
  { name: "Third Eye", color: "bg-indigo-500", position: "bottom-32" },
  { name: "Crown", color: "bg-purple-500", position: "bottom-38" },
]

export function ChakraVisualization() {
  return (
    <Card className="p-6 bg-card border-border shadow-sm">
      <div className="flex items-center mb-6">
        <div className="w-6 h-6 bg-gradient-to-r from-accent to-purple-500 rounded-full mr-3" />
        <h3 className="text-lg font-semibold text-card-foreground">Energy Centers</h3>
      </div>

      <div className="relative">
        {/* Central Figure Outline */}
        <div className="mx-auto w-24 h-48 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/30 to-muted/10 rounded-full opacity-50" />

          {/* Chakra Points */}
          {chakras.map((chakra, index) => (
            <motion.div
              key={chakra.name}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className={`absolute left-1/2 transform -translate-x-1/2 ${chakra.position}`}
            >
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                }}
                transition={{
                  duration: 2,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 0.3,
                }}
                className={`w-4 h-4 ${chakra.color} rounded-full shadow-lg`}
              />
            </motion.div>
          ))}
        </div>

        {/* Chakra Legend */}
        <div className="mt-6 grid grid-cols-4 gap-2 text-xs">
          {chakras.slice(0, 4).map((chakra) => (
            <div key={chakra.name} className="flex items-center">
              <div className={`w-2 h-2 ${chakra.color} rounded-full mr-1`} />
              <span className="text-muted-foreground">{chakra.name}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
          {chakras.slice(4).map((chakra) => (
            <div key={chakra.name} className="flex items-center">
              <div className={`w-2 h-2 ${chakra.color} rounded-full mr-1`} />
              <span className="text-muted-foreground">{chakra.name}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
