import { resolveRobloxUser, getSteps } from "@/lib/store"
import { getMapConfig } from "@/lib/world"
import { errorResponse, AppError } from "@/lib/errors"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const robloxUserId = searchParams.get("robloxUserId")

    if (!robloxUserId) {
      return Response.json({ error: "Missing robloxUserId" }, { status: 400 })
    }

    const appUserId = await resolveRobloxUser(robloxUserId)
    if (!appUserId) {
      throw new AppError(404, "Roblox account not linked")
    }

    const steps = await getSteps(appUserId)

    return Response.json({
      robloxUserId,
      appUserId,
      steps,
      mapConfig: getMapConfig(steps),
    })
  } catch (e) {
    return errorResponse(e)
  }
}
