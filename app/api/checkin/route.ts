import { saveSteps } from "@/lib/store"

export async function POST(req: Request) {
  const body = await req.json()
  const { userId, steps } = body

  if (!userId || typeof steps !== "number") {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  saveSteps(userId, steps)

  return Response.json({ ok: true, userId, steps })
}
