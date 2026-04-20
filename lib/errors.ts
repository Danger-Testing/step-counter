export class AppError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = "AppError"
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof AppError) {
    return Response.json({ error: e.message }, { status: e.status })
  }
  console.error(e)
  return Response.json({ error: "Internal server error" }, { status: 500 })
}
