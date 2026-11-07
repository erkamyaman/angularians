import type { TeamRecord } from '@angularians/shared'
import { paginate } from './github.ts'

/** The public members of these GitHub organizations (the "Angular team" badge), by GitHub id. */
export async function publicMembers(owners: readonly string[]): Promise<TeamRecord[]> {
  const members = new Map<number, TeamRecord>()
  for (const owner of owners) {
    for await (const page of paginate<{ login: string, id: number }>(`/orgs/${owner}/public_members?per_page=100`)) {
      for (const member of page) members.set(member.id, { githubId: member.id, username: member.login })
    }
  }
  return [...members.values()].sort((a, b) => a.githubId - b.githubId)
}
