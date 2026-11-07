/** Years as ranges: [2019, 2024, 2025, 2026] → "2019, 2024–2026". */
export function yearRanges(years: readonly number[]): string {
  const parts: string[] = []
  for (let i = 0; i < years.length; i++) {
    let j = i
    while (j + 1 < years.length && years[j + 1] === years[j]! + 1) j++
    parts.push(j > i ? `${years[i]}–${years[j]}` : `${years[i]}`)
    i = j
  }
  return parts.join(', ')
}
