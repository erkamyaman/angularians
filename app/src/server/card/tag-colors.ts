import type { BadgeTone } from '../../app/profile/badge-pill'

export interface TagColors {
  pill: string
  text: string
}

const NEUTRAL: TagColors = { pill: '#A3A3A3', text: '#E5E5E5' }

const same = (color: string): TagColors => ({ pill: color, text: color })

export const TAG_COLORS: Record<BadgeTone, TagColors> = {
  'team': { pill: '#DC087D', text: '#FAFAFA' },
  'gde': same('#8AB4F8'),
  'star': same('#E3B341'),
  'nx': same('#96D7E8'),
  'shieldwall': same('#FF7B72'),
  'primary': same('#D29922'),
  'gold': same('#D29922'),
  'green': same('#3FB950'),
  'purple': same('#A371F7'),
  'foreground': same('#FAFAFA'),
  'analog': { pill: '#DD0330', text: '#F47088' },
  'ng-icons': { pill: '#E53935', text: '#FF8A80' },
  'ngxtension': { pill: '#F20755', text: '#FF5BE1' },
  'pangular': { pill: '#D97706', text: '#FBBF24' },
  'slide-ng': { pill: '#CC4209', text: '#F0883E' },
  'ng-native': { pill: '#F0224F', text: '#FF6B88' },
  'ng-primitives': { pill: '#E90364', text: '#FF5C9A' },
  'ngx-builders': { pill: '#90A4AE', text: '#B0BEC5' },
  'ng-baguette': { pill: '#D6336C', text: '#FF7BA5' },
  'angular-devs-france': { pill: '#1E4FB0', text: '#7FA6F5' },
  'openng': { pill: '#D6249F', text: '#FF6FD0' },
  'ng-poland': { pill: '#DC143C', text: '#F2627D' },
  'ng-asia': { pill: '#8B2FE0', text: '#C58BFF' },
  'ng-tunisia': { pill: '#E70013', text: '#F2555F' },
  'angular-space': { pill: '#6D3BBF', text: '#B79CF0' },
  'angular-wroclaw': { pill: '#C2258E', text: '#FF77C8' },
  'lang-az': same('#00B5E2'),
  'lang-es': { pill: '#C60B1E', text: '#D64F5D' },
  'lang-uz': same('#0099B5'),
  'lang-tr': { pill: '#E30A17', text: '#E93B45' },
  'lang-ru': { pill: '#0039A6', text: '#577CC4' },
  'lang-ko': { pill: '#CD2E3A', text: '#D6525B' },
  'lang-ja': { pill: '#BC002D', text: '#D14F6E' },
  'lang-zh-cn': { pill: '#DE2910', text: '#E34731' },
  'lang-zh-tw': { pill: '#000095', text: '#7373C5' },
  'lang-fr': { pill: '#0055A4', text: '#4281BC' },
}

export const tagColors = (tone: BadgeTone): TagColors => TAG_COLORS[tone] ?? NEUTRAL
