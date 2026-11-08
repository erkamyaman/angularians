import { amountOf, ContributorsAccumulator, KINDS, mergeRecords, score, type AdvisoryInput, type ContributorRecord, type Period } from '@angularians/shared'

/** Replace only advisory activity in an existing snapshot, using its date for rolling periods. */
export function refreshAdvisoryRecords(
  existing: ReadonlyMap<Period, readonly ContributorRecord[]>,
  advisories: readonly AdvisoryInput[],
  snapshotDate: Date,
): Map<Period, ContributorRecord[]> {
  const accumulator = new ContributorsAccumulator(snapshotDate)
  for (const advisory of advisories) accumulator.addAdvisory(advisory)
  const credits = accumulator.records()
  const refreshed = new Map<Period, ContributorRecord[]>()
  for (const period of new Set([...existing.keys(), ...credits.keys()])) {
    const activity = (existing.get(period) ?? []).map((record) => {
      const counts = { ...record, pullRequests: { ...record.pullRequests }, advisories: 0 }
      delete counts.advisoryCredits
      return { ...counts, score: score(counts) }
    }).filter(record => KINDS.some(kind => kind.key !== 'advisories' && amountOf(record, kind) > 0))
    refreshed.set(period, mergeRecords([activity, credits.get(period) ?? []]))
  }
  return refreshed
}
