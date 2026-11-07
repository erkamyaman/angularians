import { plural, pluralWord } from './plural';

describe('plural', () => {
  it('plurals the same on server and browser', () => {
    expect(plural(1, 'person', 'people')).toBe('1 person');
    expect(plural(2194, 'person', 'people')).toBe('2,194 people');
    expect(pluralWord(1, 'Issue', 'Issues')).toBe('Issue');
    expect(pluralWord(0, 'Issue', 'Issues')).toBe('Issues');
  });
});
