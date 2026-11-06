import type { ContributorProfile } from '@angularians/shared'
import { BADGE_ICONS, earnedBadges } from '../../app/profile/earned-badges'
import { siteImage } from './assets'
import { ANGULAR_LOGO } from './card'

/** The profile's badges as images for the card, in the profile's order; one whose image is missing is left out. */
export async function cardBadgeImages(profile: ContributorProfile): Promise<string[]> {
  const images = await Promise.all(earnedBadges(profile).map(badge =>
    badge.icon === 'angular' ? ANGULAR_LOGO
      : badge.logo ? siteImage(badge.logo)
        : `data:image/svg+xml,${encodeURIComponent(BADGE_ICONS[badge.icon as keyof typeof BADGE_ICONS].replaceAll('currentColor', badge.color ?? '#a3a3a3'))}`,
  ))
  return images.filter((src): src is string => !!src)
}
