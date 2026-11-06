import { afterEach, describe, expect, it, vi } from 'vitest'
import { graphql, retryTiming } from '../src/github.ts'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  retryTiming.scale = 1
})

/** GraphQL answers: each call to `fetch` gets the next body, the last one again once they run out. */
function stubGraphQL(...bodies: object[]): void {
  vi.stubEnv('GITHUB_TOKEN', 'test')
  retryTiming.scale = 0
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  let call = 0
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(bodies[Math.min(call++, bodies.length - 1)]))))
}

describe('graphql', () => {
  it('waits and asks again while GitHub answers with a rate limit', async () => {
    stubGraphQL({ data: null, errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] }, { data: { viewer: { login: 'ann' } } })
    expect(await graphql('query { viewer { login } }', {})).toEqual({ data: { viewer: { login: 'ann' } } })
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('returns the rate limit error once it outlasts the retries', async () => {
    stubGraphQL({ data: null, errors: [{ type: 'RATE_LIMITED' }] })
    expect((await graphql('query { viewer { login } }', {})).errors).toEqual([{ type: 'RATE_LIMITED' }])
    expect(fetch).toHaveBeenCalledTimes(6)
  })

  it('leaves other errors to the caller', async () => {
    stubGraphQL({ data: null, errors: [{ type: 'FORBIDDEN' }] })
    expect((await graphql('query { viewer { login } }', {})).errors).toEqual([{ type: 'FORBIDDEN' }])
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
