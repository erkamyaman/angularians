/** A failed render: never kept by a cache as the page. */
export function markFailed(response: { statusCode: number, setHeader(name: string, value: string): unknown }): void {
  response.statusCode = 503
  response.setHeader('cache-control', 'no-store')
  response.setHeader('netlify-cdn-cache-control', 'no-store')
}
