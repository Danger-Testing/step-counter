import { createLinkCode } from "@/lib/store"
import { errorResponse } from "@/lib/errors"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { appUserId } = body

    if (!appUserId || typeof appUserId !== "string") {
      return Response.json({ error: "Missing appUserId" }, { status: 400 })
    }

    const { code, expiresAt } = await createLinkCode(appUserId)

    return Response.json({ code, expiresAt })
  } catch (e) {
    return errorResponse(e)
  }
}
