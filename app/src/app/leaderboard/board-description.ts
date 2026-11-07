import type { Period } from '@angularians/shared'
import { contributionSentence } from '../text/contribution-sentence'
import { plural } from '../text/plural'

export type BoardCounts = { total: number, landedPullRequests: number, issues: number, comments: number, reviewComments: number }

/** A board's numbers in a sentence, for the shared board's description and its preview image. */
export function boardDescription(board: BoardCounts, period: Period): string {
  return contributionSentence(plural(board.total, 'person', 'people'), { ...board, pullRequests: board.landedPullRequests }, period)
}
