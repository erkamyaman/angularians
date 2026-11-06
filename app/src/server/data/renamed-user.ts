/** A profile path (`/name`) or its card (`/name/card.png`): the username, and what follows it. */
const PROFILE_PATH = /^\/([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))(\/card\.png)?$/

/**
 * Where a link to a renamed contributor's old name goes: the same page under the new name, query kept.
 * `null` for any other path, or a name nobody renamed from. `renamedTo` answers from the data.
 */
export function renamedUserRedirect(url: string, renamedTo: (username: string) => string | null): string | null {
  const index = url.indexOf('?')
  const path = index === -1 ? url : url.slice(0, index)
  const match = PROFILE_PATH.exec(path)
  if (!match) return null
  const current = renamedTo(match[1]!)
  return current ? `/${current}${match[2] ?? ''}${index === -1 ? '' : url.slice(index)}` : null
}
