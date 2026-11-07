import { periodPhrase, type ContributorPeriodStats, type ContributorProfile, type Period } from '@angularians/shared'
import { formatPoints, formatRank, plural } from '../leaderboard/number-format'

/** A profile's title and description, for the tab, search results and link previews. */
export function profileHead(person: ContributorProfile, stats: ContributorPeriodStats, period: Period): { title: string, description: string } {
  const who = person.name?.trim() || person.username
  const title = period === 'all'
    ? `${who}, Angularian ${formatRank(stats.rank)}`
    : `${who}: ${formatRank(stats.rank)} ${periodPhrase(period)}`
  const description = `${who === person.username ? who : `${who} (@${person.username})`} merged ${plural(stats.pullRequests.all, 'pull request', 'pull requests')}, opened ${plural(stats.issues, 'issue', 'issues')} and wrote ${plural(stats.comments + stats.reviewComments, 'comment', 'comments')} in Angular ${periodPhrase(period)}: ${formatRank(stats.rank)} with ${formatPoints(stats.score)}.`
  return { title, description }
}
