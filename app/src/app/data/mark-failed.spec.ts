import { markFailed } from './mark-failed';

describe('markFailed', () => {
  it('marks a failed render as not to be cached', () => {
    const headers: Record<string, string> = {};
    const response = { statusCode: 200, setHeader: (name: string, value: string) => { headers[name] = value; } };
    markFailed(response);
    expect(response.statusCode).toBe(503);
    expect(headers['cache-control']).toBe('no-store');
    expect(headers['netlify-cdn-cache-control']).toBe('no-store');
  });
});
