import { computed, type Signal } from '@angular/core'

/** A resource's value, or `undefined` while it loads or after it failed: a bare `value()` throws on a failure. */
export function loadedValue<T>(resource: { hasValue(): boolean, value: Signal<T> }): Signal<T | undefined> {
  return computed(() => (resource.hasValue() ? resource.value() : undefined))
}

