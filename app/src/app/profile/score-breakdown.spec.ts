import { TestBed } from '@angular/core/testing';
import { emptyActivity, emptyCounts, type PullRequestType } from '@angularians/shared';
import { ScoreBreakdown } from './score-breakdown';

const stats = (prs: Partial<Record<PullRequestType, number>>, activity: Partial<ReturnType<typeof emptyActivity>> = {}) => {
  const pullRequests = { ...emptyCounts(), ...prs };
  pullRequests.all = pullRequests.feat + pullRequests.fix + pullRequests.docs + pullRequests.chore;
  return { pullRequests, ...emptyActivity(), ...activity };
};

const headerText = (header: Element): string => {
  const [label, calculation] = [...header.children];
  const value = calculation!.classList.contains('advisory-total')
    ? [...calculation!.children].map(part => part.textContent!.trim()).join(' ')
    : calculation!.textContent!;
  return `${label!.textContent!.trim()} ${value}`.replace(/\s+/g, ' ').trim();
};

describe('ScoreBreakdown', () => {
  it('lists each type as count × points = total, the biggest first', () => {
    const fixture = TestBed.createComponent(ScoreBreakdown);
    fixture.componentRef.setInput('stats', stats({ feat: 16, fix: 66, docs: 134, chore: 33 }, { issues: 3, helpfulIssues: 2, comments: 41, helpfulComments: 1, reviewComments: 12, reactions: 25 }));
    fixture.detectChanges();
    const rows = [...fixture.nativeElement.querySelectorAll('li')].map((li: HTMLElement) => headerText(li.querySelector('div')!));
    expect(rows).toEqual([
      'Docs PRs 134 × 4 = 536', 'Fix PRs 66 × 5 = 330', 'Feature PRs 16 × 7 = 112', 'Chore PRs 33 × 3 = 99', 'Comments 41 × 0.5 = 20.5',
      'Review comments 12 × 1 = 12', 'Helpful issues 2 × 3 = 6', 'Issues 3 × 1 = 3', 'Reactions received 25 × 0.1 = 2.5', 'Helpful comments 1 × 2 = 2',
      'Translations 0 × 20 = 0', 'Translation contributions 0 × 10 = 0', 'Security advisories 0 credits · 0 pts',
    ]);
  });

  it('hides role groups behind one calculation disclosure while keeping security totals visible', () => {
    const fixture = TestBed.createComponent(ScoreBreakdown);
    fixture.componentRef.setInput('stats', {
      ...stats({}), advisories: 20,
      advisoryCredits: { finder: { unknown: 5 }, reporter: { unknown: 2 }, analyst: { unknown: 1 }, remediation_developer: { unknown: 12 } },
    });
    fixture.detectChanges();
    const advisory = [...fixture.nativeElement.querySelectorAll('ul > li')]
      .find((li: HTMLElement) => li.textContent?.includes('Security advisories')) as HTMLElement;
    const summary = headerText(advisory.querySelector('div')!);
    const groups = [...advisory.querySelectorAll('.advisory-groups > li')]
      .map(li => {
        const label = li.querySelector('.group-label')!.textContent!.trim();
        const totals = [...li.querySelector('.group-summary')!.children].map(part => part.textContent!.trim()).join(' ');
        return `${label} ${totals}`;
      });
    expect(summary).toBe('Security advisories 20 credits · 530 pts');
    expect(groups).toEqual([
      'Analyst / Remediation developer 13 credits · 390 pts',
      'Finder / Reporter 7 credits · 140 pts',
    ]);
    const outer = advisory.querySelector('.advisory-details') as HTMLDetailsElement;
    expect(outer.querySelector('summary')!.textContent!.trim()).toBe('View calculation');
    expect(outer.open).toBe(false);
    expect(outer.contains(advisory.querySelector('.score-row-heading'))).toBe(false);
    const disclosures = [...outer.querySelectorAll('details')];
    expect(disclosures).toHaveLength(2);
    expect(disclosures.every(details => !details.open && !details.hasAttribute('name'))).toBe(true);
    expect(advisory.querySelectorAll('details')).toHaveLength(3);
    expect(outer.querySelectorAll('summary details')).toHaveLength(0);
    outer.open = true;
    disclosures[0]!.open = true;
    expect(disclosures[1]!.open).toBe(false);
    disclosures[1]!.open = true;
    expect(disclosures.every(details => details.open)).toBe(true);
    outer.open = false;
    expect(disclosures.every(details => details.open)).toBe(true);
  });

  it('keeps each severity calculation in its own accessible disclosure', () => {
    const fixture = TestBed.createComponent(ScoreBreakdown);
    fixture.componentRef.setInput('stats', {
      ...stats({}), advisories: 3,
      advisoryCredits: { finder: { moderate: 1 }, remediation_developer: { high: 1, critical: 1 } },
    });
    fixture.detectChanges();
    const details = fixture.nativeElement.querySelector('.advisory-group') as HTMLDetailsElement;
    expect(details.querySelector('.group-label')!.textContent!.trim()).toBe('Remediation developer');
    expect(details.open).toBe(false);
    const tables = [...details.querySelectorAll('table')];
    expect(tables).toHaveLength(1);
    expect(tables[0]!.querySelector('caption')!.textContent).toContain('Remediation developer');
    expect(tables[0]!.querySelector('caption')!.textContent).toContain('30 base pts per credit');
    expect([...tables[0]!.querySelectorAll('thead th')].map(th => th.textContent!.trim())).toEqual(['Severity', 'Credits', 'Points']);
    expect([...tables[0]!.querySelectorAll('tbody tr')].map(tr => [...tr.children].map(cell => cell.textContent!.trim()).join(' '))).toEqual([
      'Critical ×5 1 150', 'High ×3 1 90',
    ]);
    expect(fixture.nativeElement.textContent).toContain('240 pts');
    expect(fixture.nativeElement.textContent).toContain('40 pts');
  });

  it('draws the bars on one scale: the biggest full, the others in proportion', () => {
    const fixture = TestBed.createComponent(ScoreBreakdown);
    fixture.componentRef.setInput('stats', stats({ docs: 100 }));
    fixture.detectChanges();
    fixture.componentRef.setInput('stats', stats({ fix: 2, docs: 5 }));
    fixture.detectChanges();
    // docs 20 (max), fix 10 (half), every other row 0 (empty)
    const transforms = [...fixture.nativeElement.querySelectorAll('hlm-progress-indicator')].map((el: HTMLElement) => el.style.transform);
    expect(transforms.slice(0, 3)).toEqual(['translateX(-0%)', 'translateX(-50%)', 'translateX(-100%)']);
    expect(transforms).toHaveLength(13);
  });
});
