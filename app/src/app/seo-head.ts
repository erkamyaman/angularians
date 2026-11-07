import type { Meta } from '@angular/platform-browser'
import { SITE_URL } from './site'

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

/** The page's structured data for search engines (schema.org JSON-LD), replaced on each call; `null` removes it. */
export function setJsonLd(document: Document, data: object | null): void {
  let script = document.head.querySelector<HTMLScriptElement>('script#ld-json')
  if (!data) {
    script?.remove()
    return
  }
  if (!script) {
    script = document.createElement('script')
    script.id = 'ld-json'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  // `<` escaped: a name with `</script>` in it cannot end the tag.
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', ...data }).replace(/</g, '\\u003c')
}

/** A breadcrumb trail for search results: each step's name and path, the last one the page itself. */
export function breadcrumbs(steps: ReadonlyArray<{ name: string, path: string }>): object {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: steps.map((step, index) => ({ '@type': 'ListItem', position: index + 1, name: step.name, item: `${SITE_URL}${step.path}` })),
  }
}
