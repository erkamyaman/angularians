import { untilNextCollection } from './next-collection';

describe('untilNextCollection', () => {
  it.each([
    ['2026-11-05T00:00:00Z', '3h 17m'],
    ['2026-11-05T03:00:00Z', '17m'],
    ['2026-11-05T03:16:30Z', 'under a minute'],
    ['2026-11-05T03:17:00Z', '24h 0m'],
    ['2026-11-05T22:17:00Z', '5h 0m'],
    ['2026-12-31T23:00:00Z', '4h 17m'],
  ])('at %s: %s', (now, expected) => expect(untilNextCollection(new Date(now))).toBe(expected));
});
