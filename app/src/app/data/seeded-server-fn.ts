import { computed, inject, resource, untracked } from '@angular/core'
import { ServerFnClient, type ServerFn } from '@analogjs/router'

/**
 * `injectServerFn`, but the server's value is there for the first render in the browser: Analog's own reads it a
 * microtask later, so hydration found no value, took the other `@if` branch and rebuilt the page.
 */
export function injectSeededServerFn<In, Out>(fn: ServerFn<In, Out>, args: () => In) {
  const client = inject(ServerFnClient)
  const read = fn as unknown as ServerFn<unknown, Out>
  const firstInput = untracked(args)
  const first = JSON.stringify(firstInput)
  const seeded = client.isServer ? undefined : client.readSeed(read, firstInput)
  let seedUnused = seeded !== undefined

  const ref = resource({
    params: args,
    loader: async ({ params }) => {
      if (seedUnused && JSON.stringify(params) === first) {
        seedUnused = false
        return seeded as Out
      }
      const value = await client.call(fn, params)
      if (client.isServer) client.writeSeed(read, params, value)
      return value
    },
  })
  const fromSeed = computed(() => seeded !== undefined && !ref.hasValue() && !ref.error() && JSON.stringify(args()) === first)
  const value = computed<Out | undefined>(() => (ref.hasValue() ? ref.value() : fromSeed() ? seeded : undefined))

  return {
    value,
    hasValue: () => value() !== undefined,
    error: ref.error,
    isLoading: computed(() => ref.isLoading() && !fromSeed()),
    reload: () => ref.reload(),
  }
}
