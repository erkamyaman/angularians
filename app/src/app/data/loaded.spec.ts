import { signal } from '@angular/core';
import { loadedValue, markFailed } from './loaded';

describe('loadedValue', () => {
  it('gives the value of a resource that has one', () => {
    expect(loadedValue({ hasValue: () => true, value: signal(1) })()).toBe(1);
  });

  it('does not read the value of a failed resource, which throws', () => {
    const value = Object.assign(() => { throw new Error('failed'); }, signal(0));
    expect(loadedValue({ hasValue: () => false, value })()).toBeUndefined();
  });

  it('marks a failed render as not to be cached', () => {
    const headers: Record<string, string> = {};
    const response = { statusCode: 200, setHeader: (name: string, value: string) => { headers[name] = value; } };
    markFailed(response);
    expect(response.statusCode).toBe(503);
    expect(headers['cache-control']).toBe('no-store');
    expect(headers['netlify-cdn-cache-control']).toBe('no-store');
  });
});
