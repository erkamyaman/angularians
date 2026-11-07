export function scrollHomeToTop(url: string): void {
  if (url.split(/[?#]/)[0] !== '/') return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })
}
