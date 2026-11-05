export type ClientManifest = Record<string, { file: string, imports?: string[] }>

export function pageModule(path: string): string {
  const segments = path.split('?')[0].split('/').filter(Boolean)
  if (segments.length === 0) return 'src/app/pages/index.page.ts'
  if (segments.length === 1) return 'src/app/pages/[username].page.ts'
  return 'src/app/pages/[...not-found].page.ts'
}

export function pagePreloads(manifest: ClientManifest, module: string): string[] {
  const files = new Set<string>()
  const walk = (key: string) => {
    const chunk = manifest[key]
    if (!chunk || key === 'index.html' || files.has(chunk.file)) return
    files.add(chunk.file)
    chunk.imports?.forEach(walk)
  }
  walk(module)
  return [...files]
}

export function withPreloads(html: string, files: string[]): string {
  const links = files
    .filter(file => !html.includes(`/${file}"`))
    .map(file => `<link rel="modulepreload" crossorigin href="/${file}">`)
    .join('')
  return links ? html.replace('</head>', `${links}</head>`) : html
}
