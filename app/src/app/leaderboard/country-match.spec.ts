import { matchesCountry } from './country-match';

describe('matchesCountry', () => {
  it.each([
    ['TR', 'turkey'],
    ['TR', 'Türkiye'],
    ['TR', 'turkiye'],
    ['TR', 'TÜRKİYE'],
    ['TR', 'türkıye'],
    ['US', 'usa'],
    ['GB', 'uk'],
    ['DE', 'deutsch'],
  ])('%s matches %s', (code, search) => expect(matchesCountry(code, search)).toBe(true));

  it('does not match another country', () => {
    expect(matchesCountry('DE', 'türkiye')).toBe(false);
    expect(matchesCountry('ZZ', 'usa')).toBe(false);
  });
});
