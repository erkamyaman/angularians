import { describe, expect, it, vi } from 'vitest'
import { parseCountryIndex } from '@angularians/shared'
import { graphql } from '../src/github.ts'
import { fetchBatch } from '../src/profiles.ts'

vi.mock('../src/github.ts', () => ({ graphql: vi.fn() }))

const countries = parseCountryIndex('#ISO\tISO3\tISO-Numeric\tfips\tCountry\nTR\tTUR\t792\tTU\tTurkey', '')
const user = { login: 'alice', databaseId: 1, name: 'Alice', location: 'Turkey', websiteUrl: null, socialAccounts: { nodes: [] } }

describe('fetchBatch', () => {
  it('reads a batch of users', async () => {
    vi.mocked(graphql).mockResolvedValueOnce({ data: { u0: user } as never })
    const profiles = await fetchBatch([{ username: 'alice', githubId: 1 }], countries)
    expect(profiles).toEqual([expect.objectContaining({ githubId: 1, username: 'alice', country: 'TR' })])
  })

  it('fails when the rate limit outlasted the retries of graphql()', async () => {
    vi.mocked(graphql).mockReset().mockResolvedValue({ data: null, errors: [{ type: 'RATE_LIMITED' }] })
    await expect(fetchBatch([{ username: 'alice', githubId: 1 }], countries)).rejects.toThrow('GraphQL profiles failed')
    expect(graphql).toHaveBeenCalledTimes(1)
  })
})
