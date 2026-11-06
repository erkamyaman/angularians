import { TestBed } from '@angular/core/testing';
import { RankShield } from './rank-shield';

describe('RankShield', () => {
  function render(rank: number) {
    const fixture = TestBed.createComponent(RankShield);
    fixture.componentRef.setInput('rank', rank);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    return { host, lines: host.querySelectorAll('path').length, digits: host.querySelector('span')!.classList };
  }

  it.each([[7, 'digits-2'], [99, 'digits-2'], [999, 'digits-3'], [9999, 'digits-4'], [10000, 'digits-5'], [59358, 'digits-5']])('sizes %i with %s', (rank, size) => {
    expect(render(rank).digits).toContain(size);
  });

  it('widens the shield and drops its inner line from 10,000', () => {
    const small = render(9999);
    const large = render(10000);
    expect(small.host.classList).not.toContain('wide');
    expect(large.host.classList).toContain('wide');
    expect(large.lines).toBe(small.lines - 1);
  });
});
