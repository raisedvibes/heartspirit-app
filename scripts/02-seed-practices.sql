-- Insert some example practices
INSERT INTO practices (title, description, category, duration)
VALUES
  ('Box Breathing', 'A calming 4-4-4-4 breath pattern to reduce anxiety and center yourself.', 'Breathwork', 5),
  ('Body Scan Meditation', 'Gentle awareness practice to release tension and reconnect with your body.', 'Meditation', 10),
  ('Gratitude Reflection', 'Reflect on three things you''re grateful for to shift your mood.', 'Journaling', 5),
  ('Nature Walk', 'Step outside and connect with the natural world around you.', 'Movement', 15),
  ('Loving Kindness', 'Send compassion to yourself and others through guided metta practice.', 'Meditation', 8)
ON CONFLICT DO NOTHING;

-- Get practice IDs for recommendations (using a CTE for clarity)
WITH practice_ids AS (
  SELECT id, title FROM practices
)
-- Insert practice recommendations
INSERT INTO practice_recommendations (practice_id, energy, feelingtone, priority)
SELECT 
  p.id,
  rec.energy,
  rec.feelingtone,
  rec.priority
FROM practice_ids p
CROSS JOIN LATERAL (
  VALUES
    -- Box Breathing recommendations
    ('Moderate', 'Anxious', 10),
    ('Low', 'Anxious', 9),
    ('High', 'Anxious', 8),
    
    -- Body Scan recommendations
    ('Low', 'Tired', 10),
    ('Moderate', 'Stressed', 9),
    ('Low', 'Sad', 8),
    
    -- Gratitude recommendations
    ('Moderate', 'Sad', 10),
    ('Low', 'Lonely', 9),
    ('Peak', 'Joyful', 7),
    
    -- Nature Walk recommendations
    ('Moderate', 'Restless', 10),
    ('High', 'Energized', 9),
    ('Peak', 'Inspired', 8),
    
    -- Loving Kindness recommendations
    ('Low', 'Lonely', 10),
    ('Moderate', 'Sad', 9),
    ('Moderate', 'Angry', 8)
) AS rec(energy, feelingtone, priority)
WHERE 
  (p.title = 'Box Breathing' AND rec.energy IN ('Moderate', 'Low', 'High') AND rec.feelingtone = 'Anxious')
  OR (p.title = 'Body Scan Meditation' AND rec.energy = 'Low' AND rec.feelingtone IN ('Tired', 'Sad') OR rec.energy = 'Moderate' AND rec.feelingtone = 'Stressed')
  OR (p.title = 'Gratitude Reflection' AND (rec.energy = 'Moderate' OR rec.energy = 'Low' OR rec.energy = 'Peak') AND rec.feelingtone IN ('Sad', 'Lonely', 'Joyful'))
  OR (p.title = 'Nature Walk' AND (rec.energy IN ('Moderate', 'High', 'Peak')) AND rec.feelingtone IN ('Restless', 'Energized', 'Inspired'))
  OR (p.title = 'Loving Kindness' AND (rec.energy IN ('Low', 'Moderate')) AND rec.feelingtone IN ('Lonely', 'Sad', 'Angry'))
ON CONFLICT (practice_id, energy, feelingtone) DO NOTHING;
