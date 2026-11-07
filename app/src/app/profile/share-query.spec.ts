import { shareQuery } from './share-query';

describe('shareQuery', () => {
  it('leaves out all time and no flag, and puts extra first', () => {
    expect(shareQuery()).toBe('');
    expect(shareQuery('all', null)).toBe('');
    expect(shareQuery('2025', 'TR')).toBe('?period=2025&flag=TR');
    expect(shareQuery('all', 'DE', { v: '3' })).toBe('?v=3&flag=DE');
  });
});
