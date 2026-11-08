import { isYear, translationsOf, type ContributorProfile } from '@angularians/shared'
import { remixStarFill } from '@ng-icons/remixicon'
import { simpleNx } from '@ng-icons/simple-icons'
import { octShield } from '@ng-icons/octicons'
import { formatNumber, formatRank } from '../text/number-format'
import { plural } from '../text/plural'
import { vikingAnvil, vikingAxes, vikingHelmet, vikingShield } from '../layout/viking-icons'
import { flagUrl } from '../contributors/flag-url'
import { yearRanges } from './year-ranges'
import { ANGULAR_GDES, ANGULARJS_SECURITY, GITHUB_STARS, NX_CHAMPIONS } from './recognitions'
import type { BadgeTone } from './badge-pill'
import { projectBadgesOf, type ProjectBadge, type ProjectRole } from './project-badges'

/** The icons a badge can show, as SVG: the page names them, the card draws them. */
export const BADGE_ICONS = { octShield, remixStarFill, simpleNx, vikingAnvil, vikingAxes, vikingHelmet, vikingShield }

/**
 * A badge on a profile and on its card. `icon`: `angular`, `gde` or `logo` (`logo` is its image), or a key of
 * `BADGE_ICONS`. `tone`: its colours, a `tone-*` class of `badge-pill.css`.
 */
export interface EarnedBadge {
  label: string
  title: string
  icon: 'angular' | 'gde' | 'logo' | keyof typeof BADGE_ICONS
  tone: BadgeTone
  logo?: string
  href?: string
}

/** A project's badge for one of its people: its title, logo and colour, linked to the project. */
export function projectBadge(project: ProjectBadge, role: ProjectRole): EarnedBadge {
  return { label: project.badge, title: `${role[0]!.toUpperCase()}${role.slice(1)} of ${project.name}`, icon: 'logo', logo: project.logo, href: project.href, tone: project.tone }
}

/** Every badge a contributor has, in the order the profile and the card show them. */
export function earnedBadges(person: ContributorProfile): EarnedBadge[] {
  const badges: EarnedBadge[] = []
  if (person.team) badges.push({ label: 'Angular team', title: 'Member of the Angular org on GitHub', icon: 'angular', tone: 'team' })
  const gde = ANGULAR_GDES.get(person.githubId)
  if (gde !== undefined) badges.push({ label: 'Angular GDE', title: 'Google Developer Expert for Angular', href: gde ? `https://me.developers.google.com/u/${gde}` : undefined, icon: 'gde', logo: '/credits/gde.svg', tone: 'gde' })
  if (GITHUB_STARS.has(person.githubId)) badges.push({ label: 'GitHub Star', title: '', href: `https://stars.github.com/profiles/${person.username}`, icon: 'remixStarFill', tone: 'star' })
  if (NX_CHAMPIONS.has(person.githubId)) badges.push({ label: 'Nx Champion', title: '', href: 'https://nx.dev/community', icon: 'simpleNx', tone: 'nx' })
  const advisories = person.advisories + (ANGULARJS_SECURITY.get(person.githubId) ?? 0)
  if (advisories) badges.push({ label: 'Shieldwall', title: `Credited on ${plural(advisories, 'Angular security advisory', 'Angular security advisories')}`, href: `https://github.com/advisories?query=credit%3A${person.username}`, icon: 'octShield', tone: 'shieldwall' })
  for (const { language, code, flag, site, translators } of translationsOf(person.githubId)) {
    const helper = translators.some(translator => translator.githubId === person.githubId && translator.helper)
    badges.push({ label: `${language} ${helper ? 'contributor' : 'translator'}`, title: helper ? `Contributed to the ${language} translation of angular.dev` : `Translated angular.dev into ${language}`, href: site, icon: 'logo', logo: flagUrl(flag), tone: `lang-${code}` })
  }
  const projects = projectBadgesOf(person.githubId)
  for (const { project, role } of projects) badges.push(projectBadge(project, role))
  const forged = projects.filter(({ project, role }) => project.builtOn && (role === 'creator' || role === 'co-creator')).map(({ project }) => project.name)
  if (forged.length) badges.push({ label: 'Smith of ng-halla', title: `Forged ${forged.join(' and ')}`, icon: 'vikingAnvil', tone: 'primary' })
  const firsts = person.periods.filter(row => isYear(row.period) && row.rank === 1).map(row => Number(row.period)).sort((x, y) => x - y)
  if (firsts.length) badges.push({ label: `#1 in ${yearRanges(firsts)}`, title: `The top Angularian of ${plural(firsts.length, 'year', 'years')}`, icon: 'vikingHelmet', tone: 'gold' })
  if (person.rank <= 10) badges.push({ label: 'Top 10 all time', title: `${formatRank(person.rank)} of all time`, icon: 'vikingShield', tone: 'green' })
  if (person.reviewComments >= 100) badges.push({ label: 'Reviewer', title: `${formatNumber(person.reviewComments)} review comments on code`, icon: 'vikingAxes', tone: 'purple' })
  return badges
}
