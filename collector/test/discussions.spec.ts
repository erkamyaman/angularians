import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ContributorsAccumulator } from '@angularians/shared'
import { graphql } from '../src/github.ts'
import { collectDiscussions } from '../src/discussions.ts'

vi.mock('../src/github.ts', () => ({ graphql: vi.fn() }))

const author = (login: string, databaseId: number, type = 'User') => ({ __typename: type, login, databaseId })
const page = <T>(nodes: T[], next: string | null = null, totalCount = nodes.length) => ({ totalCount, pageInfo: { hasNextPage: next !== null, endCursor: next }, nodes })
const reply = (who: ReturnType<typeof author>, createdAt = '2026-03-01T00:00:00Z', reactions = 0) => ({ createdAt, author: who, reactions: { totalCount: reactions } })
const comment = (id: string, who: ReturnType<typeof author>, extra: { isAnswer?: boolean, reactions?: number, replies?: ReturnType<typeof page> } = {}) =>
  ({ id, isAnswer: extra.isAnswer ?? false, ...reply(who, '2026-03-01T00:00:00Z', extra.reactions ?? 0), replies: extra.replies ?? page([]) })

const alice = author('alice', 1)
const bob = author('bob', 2)
const carol = author('carol', 3)

function records(accumulator: ContributorsAccumulator) {
  return Object.fromEntries((accumulator.records().get('all') ?? []).map(row => [row.username, { issues: row.issues, helpfulIssues: row.helpfulIssues, comments: row.comments, helpfulComments: row.helpfulComments, reactions: row.reactions, score: row.score }]))
}

describe('collectDiscussions', () => {
  beforeEach(() => vi.mocked(graphql).mockReset())

  it('scores a discussion as an issue, comments and replies as comments, the answer as a helpful comment, across pages', async () => {
    vi.mocked(graphql)
      // First page of discussions: one with a second page of comments, the next page cursor.
      .mockResolvedValueOnce({ data: { repository: { discussions: page([
        { id: 'D1', createdAt: '2026-02-01T00:00:00Z', author: alice, reactions: { totalCount: 4 }, comments: page([
          comment('C1', bob, { isAnswer: true, replies: page([reply(alice)], 'R1') }),
        ], 'C1-next', 3) },
      ], 'D-next') } } as never })
      // More replies of C1, more comments of D1, then the second page of discussions.
      .mockResolvedValueOnce({ data: { node: { replies: page([reply(carol)]) } } as never })
      .mockResolvedValueOnce({ data: { node: { comments: page([comment('C2', carol), comment('C3', author('github-actions', 9, 'Bot'))]) } } as never })
      .mockResolvedValueOnce({ data: { repository: { discussions: page([
        { id: 'D2', createdAt: '2026-02-02T00:00:00Z', author: carol, reactions: { totalCount: 0 }, comments: page([]) },
      ]) } } as never })

    const accumulator = new ContributorsAccumulator(new Date('2026-06-01T00:00:00Z'))
    const stats = await collectDiscussions({ owner: 'angular', name: 'angular' }, null, accumulator)

    expect(stats).toEqual({ discussions: 2, discussionComments: 5, read: 2, readComments: 5 })
    expect(graphql).toHaveBeenCalledTimes(4)
    expect(records(accumulator)).toEqual({
      // A discussion with 4 reactions: a helpful issue (1 + 3 + 0.4), and a reply (0.5).
      alice: { issues: 1, helpfulIssues: 1, comments: 1, helpfulComments: 0, reactions: 4, score: 5 },
      // The accepted answer: a comment (0.5) and a helpful comment (2).
      bob: { issues: 0, helpfulIssues: 0, comments: 1, helpfulComments: 1, reactions: 0, score: 3 },
      // A discussion (1), a reply and a comment (2 × 0.5); the bot's comment counts for nobody.
      carol: { issues: 1, helpfulIssues: 0, comments: 2, helpfulComments: 0, reactions: 0, score: 2 },
    })
  })

  it('counts only what was created since a test run\'s date, and a repository without discussions is empty', async () => {
    vi.mocked(graphql).mockResolvedValueOnce({ data: { repository: { discussions: page([
      { id: 'D1', createdAt: '2025-01-01T00:00:00Z', author: alice, reactions: { totalCount: 0 }, comments: page([comment('C1', bob)]) },
    ]) } } as never })
    const accumulator = new ContributorsAccumulator(new Date('2026-06-01T00:00:00Z'))
    expect(await collectDiscussions({ owner: 'a', name: 'b' }, new Date('2026-01-01T00:00:00Z'), accumulator)).toEqual({ discussions: 0, discussionComments: 1, read: 1, readComments: 1 })

    vi.mocked(graphql).mockResolvedValueOnce({ data: { repository: { discussions: page([]) } } as never })
    expect(await collectDiscussions({ owner: 'a', name: 'b' }, null, new ContributorsAccumulator(new Date()))).toEqual({ discussions: 0, discussionComments: 0, read: 0, readComments: 0 })
  })

  it('asks for fewer discussions a page when GitHub says the query is too big, from the first page on', async () => {
    vi.mocked(graphql)
      .mockResolvedValueOnce({ data: null, errors: [{ type: 'RESOURCE_LIMITS_EXCEEDED' }] })
      .mockResolvedValueOnce({ data: { repository: { discussions: page([
        { id: 'D1', createdAt: '2026-02-01T00:00:00Z', author: alice, reactions: { totalCount: 0 }, comments: page([]) },
      ]) } } as never })
    expect(await collectDiscussions({ owner: 'a', name: 'b' }, null, new ContributorsAccumulator(new Date()))).toEqual({ discussions: 1, discussionComments: 0, read: 1, readComments: 0 })
    expect(vi.mocked(graphql).mock.calls.map(([text]) => /discussions\(first: (\d+)/.exec(text)?.[1])).toEqual(['10', '5'])
  })

  it('fails on a GraphQL error, rather than publishing part of the discussions', async () => {
    vi.mocked(graphql).mockResolvedValueOnce({ data: null, errors: [{ type: 'FORBIDDEN', message: 'no' }] })
    await expect(collectDiscussions({ owner: 'a', name: 'b' }, null, new ContributorsAccumulator(new Date()))).rejects.toThrow('GraphQL discussions failed')
  })
})
