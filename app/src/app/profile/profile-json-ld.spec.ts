import type { ContributorProfile } from '@angularians/shared';
import { profileJsonLd } from './profile-json-ld';

describe('profileJsonLd', () => {
  it('describes the profile page, its person and its breadcrumbs', () => {
    const person = { username: 'crisbeto', name: null, githubId: 7 } as unknown as ContributorProfile;
    const [page, trail] = (profileJsonLd(person, { title: 'crisbeto, Angularian #2', description: 'd' }) as { '@graph': Record<string, unknown>[] })['@graph'];
    expect(page).toMatchObject({ '@type': 'ProfilePage', url: 'https://angularians.dev/crisbeto', name: 'crisbeto, Angularian #2 · Angularians', description: 'd' });
    expect(page!['mainEntity']).toMatchObject({ name: 'crisbeto', identifier: '7', sameAs: ['https://github.com/crisbeto'] });
    expect(trail).toMatchObject({ '@type': 'BreadcrumbList' });
  });
});
