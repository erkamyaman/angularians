import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { octGitPullRequest, octIssueOpened } from '@ng-icons/octicons'
import { remixUserLine } from '@ng-icons/remixicon'
import { HlmButton } from '@spartan-ng/helm/button'
import { AngularLogo } from '../layout/angular-logo'
import { vikingAnvil, vikingHammer, vikingLongship, vikingScroll } from '../layout/viking-icons'

const REPO = 'https://github.com/erkamyaman/angularians'

@Component({
  selector: 'app-claim-badge',
  imports: [AngularLogo, HlmButton, NgIcon],
  providers: [provideIcons({ octGitPullRequest, octIssueOpened, remixUserLine, vikingAnvil, vikingHammer, vikingLongship, vikingScroll })],
  host: { class: 'block' },
  templateUrl: './claim-badge.html',
})
export class ClaimBadge {
  protected readonly issueUrl = `${REPO}/issues/new?template=badge-request.yml`
  protected readonly prUrl = `${REPO}/blob/main/CONTRIBUTING.md#adding-things`
  protected readonly ideas = [
    { text: 'You made an Angular library people use.', icon: 'vikingAnvil', color: 'text-[#BF3989] dark:text-[#DB61A2]' },
    { text: 'You built a tool for Angular developers.', icon: 'vikingHammer', color: 'text-[#59636E] dark:text-[#A8B3BD]' },
    { text: 'You run an Angular meetup or community.', icon: 'vikingLongship', color: 'text-[#BC4C00] dark:text-[#F0883E]' },
    { text: 'You teach Angular in posts, videos or talks.', icon: 'vikingScroll', color: 'text-[#1B7C83] dark:text-[#39C5CF]' },
  ]
}
