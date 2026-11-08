// Weights ported from nuxt/nuxters `computeScore`, rows from nuxt.com `nuxterScoreBreakdown` (MIT, Copyright (c) 2023
// Nuxt, Copyright (c) 2022-2023 NuxtLabs). Review comments, security advisory credits and translations are ours.

/**
 * Every kind of contribution that scores, in the order of the fields of a contributor file.
 * `pullRequest`: counted under `pullRequests` (a landed PR of that type), not on the record itself.
 * `of`: a helpful count, never above that total. `label` and `icon`: its row in `scoreBreakdown`.
 */
export const KINDS = [
  { key: 'feat', pullRequest: true, points: 7, label: 'Feature PRs', icon: 'rocket' },
  { key: 'fix', pullRequest: true, points: 5, label: 'Fix PRs', icon: 'wrench' },
  { key: 'docs', pullRequest: true, points: 4, label: 'Docs PRs', icon: 'book-open' },
  { key: 'chore', pullRequest: true, points: 3, label: 'Chore PRs', icon: 'brush-cleaning' },
  // Issues opened (not PRs).
  { key: 'issues', pullRequest: false, points: 1, label: 'Issues', icon: 'circle-dot' },
  // Of those: closed as completed, or 3+ reactions, or 5+ comments. On top of the issue's own point.
  { key: 'helpfulIssues', pullRequest: false, of: 'issues', points: 3, label: 'Helpful issues', icon: 'lightbulb' },
  // Conversation comments on issues, PRs and discussions.
  { key: 'comments', pullRequest: false, points: 0.5, label: 'Comments', icon: 'message-circle' },
  // Of those: 3+ reactions, or a discussion's accepted answer.
  { key: 'helpfulComments', pullRequest: false, of: 'comments', points: 2, label: 'Helpful comments', icon: 'message-circle-heart' },
  // Inline comments on the code of PRs.
  { key: 'reviewComments', pullRequest: false, points: 1, label: 'Review comments', icon: 'file-code' },
  // Received on the contributor's issues, PRs and comments, counted on the day of the item.
  { key: 'reactions', pullRequest: false, points: 0.1, label: 'Reactions received', icon: 'smile-plus' },
  // Variable points, calculated from the credited role and severity.
  { key: 'advisories', pullRequest: false, points: null, label: 'Security advisories', icon: 'shield' },
  // Community translations of angular.dev they translated (`TRANSLATIONS`), on each one's `joinedAt`.
  { key: 'translations', pullRequest: false, points: 20, label: 'Translations', icon: 'languages' },
] as const

export type Kind = typeof KINDS[number]
/** The kind of a landed pull request, from its title (`feat(core): …`) or labels. */
export type PullRequestType = Extract<Kind, { pullRequest: true }>['key']
/** What a contributor did besides landing PRs. */
export type ActivityKind = Extract<Kind, { pullRequest: false }>['key']

export const PULL_REQUEST_KINDS = KINDS.filter((kind): kind is Extract<Kind, { pullRequest: true }> => kind.pullRequest)
export const ACTIVITY_KINDS = KINDS.filter((kind): kind is Extract<Kind, { pullRequest: false }> => !kind.pullRequest)
