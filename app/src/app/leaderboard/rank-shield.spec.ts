import { TestBed } from '@angular/core/testing';
import { RankShield } from './rank-shield';

describe('RankShield', () => {
  function render(rank: number) {
    const fixture = TestBed.createComponent(RankShield);
    fixture.componentRef.setInput('rank', rank);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;
    return { host, lines: host.querySelectorAll('path').length, size: host.querySelector('span')!.style.fontSize };
  }

  it.each([[99, '1em'], [999, '0.85em'], [9999, '0.7em'], [10000, '0.8em'], [59358, '0.8em']])('sizes %i at %s', (rank, size) => {
    expect(render(rank).size).toBe(size);
  });

  it('widens the shield and drops its inner line from 10,000', () => {
    const small = render(9999);
    const large = render(10000);
    expect(small.host.classList).not.toContain('wide');
    expect(large.host.classList).toContain('wide');
    expect(large.lines).toBe(small.lines - 1);
  });
});
