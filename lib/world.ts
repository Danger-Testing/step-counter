export interface MapConfig {
  trees: number
  tower: boolean
}

export function getMapConfig(steps: number): MapConfig {
  if (steps < 2000)  return { trees: 1,  tower: false }
  if (steps < 5000)  return { trees: 4,  tower: false }
  if (steps < 8000)  return { trees: 8,  tower: false }
  if (steps < 12000) return { trees: 12, tower: true }
  return { trees: 20, tower: true }
}
