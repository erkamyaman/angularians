/// <reference types="node" />
// The data folder on disk: Node only, so it is a separate entry (`@angularians/shared/node`), out of the site's bundle.
import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { CALENDAR_FILE, META_FILE, PACKAGES_FILE, parseCalendarFile, parseContributorsFile, parseMetaFile, parsePackagesFile, parseProfilesFile, parseUserIdsFile, PROFILES_FILE, RENAMES_FILE, TEAM_FILE } from './files.ts'
import { periodFromFile } from './periods.ts'
import type { DataFolder } from './types.ts'

/** The files of a data folder besides the period files, and how each is validated. */
const DATA_FILES = {
  profiles: [PROFILES_FILE, parseProfilesFile],
  packages: [PACKAGES_FILE, parsePackagesFile],
  team: [TEAM_FILE, parseUserIdsFile],
  renames: [RENAMES_FILE, parseUserIdsFile],
  meta: [META_FILE, parseMetaFile],
  calendar: [CALENDAR_FILE, parseCalendarFile],
} as const satisfies { [K in Exclude<keyof DataFolder, 'periods'>]: readonly [string, (data: unknown) => NonNullable<DataFolder[K]>] }

/** A data file, validated by `parse`, or `null` when it is missing. Invalid JSON throws. */
export async function readDataFile<T>(dir: string, file: string, parse: (data: unknown) => T): Promise<T | null> {
  const path = join(dir, file)
  return existsSync(path) ? parse(JSON.parse(await readFile(path, 'utf8'))) : null
}

/** Every file of a data folder, validated, the period files ranked. A missing folder or file reads as empty. */
export async function readDataDir(dir: string): Promise<DataFolder> {
  const folder: DataFolder = { meta: null, periods: {}, profiles: [], packages: [], team: [], renames: [], calendar: {} }
  const files = existsSync(dir) ? (await readdir(dir)).sort() : []
  for (const file of files) {
    const period = periodFromFile(file)
    if (period) folder.periods[period] = (await readDataFile(dir, file, parseContributorsFile))!
  }
  for (const [key, [file, parse]] of Object.entries(DATA_FILES)) {
    if (files.includes(file)) Object.assign(folder, { [key]: await readDataFile(dir, file, parse as (data: unknown) => unknown) })
  }
  return folder
}
