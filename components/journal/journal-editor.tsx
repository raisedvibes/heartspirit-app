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
    mood?: "peaceful" | "grateful" | "centered" | "intentional"
  }) => void
  initialContent?: string
}

const prompts = [
  "What am I grateful for today?",
  "How did I honor my energy today?",
  "What brought me peace?",
  "What challenged me and how did I grow?",
  "What intention do I set for tomorrow?",
]

export function JournalEditor({
  onClose,
  onSave,
  initialContent = "",
}: JournalEditorProps) {
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
        <h2 className="text-lg font-semibold text-neutral-900">
          New Entry
        </h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="w-9 h-9 p-0 text-neutral-600 hover:text-neutral-900"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Writing Prompts */}
      <Card className="p-4 bg-white text-neutral-900 border-neutral-200 shadow-md">
        <div className="flex items-center mb-3">
          <Sparkles className="w-4 h-4 text-accent mr-2" />
          <h3 className="text-sm font-semibold">
            Writing Prompts
          </h3>
        </div>

        <div className="space-y-2">
          {prompts.map((prompt, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => usePrompt(prompt)}
              className={`w-full p-2 text-left text-xs rounded-lg border transition-all ${
                selectedPrompt === prompt
                  ? "bg-accent/10 text-accent border-accent/30"
                  : "bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Editor Form */}
      <Card className="p-6 bg-white text-neutral-900 border-neutral-200 shadow-lg">
        <div className="space-y-4">
          {/* Title */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Title (optional)
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title..."
              className="bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300 focus:border-accent focus:ring-accent/20"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block mb-2 text-sm font-medium">
              Your thoughts
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your thoughts..."
              className="min-h-[200px] bg-white text-neutral-900 placeholder-neutral-400 border-neutral-300 focus:border-accent focus:ring-accent/20 resize-none"
            />
          </div>

          {/* Character Count */}
          <div className="text-xs text-neutral-500 text-right">
            {content.length} characters
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              Cancel
            </Button>

            <Button
              onClick={handleSave}
              disabled={!content.trim() && !title.trim()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Entry
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
