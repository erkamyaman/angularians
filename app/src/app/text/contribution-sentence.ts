import { periodPhrase, type Period } from '@angularians/shared'
import { plural } from './plural'

/** What someone, or a board's people, did: comments include the review comments on code. */
export type ContributionCounts = { pullRequests: number, issues: number, comments: number, reviewComments: number }

/** `2,194 people contributed to Angular in 2025: 1,203 merged pull requests, 512 issues and 9,876 comments.` */
export function contributionSentence(who: string, counts: ContributionCounts, period: Period): string {
  return `${who} contributed to Angular ${periodPhrase(period)}: ${plural(counts.pullRequests, 'merged pull request', 'merged pull requests')}, ${plural(counts.issues, 'issue', 'issues')} and ${plural(counts.comments + counts.reviewComments, 'comment', 'comments')}.`
}
