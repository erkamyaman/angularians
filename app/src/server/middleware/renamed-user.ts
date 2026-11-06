import { defineEventHandler, sendRedirect } from 'h3'
import { renamedUserRedirect } from '../data/renamed-user'
import { contributorsData } from '../data/store'

/**
 * A link to a renamed contributor's old name (`/oldname`, a README's `/oldname/card.png`) follows them: 301 to the new
 * name. Only when the old name has no contributions of its own, so a reused name keeps its owner.
 */
export default defineEventHandler((event) => {
  if (event.method !== 'GET' && event.method !== 'HEAD') return undefined
  const data = contributorsData()
  const target = renamedUserRedirect(event.path, name => (data.profile(name) ? null : data.renamedTo(name)))
  return target ? sendRedirect(event, target, 301) : undefined
})
