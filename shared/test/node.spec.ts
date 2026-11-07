/// <reference types="node" />
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { readDataDir, readDataFile } from '../src/node.ts'

let dirs: string[] = []
afterEach(async () => {
  await Promise.all(dirs.map(dir => rm(dir, { recursive: true, force: true })))
  dirs = []
})

async function folder(files: Record<string, unknown>): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'data-'))
  dirs.push(dir)
  for (const [file, data] of Object.entries(files)) await writeFile(join(dir, file), typeof data === 'string' ? data : JSON.stringify(data))
  return dir
}

describe('readDataDir', () => {
  it('reads a missing folder as empty', async () => {
    expect(await readDataDir(join(tmpdir(), 'no-such-data-folder'))).toEqual({ meta: null, periods: {}, profiles: [], packages: [], team: [], renames: [], calendar: {} })
  })

  it('validates every file it knows, ranks the periods and ignores the rest', async () => {
    const dir = await folder({
      'contributors.json': [{ githubId: 1, username: 'amy', pullRequests: { fix: 1 } }, { githubId: 2, username: 'bo', pullRequests: { feat: 1 } }],
      'contributors-2020.json': [{ githubId: 1, username: 'amy', score: 99 }],
      'renames.json': [{ githubId: 1, username: 'old-amy' }, { githubId: 'x' }],
      'meta.json': { collectedAt: '2026-11-07T10:01:50.861Z', partial: false, repos: ['angular/angular', 3], contributors: 2 },
      'notes.json': { anything: true },
    })
    const data = await readDataDir(dir)
    expect(Object.keys(data.periods).sort()).toEqual(['2020', 'all'])
    expect(data.periods['all']!.map(row => [row.rank, row.username, row.score])).toEqual([[1, 'bo', 7], [2, 'amy', 5]])
    expect(data.periods['2020']![0]!.score).toBe(0)
    expect(data.renames).toEqual([{ githubId: 1, username: 'old-amy' }])
    expect(data.meta).toEqual({ collectedAt: '2026-11-07T10:01:50.861Z', partial: false, repos: ['angular/angular'] })
    expect(data.profiles).toEqual([])
  })

  it('fails on a file that is not JSON, rather than publishing without it', async () => {
    await expect(readDataDir(await folder({ 'team.json': '[{' }))).rejects.toThrow(SyntaxError)
  })
})

describe('readDataFile', () => {
  it('reads a missing file as null', async () => {
    expect(await readDataFile(await folder({}), 'team.json', () => [])).toBeNull()
  })
})
