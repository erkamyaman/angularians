import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { octGitPullRequest, octIssueOpened } from '@ng-icons/octicons'
import { remixUserLine } from '@ng-icons/remixicon'
import { HlmButton } from '@spartan-ng/helm/button'
import { AngularLogo } from '../layout/angular-logo'
import { REPO_URL } from '../site'
import { vikingAnvil, vikingHammer, vikingLongship, vikingRaven, vikingScroll } from '../layout/viking-icons'

@Component({
  selector: 'app-claim-badge',
  imports: [AngularLogo, HlmButton, NgIcon],
  providers: [provideIcons({ octGitPullRequest, octIssueOpened, remixUserLine, vikingAnvil, vikingHammer, vikingLongship, vikingRaven, vikingScroll })],
  templateUrl: './claim-badge.html',
  styleUrl: './claim-badge.css',
})
export class ClaimBadge {
  protected readonly issueUrl = `${REPO_URL}/issues/new?template=badge-request.yml`
  protected readonly prUrl = `${REPO_URL}/blob/main/.agents/skills/add-a-custom-badge/SKILL.md`
  protected readonly ideas = [
    { text: 'You made an Angular library people use.', icon: 'vikingAnvil', kind: 'library' },
    { text: 'You built a tool for Angular developers.', icon: 'vikingHammer', kind: 'tool' },
    { text: 'You run an Angular meetup or community.', icon: 'vikingLongship', kind: 'meetup' },
    { text: 'You teach Angular in posts, videos or talks.', icon: 'vikingScroll', kind: 'teaching' },
  ]
}
