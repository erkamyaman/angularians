import { TestBed } from '@angular/core/testing';
import { ContributorSince } from './contributor-since';

describe('ContributorSince', () => {
  it('names the month of the first contribution, in UTC', () => {
    const fixture = TestBed.createComponent(ContributorSince);
    fixture.componentRef.setInput('date', '2016-11-30T23:30:00Z');
    fixture.detectChanges();
    const element: HTMLElement = fixture.nativeElement;
    expect(element.textContent?.replace(/\s+/g, ' ').trim()).toBe('Angular contributor since Nov 2016');
    expect(element.querySelector('app-angular-logo')).not.toBeNull();
  });
});
