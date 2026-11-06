import type { ContributorProfile } from '@angularians/shared'
import { remixStarFill } from '@ng-icons/remixicon'
import { vikingAnvil, vikingAxes, vikingHelmet, vikingShield } from '../../app/layout/viking-icons'
import { ANGULAR_GDES, GITHUB_STARS } from '../../app/profile/recognitions'
import { projectBadgesOf } from '../../app/profile/special-badges'

export type CardBadge = { svg: string, color: string } | { path: string } | { angular: true }

export function cardBadges(profile: ContributorProfile): CardBadge[] {
  const badges: CardBadge[] = []
  if (profile.team) badges.push({ angular: true })
  if (ANGULAR_GDES.has(profile.githubId)) badges.push({ path: '/credits/gde.svg' })
  if (GITHUB_STARS.has(profile.githubId)) badges.push({ svg: remixStarFill, color: '#E3B341' })
  const projects = projectBadgesOf(profile.githubId)
  for (const { project } of projects) badges.push({ path: project.logo })
  if (projects.some(({ project }) => project.builtOn)) badges.push({ svg: vikingAnvil, color: '#D29922' })
  if (profile.periods.some(row => /^\d{4}$/.test(row.period) && row.rank === 1)) badges.push({ svg: vikingHelmet, color: '#D29922' })
  if (profile.rank <= 10) badges.push({ svg: vikingShield, color: '#3FB950' })
  if (profile.reviewComments >= 100) badges.push({ svg: vikingAxes, color: '#A371F7' })
  return badges
}
