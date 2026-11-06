import { useStorage } from 'nitropack/runtime'
import { SITE_URL } from '../../app/site'
import type { CardFonts } from './card'
import { avatarUrl, flagUrl } from '../../app/leaderboard/format'

let fonts: Promise<CardFonts> | undefined

/** The fonts of the cards (Manrope, and Norse Bold for the word "Angularian" when the build had it), from the server assets (`nitro.serverAssets` in vite.config.ts); loaded once, retried on failure. */
export function cardFonts(): Promise<CardFonts> {
  return (fonts ??= (async () => {
    const storage = useStorage('assets:card-fonts')
    const [regular, semibold] = await Promise.all([
      storage.getItemRaw<Buffer>('manrope-latin-400-normal.woff'),
      storage.getItemRaw<Buffer>('manrope-latin-600-normal.woff'),
    ])
    if (!regular || !semibold) throw new Error('The card fonts are missing from the server assets')
    // Optional: only there when the build could download it.
    const brand = await useStorage('assets:brand-font').getItemRaw<Buffer>('Norse-Bold.otf').catch(() => null)
    return { regular, semibold, brand: brand ?? null }
  })().catch((error: unknown) => {
    fonts = undefined
    throw error
  }))
}

const flags = new Map<string, string>()

/** A country's flag as a data URL, from the site's own files, or `null`: a card still renders without it. */
export async function flagData(code: string): Promise<string | null> {
  const known = flags.get(code)
  if (known) return known
  try {
    const response = await fetch(`${SITE_URL}${flagUrl(code)}`, { signal: AbortSignal.timeout(5000) })
    if (!response.ok) return null
    const data = `data:image/svg+xml;base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`
    flags.set(code, data)
    return data
  }
  catch {
    return null
  }
}

/** An avatar as a data URL, or `null`: a card still renders without it. `pixels`: its size on the card, ×2. */
export async function avatarData(githubId: number, pixels = 352): Promise<string | null> {
  try {
    const response = await fetch(avatarUrl(githubId, pixels / 2), { signal: AbortSignal.timeout(5000) })
    const type = response.headers.get('content-type') ?? ''
    if (!response.ok || !/^image\/(png|jpeg|gif|webp)$/.test(type)) return null
    return `data:${type};base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`
  }
  catch {
    return null
  }
}
