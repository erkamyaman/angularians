import { Component } from '@angular/core'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { octGitPullRequest, octIssueOpened } from '@ng-icons/octicons'
import { remixUserLine } from '@ng-icons/remixicon'
import { HlmButton } from '@spartan-ng/helm/button'
import { AngularLogo } from '../layout/angular-logo'
import { REPO_URL } from '../site'
import { vikingAnvil, vikingHammer, vikingLongship, vikingScroll } from '../layout/viking-icons'

@Component({
  selector: 'app-claim-badge',
  imports: [AngularLogo, HlmButton, NgIcon],
  providers: [provideIcons({ octGitPullRequest, octIssueOpened, remixUserLine, vikingAnvil, vikingHammer, vikingLongship, vikingScroll })],
  host: { class: 'block' },
  templateUrl: './claim-badge.html',
})
export class ClaimBadge {
  protected readonly issueUrl = `${REPO_URL}/issues/new?template=badge-request.yml`
  protected readonly prUrl = `${REPO_URL}/blob/main/.agents/skills/add-a-custom-badge/SKILL.md`
  protected readonly ideas = [
    { text: 'You made an Angular library people use.', icon: 'vikingAnvil', color: 'text-(--idea-library)' },
    { text: 'You built a tool for Angular developers.', icon: 'vikingHammer', color: 'text-(--idea-tool)' },
    { text: 'You run an Angular meetup or community.', icon: 'vikingLongship', color: 'text-(--idea-meetup)' },
    { text: 'You teach Angular in posts, videos or talks.', icon: 'vikingScroll', color: 'text-(--idea-teaching)' },
  ]
}
