import { Component } from '@angular/core'
import { ACTIVITY_POINTS, ADVISORY_ROLE_POINTS, ADVISORY_SEVERITY_MULTIPLIERS, HELPFUL_COMMENT_REACTIONS, HELPFUL_ISSUE_COMMENTS, HELPFUL_ISSUE_REACTIONS, PULL_REQUEST_POINTS, REPOS, SEVERITY_LABELS } from '@angularians/shared'
import { NgIcon, provideIcons } from '@ng-icons/core'
import { octComment, octIssueOpened, octShield, octSmiley } from '@ng-icons/octicons'
import { remixChatHeartLine, remixFileCodeLine, remixLightbulbLine, remixTranslate2 } from '@ng-icons/remixicon'
import { vikingAnvil, vikingBroom, vikingHammer, vikingScroll, vikingSword } from '../layout/viking-icons'
import { HlmButton } from '@spartan-ng/helm/button'
import { HlmDialogImports } from '@spartan-ng/helm/dialog'
import type { GithubColor } from './github-color'

/** The hero's "How the score works": every rule, in a dialog (Nuxters keeps the page itself for people). */
@Component({
  selector: 'app-score-rules',
  imports: [HlmButton, HlmDialogImports, NgIcon],
  providers: [provideIcons({ octComment, octIssueOpened, octShield, octSmiley, remixChatHeartLine, remixFileCodeLine, remixLightbulbLine, remixTranslate2, vikingAnvil, vikingBroom, vikingHammer, vikingScroll, vikingSword })],
  templateUrl: './score-rules.html',
  styleUrl: './score-rules.css',
})
export class ScoreRules {
  protected readonly repos = REPOS
  protected readonly severities = (['low', 'moderate', 'high', 'critical', 'unknown'] as const).map(severity => ({ label: SEVERITY_LABELS[severity], multiplier: ADVISORY_SEVERITY_MULTIPLIERS[severity] }))
  protected readonly types = [
    { title: 'Features', description: 'New APIs, capabilities and speed.', icon: 'vikingSword', color: 'purple', points: PULL_REQUEST_POINTS.feat },
    { title: 'Fixes', description: 'Bugs found and fixed.', icon: 'vikingAnvil', color: 'red', points: PULL_REQUEST_POINTS.fix },
    { title: 'Docs', description: 'Guides, API docs and examples.', icon: 'vikingScroll', color: 'blue', points: PULL_REQUEST_POINTS.docs },
    { title: 'Chores', description: 'Refactors, tests, builds, CI and releases.', icon: 'vikingBroom', color: 'gold', points: PULL_REQUEST_POINTS.chore },
  ] satisfies readonly { color: GithubColor, [key: string]: unknown }[]
  protected readonly rules = [
    { what: 'Issue', when: 'Every issue or discussion you open.', value: `${ACTIVITY_POINTS.issues}`, unit: 'pt', icon: 'octIssueOpened', color: 'green' },
    { what: 'Helpful issue', when: `On top, when completed or with ${HELPFUL_ISSUE_REACTIONS}+ reactions or ${HELPFUL_ISSUE_COMMENTS}+ comments.`, value: `+${ACTIVITY_POINTS.helpfulIssues}`, unit: 'pts', icon: 'remixLightbulbLine', color: 'gold' },
    { what: 'Comment', when: 'Every comment on an issue, a pull request or a discussion.', value: `${ACTIVITY_POINTS.comments}`, unit: 'pt', icon: 'octComment', color: 'blue' },
    { what: 'Helpful comment', when: `On top, with ${HELPFUL_COMMENT_REACTIONS}+ reactions, or as a discussion's accepted answer.`, value: `+${ACTIVITY_POINTS.helpfulComments}`, unit: 'pts', icon: 'remixChatHeartLine', color: 'pink' },
    { what: 'Review comment', when: 'Every comment on the code of a pull request.', value: `${ACTIVITY_POINTS.reviewComments}`, unit: 'pt', icon: 'remixFileCodeLine', color: 'purple' },
    { what: 'Reaction', when: 'Received on your issues, pull requests, discussions and comments.', value: `${ACTIVITY_POINTS.reactions}`, unit: 'pt', icon: 'octSmiley', color: 'orange' },
    { what: 'Security analysis or remediation', when: 'Analyst or remediation developer on an Angular security advisory.', value: `${ADVISORY_ROLE_POINTS.analyst}`, unit: 'pts', icon: 'octShield', color: 'red' },
    { what: 'Security discovery', when: 'Finder or reporter.', value: `${ADVISORY_ROLE_POINTS.finder}`, unit: 'pts', icon: 'octShield', color: 'red' },
    { what: 'Security review', when: 'Remediation reviewer.', value: `${ADVISORY_ROLE_POINTS.remediation_reviewer}`, unit: 'pts', icon: 'octShield', color: 'red' },
    { what: 'Other security credit', when: 'Coordinator, remediation verifier, tool, sponsor or other. One highest role counts per advisory.', value: `${ADVISORY_ROLE_POINTS.other}`, unit: 'pt', icon: 'octShield', color: 'red' },
    { what: 'Translation', when: 'Leading a community translation of angular.dev.', value: `${ACTIVITY_POINTS.translations}`, unit: 'pts', icon: 'remixTranslate2', color: 'blue' },
    { what: 'Translation contribution', when: 'Five or more translation commits on one, without leading it.', value: `${ACTIVITY_POINTS.translationContributions}`, unit: 'pts', icon: 'remixTranslate2', color: 'blue' },
  ] satisfies readonly { color: GithubColor, [key: string]: unknown }[]
}
