"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Crown, Star } from "lucide-react"

export function SubscriptionCard() {
  return (
    <Card className="p-6 bg-gradient-to-r from-accent/10 to-purple-500/10 border-accent/20 shadow-sm h-full flex flex-col">
      <div className="flex-1">
        <div className="flex items-center mb-2">
          <Crown className="w-5 h-5 text-accent mr-2" />
          <h3 className="text-lg font-semibold text-card-foreground">Premium</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Unlock unlimited sessions and advanced features</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <Star className="w-3 h-3 mr-1" />
          <span>7-day free trial</span>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Upgrade</Button>
        </motion.div>
      </div>
    </Card>
  )
}
