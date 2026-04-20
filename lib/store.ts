import { db } from "./db"
import { AppError } from "./errors"

const CODE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// ── Link codes ────────────────────────────────────────────────────────────────

export async function createLinkCode(appUserId: string) {
  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MS)

  const { error } = await db.from("link_codes").insert({
    code,
    app_user_id: appUserId,
    expires_at: expiresAt.toISOString(),
  })

  if (error) throw new Error(error.message)
  return { code, expiresAt }
}

export async function consumeLinkCode(code: string): Promise<string> {
  const { data, error } = await db
    .from("link_codes")
    .select("*")
    .eq("code", code)
    .single()

  if (error || !data) throw new AppError(404, "Code not found")
  if (data.used_at)   throw new AppError(409, "Code already used")
  if (new Date(data.expires_at) < new Date()) throw new AppError(409, "Code expired")

  const { error: updateError } = await db
    .from("link_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("code", code)

  if (updateError) throw new Error(updateError.message)
  return data.app_user_id as string
}

// ── Roblox links ──────────────────────────────────────────────────────────────

export async function upsertRobloxLink(robloxUserId: string, appUserId: string) {
  const { error } = await db.from("roblox_links").upsert({
    roblox_user_id: robloxUserId,
    app_user_id:    appUserId,
    linked_at:      new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
}

export async function resolveRobloxUser(robloxUserId: string): Promise<string | null> {
  const { data, error } = await db
    .from("roblox_links")
    .select("app_user_id")
    .eq("roblox_user_id", robloxUserId)
    .single()

  if (error || !data) return null
  return data.app_user_id as string
}

// ── Steps / checkins ──────────────────────────────────────────────────────────

export async function saveSteps(appUserId: string, steps: number) {
  const { error } = await db.from("checkins").upsert({
    app_user_id: appUserId,
    steps,
    updated_at: new Date().toISOString(),
  })

  if (error) throw new Error(error.message)
}

export async function getSteps(appUserId: string): Promise<number> {
  const { data, error } = await db
    .from("checkins")
    .select("steps")
    .eq("app_user_id", appUserId)
    .single()

  if (error || !data) return 0
  return data.steps as number
}
