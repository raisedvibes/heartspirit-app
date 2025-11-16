import { supabaseServer } from "@/lib/supabaseServer"

export async function findRecommendedPractice(energy: string, feelingtone: string) {
  const supa = await supabaseServer()

  // Step 1: find the best matching practice_recommendations row
  const { data: recs, error: recErr } = await supa
    .from("practice_recommendations")
    .select("practice_id, priority")
    .eq("energy", energy)
    .eq("feelingtone", feelingtone)
    .order("priority", { ascending: false })
    .limit(1)

  if (recErr || !recs?.length) {
    console.warn("No direct practice match", recErr)
    return null
  }

  const best = recs[0]

  // Step 2: join to the practices table for full details
  const { data: practice, error: pracErr } = await supa
    .from("practices")
    .select("id, title, description, category, duration, media_url")
    .eq("id", best.practice_id)
    .single()

  if (pracErr || !practice) {
    console.warn("Practice lookup error", pracErr)
    return null
  }

  return practice
}
