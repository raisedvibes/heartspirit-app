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
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">New Entry</h2>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="w-9 h-9 p-0">
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Writing Prompts */}
      <Card className="p-4 bg-card border-border shadow-sm">
        <div className="flex items-center mb-3">
          <Sparkles className="w-4 h-4 text-accent mr-2" />
          <h3 className="text-sm font-semibold text-card-foreground">Writing Prompts</h3>
        </div>
        <div className="space-y-2">
          {prompts.map((prompt, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => usePrompt(prompt)}
              className={`w-full p-2 text-left text-xs rounded-lg transition-all duration-200 ${
                selectedPrompt === prompt
                  ? "bg-accent/10 text-accent border border-accent/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </Card>

      {/* Editor Form */}
      <Card className="p-6 bg-card border-border shadow-sm">
        <div className="space-y-4">
          {/* Title Input */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Title (optional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your entry a title..."
              className="bg-input border-border focus:border-accent focus:ring-accent/20"
            />
          </div>

          {/* Content Textarea */}
          <div>
            <label className="text-sm font-medium text-card-foreground mb-2 block">Your thoughts</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your thoughts..."
              className="min-h-[200px] bg-input border-border focus:border-accent focus:ring-accent/20 resize-none"
            />
          </div>

          {/* Character Count */}
          <div className="text-xs text-muted-foreground text-right">{content.length} characters</div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} className="bg-transparent">
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
