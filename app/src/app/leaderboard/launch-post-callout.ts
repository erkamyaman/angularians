import { Component, input } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { remixArrowRightUpLine, remixNewspaperLine } from '@ng-icons/remixicon'
import type { LaunchPost } from '../site'

/** A dashed box under the home page's introduction, the whole of it a link to the launch post. */
@Component({
  selector: 'app-launch-post-callout',
  imports: [NgIcon],
  providers: [provideIcons({ remixArrowRightUpLine, remixNewspaperLine })],
  templateUrl: './launch-post-callout.html',
  styleUrl: './launch-post-callout.css',
})
export class LaunchPostCallout {
  readonly post = input.required<LaunchPost>()
}
