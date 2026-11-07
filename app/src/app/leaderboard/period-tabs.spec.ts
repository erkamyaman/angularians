import { TestBed } from '@angular/core/testing';
import { PeriodTabs } from './period-tabs';

describe('PeriodTabs', () => {
  function render(period: string, periods: string[], ranks: Record<string, number> | null = null) {
    const fixture = TestBed.createComponent(PeriodTabs);
    fixture.componentRef.setInput('period', period);
    fixture.componentRef.setInput('periods', periods);
    fixture.componentRef.setInput('ranks', ranks);
    fixture.detectChanges();
    return fixture;
  }

  it('shows a tab per rolling window and all time, and the years in a picker', () => {
    const element: HTMLElement = render('12m', ['30d', '12m', 'all', '2026', '2025']).nativeElement;
    expect([...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.trim())).toEqual(['30 days', '12 months', 'All time']);
    expect(element.querySelector('[role="combobox"]')?.getAttribute('aria-label')).toBe('Year');
  });

  it('shows the rank of each period next to it on a profile, like Nuxters', () => {
    const fixture = render('2025', ['30d', '12m', 'all', '2025'], { '30d': 9, '12m': 7, 'all': 1028, '2025': 2 });
    const element: HTMLElement = fixture.nativeElement;
    const tabs = [...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.replace(/\s+/g, ' ').trim());
    expect(tabs).toEqual(['30 days #9', '12 months #7', 'All time #1,028']);
    // The picked year shows its rank on the closed picker too.
    expect(element.querySelector('[role="combobox"]')?.textContent?.trim()).toBe('2025 #2');
  });

  it('leaves out ranks for periods without one', () => {
    const element: HTMLElement = render('all', ['30d', 'all'], { all: 3 }).nativeElement;
    expect([...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.replace(/\s+/g, ' ').trim())).toEqual(['30 days', 'All time #3']);
  });

  it('only offers the periods with data', () => {
    const element: HTMLElement = render('all', ['all']).nativeElement;
    expect([...element.querySelectorAll('[role="tab"]')].map(tab => tab.textContent?.trim())).toEqual(['All time']);
    expect(element.querySelector('[role="combobox"]')).toBeNull();
  });

  it('emits a picked tab once, and nothing for the current one', () => {
    const fixture = render('12m', ['30d', '12m', 'all']);
    const picked: string[] = [];
    fixture.componentInstance.periodChange.subscribe(value => picked.push(value));
    const tabs = fixture.nativeElement.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
    tabs[1]!.click();
    tabs[2]!.click();
    fixture.detectChanges();
    expect(picked).toEqual(['all']);
  });
});
