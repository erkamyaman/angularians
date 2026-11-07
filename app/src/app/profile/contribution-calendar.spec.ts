import { TestBed } from '@angular/core/testing';
import { encodeCalendar } from '@angularians/shared';
import { ContributionCalendar } from './contribution-calendar';

const summaryOf = (days: Record<string, number>, period: string) => {
  const fixture = TestBed.createComponent(ContributionCalendar);
  fixture.componentRef.setInput('days', encodeCalendar(new Map([[1, new Map(Object.entries(days))]]))[1]);
  fixture.componentRef.setInput('period', period);
  fixture.componentRef.setInput('collectedAt', '2026-11-07T05:13:00Z');
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
};

describe('ContributionCalendar', () => {
  it('sums up a year and names its busiest day', () => {
    const element = summaryOf({ '2026-03-03': 2, '2026-03-04': 8 }, '2026');
    expect(element.querySelector('#calendar-summary')?.textContent?.trim()).toBe('10 contributions on 2 days in 2026, the busiest on 4 March (8).');
  });

  it('dates the busiest day in full over the last 12 months, which span two years', () => {
    const element = summaryOf({ '2025-12-30': 1, '2026-10-28': 5 }, '12m');
    expect(element.querySelector('#calendar-summary')?.textContent?.trim()).toBe('6 contributions on 2 days in the last 12 months, the busiest on 28 October 2026 (5).');
  });

  it('names the one day of someone who contributed on one day', () => {
    const element = summaryOf({ '2026-03-04': 3 }, '2026');
    expect(element.querySelector('#calendar-summary')?.textContent?.trim()).toBe('3 contributions in 2026, on 4 March.');
  });

  it('draws a square for every day, with its count in a tooltip, and leaves the grid to the summary for screen readers', () => {
    const element = summaryOf({ '2026-03-04': 3 }, '2026');
    const days = element.querySelectorAll('[data-level]:not(.legend [data-level])');
    expect(days).toHaveLength(311);
    expect(element.querySelector('[title="3 contributions on 4 March 2026"]')).not.toBeNull();
    expect(element.querySelector('.calendar')?.getAttribute('aria-hidden')).toBe('true');
  });
});
