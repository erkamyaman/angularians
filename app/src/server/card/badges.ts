import type { ContributorProfile } from '@angularians/shared'
import { cardBadgeLabel, shownBadges, type BadgeOptions } from '../../app/profile/card-badges'
import { BADGE_ICONS, earnedBadges } from '../../app/profile/earned-badges'
import { siteImage } from './assets'
import { ANGULAR_LOGO } from './card'
import { fitTags, TAG_ROW_WIDTH, TAG_ROWS, type CardTag } from './card-tags'
import { drawableLabel } from './tag-fonts'
import { tagColors } from './tag-colors'

/** The badge icons' colours on the card, which has no theme: the dark theme's. */
const COLORS: Record<keyof typeof BADGE_ICONS, string> = {
  octShield: '#FF7B72',
  remixStarFill: '#E3B341',
  simpleNx: '#96D7E8',
  vikingAnvil: '#D29922',
  vikingHelmet: '#D29922',
  vikingShield: '#3FB950',
  vikingAxes: '#A371F7',
}

const isIcon = (icon: string): icon is keyof typeof BADGE_ICONS => icon in BADGE_ICONS

/** The profile's badges as tags for the card, in the profile's order; one whose image is missing is left out. */
export async function cardBadgeTags(profile: ContributorProfile, { hidden, names }: BadgeOptions): Promise<CardTag[]> {
  const iconsOnly = names === 'none'
  const candidates = await Promise.all(shownBadges(earnedBadges(profile), hidden).map(async (badge) => {
    const { icon, logo, tone } = badge
    const src = icon === 'angular' ? ANGULAR_LOGO
      : isIcon(icon) ? `data:image/svg+xml,${encodeURIComponent(BADGE_ICONS[icon].replaceAll('currentColor', COLORS[icon]))}`
        : logo ? await siteImage(logo) : null
    return src ? { src, label: drawableLabel(cardBadgeLabel(badge, names)), colors: tagColors(tone) } : null
  }))
  return fitTags(candidates.filter(badge => badge !== null), iconsOnly ? 1 : TAG_ROWS, TAG_ROW_WIDTH, iconsOnly)
}
