// Ported from nuxt/nuxters `collectIssues` and `collectComments` (MIT, Copyright (c) 2023 Nuxt), plus inline review
// comments. Every page is counted as it arrives: a full run of angular/angular streams ~500,000 comments.
import type { CommentInput, ContributorsAccumulator, IssueInput } from '@angularians/shared'
import { fullName, type Repo } from './config.ts'
import { GitHubError, paginate } from './github.ts'

export interface ActivityStats {
  issues: number
  pullRequestItems: number
  comments: number
  reviewComments: number
  pages: number
}

/**
 * GitHub stops the repository-wide comment lists after 300 pages (30,000 comments) without saying so: the last
 * page simply has no `next` link. A full angular/angular run has ~500,000 comments.
 */
export const LIST_PAGE_CAP = 300
const MAX_PER_PAGE = 100
const MIN_PER_PAGE = 25
/** Pages between two progress lines in the log. */
const PROGRESS_EVERY = 100

type Listed = { id?: number, created_at: string, updated_at?: string }

/**
 * Every item of a list endpoint that caps its pagination: in `updated` order, 300 pages at a time, each window
 * starting at the last `updated_at` seen. Items seen twice at a window edge are skipped by id.
 */
export async function* walkCappedList<T extends Listed>(path: string, params: Record<string, string>, since: Date | null, pageCap = LIST_PAGE_CAP): AsyncGenerator<T[]> {
  const seen = new Set<number>()
  let from = since
  let perPage = MAX_PER_PAGE
  for (;;) {
    const query = new URLSearchParams({ per_page: String(perPage), sort: 'updated', direction: 'asc', ...params, ...(from ? { since: from.toISOString() } : {}) })
    let pages = 0
    let lastUpdated: string | undefined
    let fresh = 0
    try {
      for await (const page of paginate<T>(`${path}?${query}`)) {
        pages++
        const items = page.filter((item) => {
          if (item.id === undefined) return true
          if (seen.has(item.id)) return false
          seen.add(item.id)
          return true
        })
        fresh += items.length
        lastUpdated = page.at(-1)?.updated_at ?? lastUpdated
        yield items
      }
    }
    catch (error) {
      // A page GitHub keeps failing to build (502 on review comments, which carry their diff hunks): start over
      // from the last update seen, with smaller pages.
      if (!(error instanceof GitHubError) || error.status < 500 || perPage <= MIN_PER_PAGE) throw error
      perPage = Math.max(MIN_PER_PAGE, perPage / 2)
      if (lastUpdated) from = new Date(lastUpdated)
      console.log(`  ${path}: GitHub ${error.status} kept failing, continuing from ${from?.toISOString() ?? 'the start'} with ${perPage} per page`)
      continue
    }
    if (pages < pageCap) return
    // The window hit the cap: the next one starts where this one stopped.
    if (!lastUpdated || !fresh) throw new Error(`${path}: ${pageCap} pages without progress, stopping`)
    from = new Date(lastUpdated)
    console.log(`  ${path}: ${pageCap} pages, continuing from ${lastUpdated}`)
  }
}

/**
 * Issues (and the PRs the issues API also lists, for their reactions), conversation comments on both,
 * and inline review comments. With `since` (test runs), only items created since then.
 */
export async function collectActivity(repo: Repo, since: Date | null, accumulator: ContributorsAccumulator, pageCap = LIST_PAGE_CAP): Promise<ActivityStats> {
  const stats: ActivityStats = { issues: 0, pullRequestItems: 0, comments: 0, reviewComments: 0, pages: 0 }
  // `since` filters on the last update: an old item updated since would be counted.
  const created = (item: { created_at: string }) => !since || Date.parse(item.created_at) >= since.getTime()
  const api = `/repos/${fullName(repo)}`

  const streams: Array<[string, AsyncGenerator<Array<IssueInput & CommentInput>>, (item: IssueInput & CommentInput) => void]> = [
    // The issues list is not capped (angular/angular: ~700 pages in one go).
    ['issues', paginate(`${api}/issues?${new URLSearchParams({ per_page: '100', state: 'all', sort: 'created', direction: 'asc', ...(since ? { since: since.toISOString() } : {}) })}`), (item) => {
      accumulator.addIssue(item)
      if (item.pull_request) stats.pullRequestItems++
      else stats.issues++
    }],
    ['comments', walkCappedList(`${api}/issues/comments`, {}, since, pageCap), (item) => {
      accumulator.addComment(item)
      stats.comments++
    }],
    ['review comments', walkCappedList(`${api}/pulls/comments`, {}, since, pageCap), (item) => {
      accumulator.addReviewComment(item)
      stats.reviewComments++
    }],
  ]

  // One stream after the other: GitHub asks for no concurrent requests (secondary rate limits).
  for (const [label, pages, add] of streams) {
    let count = 0
    for await (const page of pages) {
      for (const item of page) if (created(item)) add(item)
      count++
      stats.pages++
      if (count % PROGRESS_EVERY === 0) console.log(`  ${label}: ${count} pages`)
    }
    console.log(`  ${label}: done, ${count} pages`)
  }
  return stats
}
