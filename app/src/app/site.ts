import type { Meta } from '@angular/platform-browser'

/** The public address of the site: shared links, the README card, og:image (which must be absolute). */
export const SITE_URL = 'https://angularians.dev'

/** The link preview of a page: its description, a 2400×1260 card (large on X, LinkedIn, Slack…) and its canonical URL. */
export function setShareMeta(meta: Meta, document: Document, page: { title: string, description: string, url: string, image: string, canonical: string }): void {
  meta.updateTag({ name: 'description', content: page.description })
  meta.updateTag({ property: 'og:title', content: page.title })
  meta.updateTag({ property: 'og:description', content: page.description })
  meta.updateTag({ property: 'og:url', content: page.url })
  meta.updateTag({ property: 'og:image', content: page.image })
  meta.updateTag({ property: 'og:image:width', content: '2400' })
  meta.updateTag({ property: 'og:image:height', content: '1260' })
  meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' })
  meta.updateTag({ name: 'twitter:image', content: page.image })
  setCanonical(document, page.canonical)
}

/** The page's canonical URL, absolute (a relative one resolves to whichever host served the page, a preview deploy too). */
export function setCanonical(document: Document, path: string): void {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'canonical'
    document.head.appendChild(link)
  }
  link.setAttribute('href', `${SITE_URL}${path}`)
}
