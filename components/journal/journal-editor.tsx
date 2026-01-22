"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Save, X, Sparkles } from "lucide-react"

interface JournalEditorProps {
  onClose: () => void
  onSave?: (entry: {
    title: string
    content: string
  }) => void
  initialContent?: string
}

const prompts = [
  "What am I grateful for today?",
  "What brought me peace?",
  "How did I honor my energy today?",
  "What challenged me and how did I respond?",
  "My intention is...",
]

// Same glass recipe you’re already using
const GLASS_CARD =
  "bg-black/25 backdrop-blur-xl border border-white/25 text-white " +
  "shadow-[0_18px_60px_-34px_rgba(0,0,0,0.85)]"

const GLASS_CARD_HOVER = "hover:bg-black/30 hover:border-white/35 transition"

const GLASS_ICON_BTN =
  "w-9 h-9 p-0 rounded-xl bg-black/20 border border-white/20 text-white " +
  "hover:bg-black/30 hover:border-white/35 transition backdrop-blur-md"

export function JournalEditor({ onClose, onSave, initialContent = "" }: JournalEditorProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState(initialContent)
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)

  const handleSave = () => {
    if (!title.trim() && !content.trim()) return
    onSave?.({ title: title.trim(), content: content.trim() })
  }

  const usePrompt = (prompt: string) => {
    setContent(prompt + "\n\n")
    setSelectedPrompt(prompt)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Journal</h2>

        <Button variant="ghost" size="sm" onClick={onClose} className={GLASS_ICON_BTN}>
          <X className="w-4 h-4 text-white" />
        </Button>
      </div>

      {/* Writing Prompts */}
      <Card className={`p-4 rounded-2xl ${GLASS_CARD} ${GLASS_CARD_HOVER}`}>
        <div className="flex items-center mb-3">
          <Sparkles className="w-4 h-4 text-white mr-2" />
          <h3 className="text-sm font-semibold text-white">Reflections</h3>
        </div>

        <div className="space-y-2">
          {prompts.map((prompt, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => usePrompt(prompt)}
              className={`w-full p-2 text-left text-xs rounded-lg border transition-all backdrop-blur-sm ${
                selectedPrompt === prompt
                  ? "bg-accent/20 text-white border-accent/40"
                  : "bg-black/20 text-white/85 border-white/20 hover:bg-black/30 hover:border-white/30"
              }`}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Editor Form */}
      <Card className={`p-6 rounded-2xl ${GLASS_CARD} ${GLASS_CARD_HOVER}`}>
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block mb-2 text-sm font-medium text-white/90">
              Title (optional)
            </label>
           <Input
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  placeholder="Entry title..."
  className="
    bg-black/20 text-white placeholder-white/40
    backdrop-blur-sm
    border-white/20
    focus:border-white/40 focus:ring-accent/20
  "
/>

          </div>

          {/* Content */}
          <div>
            <label className="block mb-2 text-sm font-medium text-white/90">
              Your thoughts
            </label>
            <Textarea
  value={content}
  onChange={(e) => setContent(e.target.value)}
  placeholder="Start writing your thoughts..."
  className="
    min-h-[200px] resize-none
    bg-black/20 text-white placeholder-white/40
    backdrop-blur-sm
    border-white/20
    focus:border-white/40 focus:ring-accent/20
  "
/>

          </div>

          {/* Character Count */}
          <div className="text-xs text-white/70 text-right">
            {content.length} characters
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            {/* Cancel */}
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white/55 hover:bg-transparent hover:text-white/55"
            >
              Cancel
            </Button>

            {/* Save */}
            <Button
              onClick={handleSave}
              disabled={!content.trim() && !title.trim()}
              className="
                rounded-xl bg-black/30 border border-white/25 text-white
                shadow-[0_12px_40px_-26px_rgba(0,0,0,0.85)]
                backdrop-blur-md transition-colors
                enabled:hover:bg-white/12 enabled:hover:border-white/55
                disabled:opacity-40 disabled:cursor-not-allowed
              "
            >
              <Save className="w-4 h-4 mr-2 text-white" />
              Save Entry
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
