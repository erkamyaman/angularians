import { boardJsonLd } from './board-json-ld';

describe('boardJsonLd', () => {
  it("is the site, or a country's board below it", () => {
    expect(boardJsonLd(null)).toMatchObject({ '@type': 'WebSite' });
    expect(boardJsonLd('DE')).toMatchObject({
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: 'Angularians' }, { name: 'Angular contributors in Germany', item: 'https://angularians.dev/?country=DE' }],
    });
  });
});
