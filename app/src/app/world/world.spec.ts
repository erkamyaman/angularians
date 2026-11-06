import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { faceOnGlobe, projectOnGlobe } from './globe-math';
import { World } from './world';

describe('globe math', () => {
  it('puts the point the camera faces in the middle, on the visible side', () => {
    for (const location of [[48.86, 2.35], [-33.87, 151.21], [40.71, -74.01], [0, 0]] as const) {
      const { phi, theta } = faceOnGlobe(location);
      const out = { depth: 0, x: 0, y: 0 };
      projectOnGlobe(out, location, phi, theta, 1);
      expect(out.x).toBeCloseTo(0, 6);
      expect(out.y).toBeCloseTo(0, 6);
      expect(out.depth).toBeGreaterThan(0.7);
    }
  });

  it('hides the opposite side of the globe', () => {
    const { phi, theta } = faceOnGlobe([0, 0]);
    const out = { depth: 0, x: 0, y: 0 };
    projectOnGlobe(out, [0, 180], phi, theta, 1);
    expect(out.depth).toBeLessThan(0);
  });
});

/** A row as a screen reader reads it: without what is hidden from it. */
const spoken = (button: Element) => {
  const copy = button.cloneNode(true) as Element;
  copy.querySelectorAll('[aria-hidden="true"], app-rank-shield').forEach(hidden => hidden.remove());
  return copy.textContent!.replace(/\s+/g, ' ').trim();
};

describe('World', () => {
  const map = {
    period: '12m',
    total: 10,
    located: 6,
    countries: [{ code: 'US', count: 4, top: ['a', 'b', 'c'] }, { code: 'TR', count: 2, top: ['d', 'e'] }],
  };

  function render(selected: string | null, people: Array<{ githubId: number, username: string, rank: number, score: number }> = []) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(World);
    fixture.componentRef.setInput('map', map);
    fixture.componentRef.setInput('selected', selected);
    fixture.componentRef.setInput('people', people);
    fixture.detectChanges();
    return fixture;
  }

  it('filters the list by country name and keeps the ranks', () => {
    const fixture = render(null);
    const element: HTMLElement = fixture.nativeElement;
    const input = element.querySelector('input[aria-label="Search a country"]') as HTMLInputElement;
    const type = (value: string) => {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    };
    type('tÜr');
    const rows = [...element.querySelectorAll('ol li button')].map(spoken);
    expect(rows).toEqual(['Rank 2Turkey2']);
    type('nowhere');
    expect(element.querySelector('ol')!.textContent).toContain('No country found');
  });

  it('gives countries with the same count the same rank', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(World);
    fixture.componentRef.setInput('map', {
      period: '12m',
      total: 10,
      located: 7,
      countries: [{ code: 'US', count: 4, top: [] }, { code: 'TR', count: 1, top: [] }, { code: 'BG', count: 1, top: [] }, { code: 'FR', count: 1, top: [] }],
    });
    fixture.detectChanges();
    const ranks = [...fixture.nativeElement.querySelectorAll('ol li button')].map((button: HTMLElement) => button.querySelector('[data-rank] .sr-only')!.textContent!.replace('Rank', '').trim());
    expect(ranks).toEqual(['1', '2', '2', '2']);
  });

  it('skips the taken ranks after a tie', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(World);
    fixture.componentRef.setInput('map', {
      period: '12m',
      total: 10,
      located: 6,
      countries: [{ code: 'US', count: 3, top: [] }, { code: 'TR', count: 1, top: [] }, { code: 'BG', count: 1, top: [] }, { code: 'FR', count: 1, top: [] }, { code: 'DE', count: 0, top: [] }],
    });
    fixture.detectChanges();
    const ranks = [...fixture.nativeElement.querySelectorAll('ol li button')].map((button: HTMLElement) => button.querySelector('[data-rank] .sr-only')!.textContent!.replace('Rank', '').trim());
    expect(ranks).toEqual(['1', '2', '2', '2', '5']);
  });

  it('lists countries from the most contributors, with how many set a location', () => {
    const element: HTMLElement = render(null).nativeElement;
    const rows = [...element.querySelectorAll('ol li button')].map(spoken);
    expect(rows).toEqual(['Rank 1United States4', 'Rank 2Turkey2']);
    expect(element.textContent).toContain('6 of 10 Angularians set one');
  });

  it('emits the picked country, and null to unpick it', () => {
    const fixture = render('TR');
    const picked: Array<string | null> = [];
    fixture.componentInstance.select.subscribe(value => picked.push(value));
    const buttons = fixture.nativeElement.querySelectorAll('ol li button') as NodeListOf<HTMLButtonElement>;
    buttons[0]!.click();
    buttons[1]!.click();
    expect(picked).toEqual(['US', null]);
    expect(buttons[1]!.getAttribute('aria-pressed')).toBe('true');
  });

  it('shows a card with one tile per contributor, skeletons while they load', () => {
    const loading: HTMLElement = render('TR').nativeElement;
    expect(loading.textContent).toContain('Turkey');
    expect(loading.textContent).toContain('2 Angularians · #2 country');
    expect(loading.querySelectorAll('[aria-label="Best ranked from Turkey"] li [hlmSkeleton]').length).toBeGreaterThan(0);

    TestBed.resetTestingModule();
    const loaded: HTMLElement = render('TR', [{ githubId: 1, username: 'd', rank: 3, score: 9 }, { githubId: 2, username: 'e', rank: 7, score: 5 }]).nativeElement;
    const links = [...loaded.querySelectorAll('[aria-label="Best ranked from Turkey"] li a')].map(a => a.getAttribute('aria-label'));
    expect(links.slice(0, 2)).toEqual(['d, #3', 'e, #7']);
  });
});
