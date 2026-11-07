import { signal } from '@angular/core';
import { loadedValue } from './loaded';

describe('loadedValue', () => {
  it('gives the value of a resource that has one', () => {
    expect(loadedValue({ hasValue: () => true, value: signal(1) })()).toBe(1);
  });

  it('does not read the value of a failed resource, which throws', () => {
    const value = Object.assign(() => { throw new Error('failed'); }, signal(0));
    expect(loadedValue({ hasValue: () => false, value })()).toBeUndefined();
  });
});
