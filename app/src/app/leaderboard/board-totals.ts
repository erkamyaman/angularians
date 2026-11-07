import { countryName } from '@angularians/shared'
import type { BoardCounts } from './board-description'
import type { GithubColor } from './github-color'
import { pluralWord } from '../text/plural'

/** The totals over a board, each in its GitHub colour (none for the people): `2,194` and `contributors from Germany`. */
export function boardTotals(board: BoardCounts & { country: string | null }): { icon: string, color: GithubColor | null, value: number, words: string }[] {
  const comments = board.comments + board.reviewComments
  const from = board.country ? ` from ${countryName(board.country)}` : ''
  return [
    { icon: 'remixGroupLine', color: null, value: board.total, words: pluralWord(board.total, 'contributor', 'contributors') + from },
    { icon: 'octGitMerge', color: 'purple', value: board.landedPullRequests, words: pluralWord(board.landedPullRequests, 'merged PR', 'merged PRs') },
    { icon: 'octIssueOpened', color: 'green', value: board.issues, words: pluralWord(board.issues, 'issue', 'issues') },
    { icon: 'octComment', color: 'blue', value: comments, words: pluralWord(comments, 'comment', 'comments') },
  ]
}
