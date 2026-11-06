import { Component } from '@angular/core';

let nextId = 0;

/**
 * The gradient Angular icon, from the Angular press kit (https://angular.dev/press-kit), CC BY 4.0, © Google.
 * For Angular itself, not this site: the site's own mark is the Angularians A.
 * Each instance gets its own gradient ids, so several on a page do not share (and break) each other's.
 */
@Component({
  selector: 'app-angular-logo',
  host: { class: 'inline-block shrink-0' },
  templateUrl: './angular-logo.html',
})
export class AngularLogo {
  protected readonly id = `angular-logo-${nextId++}-`;
  protected readonly shape = 'm222.077 39.192-8.019 125.923L137.387 0l84.69 39.192Zm-53.105 162.825-57.933 33.056-57.934-33.056 11.783-28.556h92.301l11.783 28.556ZM111.039 62.675l30.357 73.803H80.681l30.358-73.803ZM7.937 165.115 0 39.192 84.69 0 7.937 165.115Z';
}
