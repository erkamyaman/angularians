import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { simpleDiscord } from '@ng-icons/simple-icons'
import { AngularLogo } from '../layout/angular-logo'
import { FirstPrGuides } from './first-pr-guides'
import { avatarUrl } from './format'

const AUTHOR_ID = 88717125

@Component({
  selector: 'app-join-links',
  imports: [AngularLogo, FirstPrGuides, NgIcon],
  providers: [provideIcons({ simpleDiscord })],
  templateUrl: './join-links.html',
  styleUrl: './join-links.css',
})
export class JoinLinks {
  protected readonly authorAvatar = avatarUrl(AUTHOR_ID, 20)
}
