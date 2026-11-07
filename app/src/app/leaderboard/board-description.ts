import { periodPhrase, type Period } from '@angularians/shared'
import { plural } from '../text/plural'

export type BoardCounts = { total: number, landedPullRequests: number, issues: number, comments: number, reviewComments: number }

/** A board's numbers in a sentence, for the shared board's description and its preview image. */
export function boardDescription(board: BoardCounts, period: Period): string {
  return `${plural(board.total, 'person', 'people')} contributed to Angular ${periodPhrase(period)}: ${plural(board.landedPullRequests, 'merged pull request', 'merged pull requests')}, ${plural(board.issues, 'issue', 'issues')} and ${plural(board.comments + board.reviewComments, 'comment', 'comments')}.`
}
