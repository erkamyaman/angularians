import { Component } from '@angular/core'
import { LogoMark } from './logo-mark'

/** The Angularian badge: the mark, and the word in the brand font. */
@Component({
  selector: 'app-angularian-pill',
  imports: [LogoMark],
  templateUrl: './angularian-pill.html',
  styleUrl: './angularian-pill.css',
})
export class AngularianPill {}
