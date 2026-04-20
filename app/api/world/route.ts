import { getSteps } from "@/lib/store"

export const dynamic = "force-dynamic"

function getMapConfig(steps: number) {
  if (steps < 2000) return { trees: 1, tower: false }
  if (steps < 5000) return { trees: 4, tower: false }
  if (steps < 8000) return { trees: 8, tower: false }
  if (steps < 12000) return { trees: 12, tower: true }
  return { trees: 20, tower: true }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return Response.json({ error: "Missing userId" }, { status: 400 })
  }

  const steps = getSteps(userId) ?? 0

  return Response.json({
    userId,
    steps,
    mapConfig: getMapConfig(steps),
  })
}
