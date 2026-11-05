import { computed, inject, resource, untracked } from '@angular/core'
import { ServerFnClient, type ServerFn } from '@analogjs/router'

export function injectSeededServerFn<In, Out>(fn: ServerFn<In, Out>, args: () => In) {
  const client = inject(ServerFnClient)
  const seedFn = fn as unknown as ServerFn<unknown, Out>
  const firstInput = untracked(args)
  const firstKey = JSON.stringify(firstInput)
  const isFirst = (input: In) => JSON.stringify(input) === firstKey
  const seeded = client.isServer ? undefined : client.readSeed(seedFn, firstInput)
  let seedUnused = seeded !== undefined

  const loaded = resource({
    params: args,
    loader: async ({ params }) => {
      if (seedUnused && isFirst(params)) {
        seedUnused = false
        return seeded as Out
      }
      const value = await client.call(fn, params)
      if (client.isServer) client.writeSeed(seedFn, params, value)
      return value
    },
  })
  const fromSeed = computed(() => seeded !== undefined && !loaded.hasValue() && !loaded.error() && isFirst(args()))
  const value = computed<Out | undefined>(() => (loaded.hasValue() ? loaded.value() : fromSeed() ? seeded : undefined))

  return {
    value,
    hasValue: () => value() !== undefined,
    error: loaded.error,
    isLoading: computed(() => loaded.isLoading() && !fromSeed()),
    reload: () => loaded.reload(),
  }
}
