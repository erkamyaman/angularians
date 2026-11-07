import { onTestFinished } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CountrySelect } from './country-select';

describe('CountrySelect', () => {
  it('stays hidden until profiles give countries', () => {
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="combobox"]')).toBeNull();

    fixture.componentRef.setInput('countries', [{ code: 'TR', count: 3, top: [] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="combobox"]')?.getAttribute('aria-label')).toBe('Filter by country');
  });

  it('keeps showing a picked country with nobody in this period', () => {
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', []);
    fixture.componentRef.setInput('value', 'BG');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Bulgaria');
  });

  it('filters the countries by name and emits the pick', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView;
    Element.prototype.scrollIntoView = () => undefined;
    onTestFinished(() => {
      Element.prototype.scrollIntoView = scrollIntoView;
    });
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', [{ code: 'TR', count: 3, top: [] }, { code: 'BG', count: 1, top: [] }]);
    fixture.detectChanges();
    const picked: Array<string | null> = [];
    fixture.componentInstance.valueChange.subscribe(value => picked.push(value));

    fixture.nativeElement.querySelector('[role="combobox"]').click();
    await fixture.whenStable();
    const input = document.querySelector('input[aria-label="Search a country"]') as HTMLInputElement;
    input.value = 'bulg';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    const visible = () => [...document.querySelectorAll<HTMLElement>('[role="option"]:not([data-hidden])')];
    expect(visible().map(option => option.getAttribute('data-value'))).toEqual(['BG']);
    visible()[0]!.click();
    expect(picked).toEqual(['BG']);
  });

  it('highlights the selected country when it opens', async () => {
    const scrollIntoView = Element.prototype.scrollIntoView;
    const scrolled: Element[] = [];
    Element.prototype.scrollIntoView = function () { scrolled.push(this); };
    onTestFinished(() => {
      Element.prototype.scrollIntoView = scrollIntoView;
    });
    const fixture = TestBed.createComponent(CountrySelect);
    fixture.componentRef.setInput('countries', [{ code: 'TR', count: 3, top: [] }, { code: 'BG', count: 1, top: [] }]);
    fixture.componentRef.setInput('value', 'BG');
    fixture.detectChanges();

    fixture.nativeElement.querySelector('[role="combobox"]').click();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    const bulgaria = document.querySelector('[role="option"][data-value="BG"]')!;
    expect(bulgaria.hasAttribute('data-highlighted')).toBe(true);
    expect(scrolled).toContain(bulgaria);
  });
});
