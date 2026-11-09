import { useStorage } from 'nitropack/runtime'
import type { CardFonts } from './card'
import { TAG_FONTS } from './tag-fonts'
import { avatarUrl } from '../../app/contributors/avatar-url'
import { flagUrl } from '../../app/contributors/flag-url'

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
    const tags = await Promise.all(TAG_FONTS.map(async ({ name, file }) => ({ name, data: await storage.getItemRaw<Buffer>(file) })))
    return { regular, semibold, brand: brand ?? null, tags: tags.flatMap(({ name, data }) => data ? [{ name, data }] : []) }
  })().catch((error: unknown) => {
    fonts = undefined
    throw error
  }))
}

const images = new Map<string, string>()

/** One of the site's own images (`/logo.svg`, `/credits/…`, `/flags/…`, from the server assets) as a data URL, or `null`: a card still renders without it. */
export async function siteImage(path: string): Promise<string | null> {
  const known = images.get(path)
  if (known) return known
  const raw = await useStorage('assets:site-images').getItemRaw<Buffer>(path.slice(1).replaceAll('/', ':')).catch(() => null)
  if (!raw) return null
  const data = `data:${path.endsWith('.svg') ? 'image/svg+xml' : 'image/png'};base64,${Buffer.from(raw).toString('base64')}`
  images.set(path, data)
  return data
}

/** A country's flag as a data URL, or `null`. */
export const flagData = (code: string) => siteImage(flagUrl(code))

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
