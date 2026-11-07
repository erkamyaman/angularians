import { periodPhrase, type ContributorPeriodStats, type ContributorProfile, type Period } from '@angularians/shared'
import { contributionSentence } from '../text/contribution-sentence'
import { formatPoints, formatRank } from '../text/number-format'

/** A profile's title and description, for the tab, search results and link previews. */
export function profileHead(person: ContributorProfile, stats: ContributorPeriodStats, period: Period): { title: string, description: string } {
  const who = person.name?.trim() || person.username
  const title = period === 'all'
    ? `${who}, Angularian ${formatRank(stats.rank)}`
    : `${who}: ${formatRank(stats.rank)} ${periodPhrase(period)}`
  const subject = who === person.username ? who : `${who} (@${person.username})`
  const description = `${contributionSentence(subject, { ...stats, pullRequests: stats.pullRequests.all }, period)} Ranked ${formatRank(stats.rank)} with ${formatPoints(stats.score)}.`
  return { title, description }
}
