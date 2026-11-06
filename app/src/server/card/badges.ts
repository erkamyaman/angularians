import type { ContributorProfile } from '@angularians/shared'
import { BADGE_ICONS, earnedBadges } from '../../app/profile/earned-badges'
import { siteImage } from './assets'
import { ANGULAR_LOGO } from './card'

/** The badge icons' colours on the card, which has no theme: the dark theme's. */
const COLORS: Record<keyof typeof BADGE_ICONS, string> = {
  remixStarFill: '#E3B341',
  vikingAnvil: '#D29922',
  vikingHelmet: '#D29922',
  vikingShield: '#3FB950',
  vikingAxes: '#A371F7',
}

/** The card shows this many badges at most, so the row stays clear of the footer's left corner. */
const MAX_BADGES = 10

const isIcon = (icon: string): icon is keyof typeof BADGE_ICONS => icon in BADGE_ICONS

/** The profile's badges as images for the card, in the profile's order; one whose image is missing is left out. */
export async function cardBadgeImages(profile: ContributorProfile): Promise<string[]> {
  const images = await Promise.all(earnedBadges(profile).slice(0, MAX_BADGES).map(({ icon, logo }) =>
    icon === 'angular' ? ANGULAR_LOGO
      : isIcon(icon) ? `data:image/svg+xml,${encodeURIComponent(BADGE_ICONS[icon].replaceAll('currentColor', COLORS[icon]))}`
        : logo ? siteImage(logo) : null,
  ))
  return images.filter((src): src is string => !!src)
}
