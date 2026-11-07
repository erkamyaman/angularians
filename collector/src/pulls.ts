import type { PullRequestInput } from '@angularians/shared'
import { fullName, type Repo } from './config.ts'
import { getJson, paginate } from './github.ts'

interface RestPull extends PullRequestInput {
  updated_at: string
}

/**
 * Closed PRs from `GET /repos/{owner}/{repo}/pulls`: a landed PR is always closed. The production source.
 * With `since`, newest updates first, stopping at the first PR not updated since: a PR that landed after
 * `since` was updated after it too.
 */
export async function restPulls(repo: Repo, since: Date | null): Promise<PullRequestInput[]> {
  const params = new URLSearchParams({ state: 'closed', per_page: '100', ...(since ? { sort: 'updated', direction: 'desc' } : { sort: 'created', direction: 'asc' }) })
  const pulls: PullRequestInput[] = []
  for await (const page of paginate<RestPull>(`/repos/${fullName(repo)}/pulls?${params}`)) {
    for (const pull of page) {
      if (since && Date.parse(pull.updated_at) < since.getTime()) return pulls
      pulls.push(toInput(pull))
    }
  }
  return pulls
}

interface SearchItem {
  number: number
  title: string
  user: { login?: string | null, id?: number | null } | null
  labels?: Array<{ name?: string | null }>
  closed_at: string | null
  pull_request?: { merged_at?: string | null }
}

/** GitHub search returns 1,000 results at most per query: wider ranges are split in halves. */
const SEARCH_CAP = 1000
const DAY_MS = 24 * 60 * 60 * 1000
const day = (time: number) => new Date(time).toISOString().slice(0, 10)

/**
 * Closed PRs from the search API, by closing day. A fallback for where `/pulls` is not reachable
 * (search has its own rate limit, 30 requests a minute with a token): same fields, more requests.
 */
export async function searchPulls(repo: Repo, since: Date | null, until = new Date()): Promise<PullRequestInput[]> {
  const pulls = new Map<number, PullRequestInput>()
  const start = since ?? new Date('2014-01-01T00:00:00Z')
  const ranges: Array<[number, number]> = [[Date.parse(day(start.getTime())), Date.parse(day(until.getTime()))]]
  while (ranges.length) {
    const [from, to] = ranges.shift()!
    const q = `repo:${fullName(repo)} is:pr is:closed closed:${day(from)}..${day(to)}`
    const base = `/search/issues?${new URLSearchParams({ q, per_page: '100', sort: 'created', order: 'asc' })}`
    const first = await getJson<{ total_count: number, items: SearchItem[] }>(base)
    if (first.total_count > SEARCH_CAP && to > from) {
      const middle = from + Math.floor((to - from) / DAY_MS / 2) * DAY_MS
      ranges.unshift([from, middle], [middle + DAY_MS, to])
      continue
    }
    if (first.total_count > SEARCH_CAP) console.warn(`More than ${SEARCH_CAP} PRs closed on ${day(from)}: some are missing`)
    for (const item of first.items) pulls.set(item.number, fromSearch(item))
    for (let page = 2; (page - 1) * 100 < Math.min(first.total_count, SEARCH_CAP); page++) {
      const { items } = await getJson<{ items: SearchItem[] }>(`${base}&page=${page}`)
      for (const item of items) pulls.set(item.number, fromSearch(item))
    }
  }
  return [...pulls.values()]
}

function toInput(pull: PullRequestInput): PullRequestInput {
  return { number: pull.number, title: pull.title, user: pull.user, labels: pull.labels ?? [], merged_at: pull.merged_at }
}

function fromSearch(item: SearchItem): PullRequestInput {
  return { number: item.number, title: item.title, user: item.user, labels: item.labels ?? [], merged_at: item.pull_request?.merged_at ?? null }
}
