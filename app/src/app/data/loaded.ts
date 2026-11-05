import { computed, type Signal } from '@angular/core'

/** A resource's value, or `undefined` while it loads or after it failed: a bare `value()` throws on a failure. */
export function loadedValue<T>(resource: { hasValue(): boolean, value: Signal<T> }): Signal<T | undefined> {
  return computed(() => (resource.hasValue() ? resource.value() : undefined))
}

/** A failed render: never kept by a cache as the page. */
export function markFailed(response: { statusCode: number, setHeader(name: string, value: string): unknown }): void {
  response.statusCode = 503
  response.setHeader('cache-control', 'no-store')
  response.setHeader('netlify-cdn-cache-control', 'no-store')
}
