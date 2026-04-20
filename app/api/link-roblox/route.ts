import { consumeLinkCode, upsertRobloxLink } from "@/lib/store"
import { errorResponse } from "@/lib/errors"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { robloxUserId, code } = body

    if (!robloxUserId || typeof robloxUserId !== "string") {
      return Response.json({ error: "Missing robloxUserId" }, { status: 400 })
    }
    if (!code || typeof code !== "string") {
      return Response.json({ error: "Missing code" }, { status: 400 })
    }

    const appUserId = await consumeLinkCode(code)
    await upsertRobloxLink(robloxUserId, appUserId)

    return Response.json({ ok: true, appUserId })
  } catch (e) {
    return errorResponse(e)
  }
}
