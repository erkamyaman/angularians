import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';
import { ContributorSearch } from './contributor-search';

const search = vi.hoisted(() => vi.fn());
vi.mock('@analogjs/router', async importOriginal => ({ ...await importOriginal<object>(), injectServerFnMutation: () => search }));
vi.mock('../data/contributors.server', () => ({ searchContributors: {} }));

describe('ContributorSearch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    search.mockReset();
    search.mockResolvedValue([{ githubId: 1, username: 'cris', rank: 1, score: 1 }]);
  });
  afterEach(() => vi.useRealTimers());

  function render() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(ContributorSearch);
    fixture.componentRef.setInput('period', '12m');
    fixture.componentRef.setInput('country', 'TR');
    const component = fixture.componentInstance as unknown as {
      term: { set(value: string): void };
      results(): unknown[];
      openProfile(item: unknown): void;
    };
    return { fixture, component };
  }

  async function settle(fixture: ReturnType<typeof render>['fixture']) {
    fixture.detectChanges();
    TestBed.tick();
    await vi.advanceTimersByTimeAsync(200);
  }

  it('searches the selected country, and clears its results when the country changes', async () => {
    const { fixture, component } = render();
    component.term.set('cris');
    await settle(fixture);
    expect(search).toHaveBeenCalledWith({ q: 'cris', country: 'TR' });
    expect(component.results()).toHaveLength(1);

    let finish!: (items: unknown[]) => void;
    search.mockReturnValue(new Promise(resolve => { finish = resolve; }));
    fixture.componentRef.setInput('country', 'BG');
    await settle(fixture);
    expect(search).toHaveBeenLastCalledWith({ q: 'cris', country: 'BG' });
    expect(component.results()).toEqual([]);
    finish([]);
  });

  it('keeps the country when opening a result', () => {
    const { fixture, component } = render();
    fixture.detectChanges();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.openProfile({ username: 'cris' });
    expect(navigate).toHaveBeenCalledWith(['/', 'cris'], { queryParams: { period: '12m', country: 'TR' } });
  });
});
