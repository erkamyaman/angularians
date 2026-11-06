import { TestBed } from '@angular/core/testing';
import { emptyActivity, emptyCounts, type PullRequestType } from '@angularians/shared';
import { ScoreBreakdown } from './score-breakdown';

const stats = (prs: Partial<Record<PullRequestType, number>>, activity: Partial<ReturnType<typeof emptyActivity>> = {}) => {
  const pullRequests = { ...emptyCounts(), ...prs };
  pullRequests.all = pullRequests.feat + pullRequests.fix + pullRequests.docs + pullRequests.chore;
  return { pullRequests, ...emptyActivity(), ...activity };
};

describe('ScoreBreakdown', () => {
  it('lists each type as count × points = total, the biggest first', () => {
    const fixture = TestBed.createComponent(ScoreBreakdown);
    fixture.componentRef.setInput('stats', stats({ feat: 16, fix: 66, docs: 134, chore: 33 }, { issues: 3, helpfulIssues: 2, comments: 41, helpfulComments: 1, reviewComments: 12, reactions: 25 }));
    fixture.detectChanges();
    const rows = [...fixture.nativeElement.querySelectorAll('li')].map((li: HTMLElement) => li.querySelector('div')!.textContent!.replace(/\s+/g, ' ').trim());
    expect(rows).toEqual([
      'Docs PRs 134 × 4 = 536', 'Fix PRs 66 × 5 = 330', 'Feature PRs 16 × 7 = 112', 'Chore PRs 33 × 3 = 99', 'Comments 41 × 0.5 = 20.5',
      'Review comments 12 × 1 = 12', 'Helpful issues 2 × 3 = 6', 'Issues 3 × 1 = 3', 'Reactions received 25 × 0.1 = 2.5', 'Helpful comments 1 × 2 = 2',
      'Security reports 0 × 20 = 0',
    ]);
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
    expect(transforms).toHaveLength(11);
  });
});
