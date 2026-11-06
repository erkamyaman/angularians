import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { simpleDiscord } from '@ng-icons/simple-icons'
import { AngularLogo } from '../layout/angular-logo'
import { FirstPrGuides, GUIDE } from './first-pr-guides'
import { avatarUrl } from './format'

const AUTHOR_ID = 88717125

@Component({
  selector: 'app-join-links',
  imports: [AngularLogo, FirstPrGuides, NgIcon],
  providers: [provideIcons({ simpleDiscord })],
  host: { class: 'mx-auto grid w-full max-w-4xl gap-6 text-left @min-[640px]:grid-cols-2' },
  templateUrl: './join-links.html',
})
export class JoinLinks {
  protected readonly guide = GUIDE
  protected readonly authorAvatar = avatarUrl(AUTHOR_ID, 20)
}
