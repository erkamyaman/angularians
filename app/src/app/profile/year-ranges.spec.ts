import { yearRanges } from './year-ranges';

describe('yearRanges', () => {
  it.each([
    [[2025], '2025'],
    [[2024, 2025, 2026], '2024–2026'],
    [[2019, 2024, 2025, 2026], '2019, 2024–2026'],
    [[2016, 2018], '2016, 2018'],
  ])('%j → %s', (years, expected) => expect(yearRanges(years)).toBe(expected));
});
