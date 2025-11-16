import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

// 1. Load env variables
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// 2. Read your local practices.json
const practices = JSON.parse(fs.readFileSync('./data/practices.json', 'utf-8'))

async function seed() {
  for (const practice of practices) {
    // Insert ritual
    const { data: ritual, error: ritualError } = await supabase
      .from('rituals')
      .insert({
        title: practice.title,
        description: practice.title, // or use practice.description if you’ve added it
        category: practice.category,
        duration: practice.duration,
        media_url: practice.media?.audio || null
      })
      .select()
      .single()

    if (ritualError) {
      console.error('Error inserting ritual:', ritualError)
      continue
    }

    const ritualId = ritual.id

    // Insert steps
    if (practice.steps) {
      for (let i = 0; i < practice.steps.length; i++) {
        const step = practice.steps[i]
        await supabase.from('ritual_steps').insert({
          ritual_id: ritualId,
          step_number: i + 1,
          step_text: step
        })
      }
    }

    // Insert recommendations
    if (practice.recommendations?.pairs) {
      for (const rec of practice.recommendations.pairs) {
        await supabase.from('ritual_recommendations').insert({
          ritual_id: ritualId,
          energy: rec.energy,
          feelingtone: rec.feelingtone,
          priority: rec.priority
        })
      }
    }
  }

  console.log('✅ Seeding complete!')
}

seed()
