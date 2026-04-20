import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function saveSteps(userId: string, steps: number): Promise<void> {
  const { error } = await supabase
    .from("steps")
    .upsert({ user_id: userId, steps, updated_at: new Date().toISOString() })

  if (error) throw new Error(error.message)
}

export async function getSteps(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("steps")
    .select("steps")
    .eq("user_id", userId)
    .single()

  if (error) return 0
  return data.steps
}
