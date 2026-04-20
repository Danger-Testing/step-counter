// In-memory store — resets on server restart. Swap for a DB later.
const stepStore = new Map<string, number>()

export function saveSteps(userId: string, steps: number): void {
  stepStore.set(userId, steps)
}

export function getSteps(userId: string): number | undefined {
  return stepStore.get(userId)
}
