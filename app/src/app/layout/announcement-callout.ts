import { Component, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixArrowRightUpLine, remixNewspaperLine } from '@ng-icons/remixicon'

/** A dashed box under the home page's introduction, the whole of it a link to a post. */
@Component({
  selector: 'app-announcement-callout',
  imports: [NgIcon],
  providers: [provideIcons({ remixArrowRightUpLine, remixNewspaperLine })],
  templateUrl: './announcement-callout.html',
  styleUrl: './announcement-callout.css',
})
export class AnnouncementCallout {
  readonly title = input.required<string>()
  readonly href = input.required<string>()
}
