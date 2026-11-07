// GitHub Discussions (angular/angular's RFCs) through GraphQL: the REST API does not list them.
import type { CommentInput, ContributorsAccumulator, IssueInput } from '@angularians/shared'
import type { Repo } from './config.ts'
import { graphql } from './github.ts'

export interface DiscussionStats {
  /** Counted: created in the run's window (all of them in a full run). */
  discussions: number
  discussionComments: number
  /** Read, whatever their date: what the repository has. */
  read: number
  readComments: number
}

type Author = { __typename?: string, login?: string, databaseId?: number | null } | null
type Page<T> = { totalCount?: number, pageInfo: { hasNextPage: boolean, endCursor: string | null }, nodes: Array<T | null> | null }
type Reply = { createdAt: string, author: Author, reactions: { totalCount: number } }
type Comment = Reply & { id: string, isAnswer: boolean, replies: Page<Reply> }
type Discussion = { id: string, createdAt: string, author: Author, reactions: { totalCount: number }, comments: Page<Comment> }

const AUTHOR = 'author { __typename login ... on User { databaseId } ... on Bot { databaseId } }'
const REPLY = `createdAt ${AUTHOR} reactions { totalCount }`
const PAGE = 'pageInfo { hasNextPage endCursor }'
const COMMENT = `id isAnswer ${REPLY} replies(first: 10) { totalCount ${PAGE} nodes { ${REPLY} } }`
/**
 * 10 discussions × 20 comments × 10 replies a request: GitHub refused 25 × 30 × 50 (RESOURCE_LIMITS_EXCEEDED on
 * angular/angular's RFCs). Longer threads are paged on their own, 50 comments or 100 replies at a time.
 */
const DISCUSSIONS = (size: number) => `query($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    discussions(first: ${size}, after: $after, orderBy: { field: CREATED_AT, direction: ASC }) {
      ${PAGE}
      nodes { id createdAt ${AUTHOR} reactions { totalCount } comments(first: 20) { totalCount ${PAGE} nodes { ${COMMENT} } } }
    }
  }
}`
const MORE_COMMENTS = `query($id: ID!, $after: String) { node(id: $id) { ... on Discussion { comments(first: 30, after: $after) { ${PAGE} nodes { ${COMMENT} } } } } }`
const MORE_REPLIES = `query($id: ID!, $after: String) { node(id: $id) { ... on DiscussionComment { replies(first: 100, after: $after) { ${PAGE} nodes { ${REPLY} } } } } }`

/** GraphQL's author as the REST user the accumulator reads; GitHub apps are `Bot`s. */
const user = (author: Author): CommentInput['user'] =>
  author?.login ? { login: author.login, id: author.databaseId ?? null, type: author.__typename === 'Bot' ? 'Bot' : 'User' } : null

/** GitHub refuses a query that would return too much at once. */
class TooBig extends Error {}

/** A query's data; any error fails the run (`graphql` has already waited out the rate limits). */
async function query<T>(text: string, variables: Record<string, unknown>): Promise<T> {
  const { data, errors } = await graphql<T>(text, variables)
  if (errors?.some(error => error.type === 'RESOURCE_LIMITS_EXCEEDED')) throw new TooBig('GraphQL: resource limits exceeded')
  if (!data || errors?.length) throw new Error(`GraphQL discussions failed: ${JSON.stringify(errors).slice(0, 300)}`)
  return data
}

/** Each node of a connection: its first page, then the next ones, which `more` asks for from the cursor. */
async function eachNode<T>(first: Page<T>, more: (after: string | null) => Promise<Page<T>>, visit: (node: T | null) => unknown): Promise<void> {
  for (let page = first; ; page = await more(page.pageInfo.endCursor)) {
    for (const node of page.nodes ?? []) await visit(node)
    if (!page.pageInfo.hasNextPage) return
  }
}

/** The next page of a discussion's comments, from the cursor. */
const moreComments = (discussionId: string) => async (after: string | null) =>
  (await query<{ node: { comments: Page<Comment> } }>(MORE_COMMENTS, { id: discussionId, after })).node.comments

/** The next page of a comment's replies, from the cursor. */
const moreReplies = (commentId: string) => async (after: string | null) =>
  (await query<{ node: { replies: Page<Reply> } }>(MORE_REPLIES, { id: commentId, after })).node.replies

/**
 * Every discussion of a repository, with its comments and their replies, scored as issues and comments are:
 * a discussion counts as an issue, a comment or a reply as a comment, the accepted answer as a helpful comment.
 * A repository without discussions has none. With `since` (test runs), only those created since then.
 */
export async function collectDiscussions({ owner, name }: Repo, since: Date | null, accumulator: ContributorsAccumulator): Promise<DiscussionStats> {
  const stats: DiscussionStats = { discussions: 0, discussionComments: 0, read: 0, readComments: 0 }
  const created = (at: string) => !since || Date.parse(at) >= since.getTime()
  const addReply = (reply: Reply | null, answer = false) => {
    if (reply) stats.readComments++
    if (!reply || !created(reply.createdAt)) return
    const comment: CommentInput = { user: user(reply.author), created_at: reply.createdAt, reactions: { total_count: reply.reactions.totalCount } }
    accumulator.addComment(comment)
    if (answer) accumulator.addAcceptedAnswer(comment)
    stats.discussionComments++
  }
  const addComment = async (comment: Comment | null) => {
    if (!comment) return
    addReply(comment, comment.isAnswer)
    await eachNode(comment.replies, moreReplies(comment.id), reply => addReply(reply))
  }

  let after: string | null = null
  let size = 10
  for (;;) {
    let data: { repository: { discussions: Page<Discussion> } | null }
    try {
      data = await query(DISCUSSIONS(size), { owner, name, after })
    }
    catch (error) {
      // A page of busy RFCs too big for one query: fewer discussions a page, down to one (whose long threads page anyway).
      if (!(error instanceof TooBig) || size === 1) throw error
      size = Math.max(1, Math.floor(size / 2))
      console.warn(`GraphQL discussions too big, ${size} a page`)
      continue
    }
    const discussions = data.repository?.discussions
    if (!discussions) break
    for (const discussion of discussions.nodes ?? []) {
      if (!discussion) continue
      stats.read++
      if (created(discussion.createdAt)) {
        const issue: IssueInput = { user: user(discussion.author), created_at: discussion.createdAt, comments: discussion.comments.totalCount ?? 0, reactions: { total_count: discussion.reactions.totalCount } }
        accumulator.addIssue(issue)
        stats.discussions++
      }
      await eachNode(discussion.comments, moreComments(discussion.id), addComment)
    }
    if (!discussions.pageInfo.hasNextPage) break
    after = discussions.pageInfo.endCursor
  }
  return stats
}
