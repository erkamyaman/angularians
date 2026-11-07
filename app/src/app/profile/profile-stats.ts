import { periodPhrase, reposQuery, type ContributorPeriodStats, type Period } from '@angularians/shared'
import { formatNumber } from '../text/number-format'
import { plural } from '../text/plural'
import { STAT_NAMES, statWord } from '../text/stat-names'

/** One card of the profile: a kind of contribution in the period on screen. */
export interface ProfileStat {
  key: string
  icon: string
  value: number
  name: string
  detail: string
  /** The GitHub search that lists them, or `null` when GitHub cannot. */
  url: string | null
  label: string
  tint: string
}

function githubSearch(q: string, type: 'pullrequests' | 'issues'): string {
  return `https://github.com/search?${new URLSearchParams({ q: `${reposQuery()} ${q}`, type })}`
}

/** One card per kind of contribution; the ones GitHub can search link to that search. */
export function profileStats(username: string, stats: ContributorPeriodStats, period: Period): ProfileStat[] {
  const prs = stats.pullRequests
  return [
    {
      key: 'pullRequests', icon: 'octGitMerge', value: prs.all, name: statWord('pullRequests', prs.all),
      detail: `${formatNumber(prs.feat)} feat · ${formatNumber(prs.fix)} fix · ${formatNumber(prs.docs)} docs · ${formatNumber(prs.chore)} chore`,
      // GitHub shows most landed PRs as closed (PR Close): this lists all of them, landed or not.
      // The label starts with the card's visible text ("253 Merged PRs"), so speech input can name it.
      url: githubSearch(`is:pr author:${username}`, 'pullrequests'), label: `${plural(prs.all, ...STAT_NAMES.pullRequests)} ${periodPhrase(period)}. Opens ${username}'s pull requests on GitHub`,
      tint: 'merges',
    },
    {
      key: 'issues', icon: 'octIssueOpened', value: stats.issues, name: statWord('issues', stats.issues), detail: `${formatNumber(stats.helpfulIssues)} helpful`,
      url: githubSearch(`is:issue author:${username}`, 'issues'), label: `${plural(stats.issues, ...STAT_NAMES.issues)} ${periodPhrase(period)}. Opens ${username}'s issues on GitHub`,
      tint: 'issues',
    },
    {
      key: 'comments', icon: 'octComment', value: stats.comments, name: statWord('comments', stats.comments),
      // Inline review comments score on their own (1 pt each): their count goes with the comments.
      detail: `${formatNumber(stats.helpfulComments)} helpful · ${plural(stats.reviewComments, 'review comment', 'review comments')} on code`,
      url: githubSearch(`commenter:${username}`, 'issues'), label: `${plural(stats.comments, ...STAT_NAMES.comments)} ${periodPhrase(period)}. Opens the issues and pull requests ${username} commented on, on GitHub`,
      tint: 'comments',
    },
    {
      key: 'reactions', icon: 'octSmiley', value: stats.reactions, name: statWord('reactions', stats.reactions), detail: 'received',
      url: null, label: '',
      tint: 'reactions',
    },
  ]
}
