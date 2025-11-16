import { supabase } from '@/lib/supabase'

export default async function TestPage() {
  const { data: rituals, error } = await supabase
    .from('rituals')
    .select(`
      id,
      title,
      description,
      category,
      duration,
      media_url,
      ritual_steps(step_number, step_text),
      ritual_recommendations(energy, feelingtone, priority)
    `)

  if (error) {
    console.error("Supabase error:", error.message)
    return <div>Error: {error.message}</div>
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Supabase Rituals</h1>
      {rituals?.map((ritual) => (
        <div key={ritual.id} style={{ marginBottom: "2rem" }}>
          <h2>{ritual.title}</h2>
          <p>{ritual.description}</p>

          <h3>Steps</h3>
          <ul>
            {ritual.ritual_steps?.map((step) => (
              <li key={step.step_number}>{step.step_text}</li>
            ))}
          </ul>

          <h3>Recommendations</h3>
          <ul>
            {ritual.ritual_recommendations?.map((rec, i) => (
              <li key={i}>
                {rec.energy} energy | {rec.feelingtone} | priority {rec.priority}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
