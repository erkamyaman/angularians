import type { ContributorProfile } from '@angularians/shared'
import { remixStarFill } from '@ng-icons/remixicon'
import { formatNumber, plural } from '../leaderboard/format'
import { vikingAnvil, vikingAxes, vikingHelmet, vikingShield } from '../layout/viking-icons'
import { ANGULAR_GDES, GITHUB_STARS } from './recognitions'
import { projectBadgesOf, type ProjectBadge, type ProjectRole } from './special-badges'

/** The icons a badge can show, as SVG: the page names them, the card draws them. */
export const BADGE_ICONS = { remixStarFill, vikingAnvil, vikingAxes, vikingHelmet, vikingShield }

/**
 * A badge on a profile and on its card. `icon`: `angular`, `gde` or `logo` (`logo` is its image), or a key of
 * `BADGE_ICONS`. `style`: the page's classes.
 */
export interface EarnedBadge {
  label: string
  title: string
  icon: 'angular' | 'gde' | 'logo' | keyof typeof BADGE_ICONS
  style: string
  logo?: string
  href?: string
  emblem?: string
}

const GOLD = 'bg-[#9A6700]/10 text-[#7D4E00] ring-[#9A6700]/30 dark:bg-[#D29922]/10 dark:text-[#D29922] dark:ring-[#D29922]/30'
const GREEN = 'bg-[#1A7F37]/10 text-[#116329] ring-[#1A7F37]/30 dark:bg-[#3FB950]/10 dark:text-[#3FB950] dark:ring-[#3FB950]/30'
const PURPLE = 'bg-[#8250DF]/10 text-[#8250DF] ring-[#8250DF]/30 dark:bg-[#A371F7]/10 dark:text-[#A371F7] dark:ring-[#A371F7]/30'

/** Years as ranges: [2019, 2024, 2025, 2026] → "2019, 2024–2026". */
export function yearRanges(years: readonly number[]): string {
  const parts: string[] = []
  for (let i = 0; i < years.length; i++) {
    let j = i
    while (j + 1 < years.length && years[j + 1] === years[j]! + 1) j++
    parts.push(j > i ? `${years[i]}–${years[j]}` : `${years[i]}`)
    i = j
  }
  return parts.join(', ')
}

/** A project's badge for one of its people: its title, logo and colour, linked to the project. */
export function projectBadge(project: ProjectBadge, role: ProjectRole): EarnedBadge {
  return { label: project.badge, title: `${role[0]!.toUpperCase()}${role.slice(1)} of ${project.name}: ${project.does}`, icon: 'logo', logo: project.logo, href: project.href, emblem: project.emblem, style: project.style }
}

/** Every badge a contributor has, in the order the profile and the card show them. */
export function earnedBadges(person: ContributorProfile): EarnedBadge[] {
  const badges: EarnedBadge[] = []
  if (person.team) badges.push({ label: 'Angular team', title: 'Public member of the Angular organization on GitHub', icon: 'angular', style: 'bg-[#dc087d]/10 text-foreground ring-[#dc087d]/40' })
  if (ANGULAR_GDES.has(person.githubId)) badges.push({ label: 'Angular GDE', title: 'Google Developer Expert for Angular', icon: 'gde', logo: '/credits/gde.svg', style: 'bg-[#1A73E8]/10 text-[#185ABC] ring-[#1A73E8]/30 dark:bg-[#8AB4F8]/10 dark:text-[#8AB4F8] dark:ring-[#8AB4F8]/30' })
  if (GITHUB_STARS.has(person.githubId)) badges.push({ label: 'GitHub Star', title: 'GitHub Star, recognised by GitHub for helping the community', icon: 'remixStarFill', style: 'bg-[#BF8700]/10 text-[#845A00] ring-[#BF8700]/30 dark:bg-[#E3B341]/10 dark:text-[#E3B341] dark:ring-[#E3B341]/30' })
  const projects = projectBadgesOf(person.githubId)
  for (const { project, role } of projects) badges.push(projectBadge(project, role))
  const forged = projects.filter(({ project, role }) => project.builtOn && (role === 'creator' || role === 'co-creator')).map(({ project }) => project.name)
  if (forged.length) badges.push({ label: 'Smith of ng-halla', title: `Forged a tool Angularians is built on: ${forged.join(', ')}`, icon: 'vikingAnvil', style: 'bg-primary/10 text-primary ring-primary/30' })
  const firsts = person.periods.filter(row => /^\d{4}$/.test(row.period) && row.rank === 1).map(row => Number(row.period)).sort((x, y) => x - y)
  if (firsts.length) badges.push({ label: `#1 in ${yearRanges(firsts)}`, title: `The top Angularian of ${plural(firsts.length, 'year', 'years')}`, icon: 'vikingHelmet', style: GOLD })
  if (person.rank <= 10) badges.push({ label: 'Top 10 all time', title: `#${formatNumber(person.rank)} of all time`, icon: 'vikingShield', style: GREEN })
  if (person.reviewComments >= 100) badges.push({ label: 'Reviewer', title: `${formatNumber(person.reviewComments)} review comments on code`, icon: 'vikingAxes', style: PURPLE })
  return badges
}
