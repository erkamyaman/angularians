// GitHub Discussions (angular/angular's RFCs) through GraphQL: the REST API does not list them.
import type { CommentInput, ContributorsAccumulator, IssueInput } from '@angularians/shared'
import { graphql, retryTiming } from './github.ts'

type Repo = { owner: string, name: string }

export interface DiscussionStats {
  discussions: number
  discussionComments: number
}

type Author = { __typename?: string, login?: string, databaseId?: number | null } | null
type Page<T> = { totalCount?: number, pageInfo: { hasNextPage: boolean, endCursor: string | null }, nodes: Array<T | null> | null }
type Reply = { createdAt: string, author: Author, reactions: { totalCount: number } }
type Comment = Reply & { id: string, isAnswer: boolean, replies: Page<Reply> }
type Discussion = { id: string, createdAt: string, author: Author, reactions: { totalCount: number }, comments: Page<Comment> }

const AUTHOR = 'author { __typename login ... on User { databaseId } ... on Bot { databaseId } }'
const REPLY = `createdAt ${AUTHOR} reactions { totalCount }`
const PAGE = 'pageInfo { hasNextPage endCursor }'
const COMMENT = `id isAnswer ${REPLY} replies(first: 50) { totalCount ${PAGE} nodes { ${REPLY} } }`
/** 25 discussions × 30 comments × 50 replies: well under GraphQL's node limit; longer threads are paged on their own. */
const DISCUSSIONS = `query($owner: String!, $name: String!, $after: String) {
  repository(owner: $owner, name: $name) {
    discussions(first: 25, after: $after, orderBy: { field: CREATED_AT, direction: ASC }) {
      ${PAGE}
      nodes { id createdAt ${AUTHOR} reactions { totalCount } comments(first: 30) { totalCount ${PAGE} nodes { ${COMMENT} } } }
    }
  }
}`
const MORE_COMMENTS = `query($id: ID!, $after: String) { node(id: $id) { ... on Discussion { comments(first: 50, after: $after) { ${PAGE} nodes { ${COMMENT} } } } } }`
const MORE_REPLIES = `query($id: ID!, $after: String) { node(id: $id) { ... on DiscussionComment { replies(first: 100, after: $after) { ${PAGE} nodes { ${REPLY} } } } } }`

/** GraphQL's author as the REST user the accumulator reads; GitHub apps are `Bot`s. */
const user = (author: Author): CommentInput['user'] =>
  author?.login ? { login: author.login, id: author.databaseId ?? null, type: author.__typename === 'Bot' ? 'Bot' : 'User' } : null

/** A rate limit (`RATE_LIMITED`): wait 1, 2, 4, 8, 16 minutes and ask again; any other error fails the run. */
async function query<T>(text: string, variables: Record<string, unknown>): Promise<T> {
  let { data, errors } = await graphql<T>(text, variables)
  for (let attempt = 0; attempt < 5 && errors?.some(error => error.type === 'RATE_LIMITED'); attempt++) {
    console.warn(`GraphQL rate limited, retrying discussions in ${2 ** attempt} min`)
    await new Promise(resolve => setTimeout(resolve, 2 ** attempt * 60_000 * retryTiming.scale))
    ;({ data, errors } = await graphql<T>(text, variables))
  }
  if (!data || errors?.length) throw new Error(`GraphQL discussions failed: ${JSON.stringify(errors).slice(0, 300)}`)
  return data
}

/**
 * Every discussion of a repository, with its comments and their replies, scored as issues and comments are:
 * a discussion counts as an issue, a comment or a reply as a comment, the accepted answer as a helpful comment.
 * A repository without discussions has none. With `since` (test runs), only those created since then.
 */
export async function collectDiscussions({ owner, name }: Repo, since: Date | null, accumulator: ContributorsAccumulator): Promise<DiscussionStats> {
  const stats: DiscussionStats = { discussions: 0, discussionComments: 0 }
  const created = (at: string) => !since || Date.parse(at) >= since.getTime()
  const addReply = (reply: Reply | null, answer = false) => {
    if (!reply || !created(reply.createdAt)) return
    const comment: CommentInput = { user: user(reply.author), created_at: reply.createdAt, reactions: { total_count: reply.reactions.totalCount } }
    accumulator.addComment(comment)
    if (answer) accumulator.addAcceptedAnswer(comment)
    stats.discussionComments++
  }
  const addComment = async (comment: Comment | null) => {
    if (!comment) return
    addReply(comment, comment.isAnswer)
    for (const reply of comment.replies.nodes ?? []) addReply(reply)
    let page = comment.replies.pageInfo
    while (page.hasNextPage) {
      const data = await query<{ node: { replies: Page<Reply> } }>(MORE_REPLIES, { id: comment.id, after: page.endCursor })
      for (const reply of data.node.replies.nodes ?? []) addReply(reply)
      page = data.node.replies.pageInfo
    }
  }

  let after: string | null = null
  do {
    const data: { repository: { discussions: Page<Discussion> } | null } = await query(DISCUSSIONS, { owner, name, after })
    const discussions = data.repository?.discussions
    if (!discussions) break
    for (const discussion of discussions.nodes ?? []) {
      if (!discussion) continue
      if (created(discussion.createdAt)) {
        const issue: IssueInput = { user: user(discussion.author), created_at: discussion.createdAt, comments: discussion.comments.totalCount ?? 0, reactions: { total_count: discussion.reactions.totalCount } }
        accumulator.addIssue(issue)
        stats.discussions++
      }
      for (const comment of discussion.comments.nodes ?? []) await addComment(comment)
      let page = discussion.comments.pageInfo
      while (page.hasNextPage) {
        const more = await query<{ node: { comments: Page<Comment> } }>(MORE_COMMENTS, { id: discussion.id, after: page.endCursor })
        for (const comment of more.node.comments.nodes ?? []) await addComment(comment)
        page = more.node.comments.pageInfo
      }
    }
    after = discussions.pageInfo.hasNextPage ? discussions.pageInfo.endCursor : null
  } while (after)
  return stats
}
