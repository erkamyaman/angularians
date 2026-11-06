import { Component } from '@angular/core'
import { LogoMark } from './logo-mark'

/** The Angularian badge: the mark, and the word in the brand font. */
@Component({
  selector: 'app-angularian-pill',
  imports: [LogoMark],
  host: { class: 'inline-flex h-8 items-center gap-1.5 rounded-md bg-primary/10 px-2 text-base font-medium text-primary' },
  templateUrl: './angularian-pill.html',
})
export class AngularianPill {}
