import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { classes } from './hlm';

@Directive({ selector: '[testHlm]' })
class TestHlm {
  constructor() {
    classes(() => 'h-9 px-2.5');
  }
}

@Component({
  imports: [TestHlm],
  template: `<button testHlm class="mt-4" [class.sm:hidden]="hidden()" [class.wide]="wide()"></button>`,
})
class Host {
  readonly hidden = signal(true);
  readonly wide = signal(false);
}

const microtask = () => new Promise<void>(resolve => queueMicrotask(resolve));

describe('classes()', () => {
  it('keeps the server classes while a page hydrates, then Angular\'s static and bound classes with its own', async () => {
    const fixture = TestBed.createComponent(Host);
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');

    // The server's button, as hydration finds it: its classes, a variant's the client does not draw ("shadow-xs"),
    // and `wide`, bound to false in the browser
    const parent = button.parentNode!;
    parent.removeChild(button);
    await microtask();
    button.className = 'h-9 px-2.5 shadow-xs mt-4 sm:hidden wide';
    parent.appendChild(button);

    // Hydration writes the static class over them, and the server's come back before the next paint
    button.setAttribute('class', 'mt-4');
    await microtask();
    expect(button.className).toBe('h-9 px-2.5 shadow-xs mt-4 sm:hidden wide');

    // Then the bindings (`sm:hidden` is already there) and the first effect
    fixture.detectChanges();
    await fixture.whenStable();
    expect(button.className.split(' ').sort()).toEqual(['h-9', 'mt-4', 'px-2.5', 'sm:hidden']);

    // and the bindings keep working
    fixture.componentInstance.hidden.set(false);
    fixture.componentInstance.wide.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    await microtask();
    expect(button.className.split(' ').sort()).toEqual(['h-9', 'mt-4', 'px-2.5', 'wide']);
    expect(Object.hasOwn(button, 'classList')).toBe(false);
  });

  it('takes the element\'s classes as they are when it is drawn in the browser', async () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    await fixture.whenStable();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(button.className.split(' ').sort()).toEqual(['h-9', 'mt-4', 'px-2.5', 'sm:hidden']);
  });
});
