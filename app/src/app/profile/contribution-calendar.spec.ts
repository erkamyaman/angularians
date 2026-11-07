import { TestBed } from '@angular/core/testing';
import { encodeCalendar } from '@angularians/shared';
import { ContributionCalendar } from './contribution-calendar';

const summaryOf = (days: Record<string, number>, period: string, years: string[] = ['2026']) => {
  const fixture = TestBed.createComponent(ContributionCalendar);
  fixture.componentRef.setInput('years', years);
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

  it('draws a square for every day, with its count in a tooltip on hover, and leaves the grid to the summary for screen readers', () => {
    const element = summaryOf({ '2026-03-04': 3 }, '2026');
    const days = element.querySelectorAll('[data-level]:not(.legend [data-level])');
    expect(days).toHaveLength(365);
    expect(element.querySelectorAll('.day.outside')).toHaveLength(54);
    const day = element.querySelector<HTMLElement>('[data-label="3 contributions on 4 March 2026"]')!;
    day.dispatchEvent(new MouseEvent('pointerover', { bubbles: true }));
    TestBed.tick();
    expect(element.querySelector('.tip')?.textContent?.trim()).toBe('3 contributions on 4 March 2026');
    expect(element.querySelector('.plot')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('lists the last 12 months and each year, newest first, with the shown one pressed, and asks for the one clicked', () => {
    const fixture = TestBed.createComponent(ContributionCalendar);
    fixture.componentRef.setInput('years', ['2024', 'all', '30d', '2026', '2025']);
    fixture.componentRef.setInput('days', []);
    fixture.componentRef.setInput('period', '2025');
    fixture.componentRef.setInput('collectedAt', '2026-11-07T05:13:00Z');
    const asked: string[] = [];
    fixture.componentInstance.periodChange.subscribe(period => asked.push(period));
    fixture.detectChanges();
    const buttons = [...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('.years button')];
    expect(buttons.map(button => button.textContent?.trim())).toEqual(['Last 30 days', 'Last 12 months', '2026', '2025', '2024']);
    expect(buttons.map(button => button.getAttribute('aria-pressed'))).toEqual(['false', 'false', 'false', 'true', 'false']);
    buttons[0]!.click();
    buttons[1]!.click();
    buttons[4]!.click();
    expect(asked).toEqual(['30d', '12m', '2024']);
  });

  it('switches between the gold of the mark and GitHub green, and remembers the choice in this browser', () => {
    localStorage.removeItem('angularians-graph-colors');
    document.documentElement.classList.remove('graph-green');
    const fixture = TestBed.createComponent(ContributionCalendar);
    fixture.componentRef.setInput('years', ['2026']);
    fixture.componentRef.setInput('days', []);
    fixture.componentRef.setInput('period', '2026');
    fixture.componentRef.setInput('collectedAt', '2026-11-07T05:13:00Z');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const [gold, green] = [...host.querySelectorAll<HTMLButtonElement>('.colors button')];
    expect([gold!.textContent?.trim(), gold!.getAttribute('aria-pressed'), green!.textContent?.trim(), green!.getAttribute('aria-pressed')]).toEqual(['Viking gold', 'true', 'GitHub green', 'false']);
    green!.click();
    fixture.detectChanges();
    expect(document.documentElement.classList.contains('graph-green')).toBe(true);
    expect(localStorage.getItem('angularians-graph-colors')).toBe('green');
  });

  it('explains what counts, and in which repositories, in a dialog', async () => {
    const element = summaryOf({}, '2026');
    element.querySelector<HTMLButtonElement>('[aria-label="What counts in the graph"]')!.click();
    await new Promise(resolve => setTimeout(resolve, 0));
    const dialog = document.querySelector('hlm-dialog-content');
    expect(dialog?.textContent).toContain('What counts in the graph?');
    expect(dialog?.querySelector('a[href="https://github.com/angular/angular-cli"]')?.textContent).toContain('angular/angular-cli');
  });
});
