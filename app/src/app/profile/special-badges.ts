export type ProjectRole = 'creator' | 'co-creator' | 'maintainer' | 'organizer'

export interface ProjectPerson {
  githubId: number
  username: string
  name: string
  role: ProjectRole
}

export interface ProjectBadge {
  name: string
  badge: string
  href: string
  logo: string
  does: string
  builtOn?: true
  style: string
  people: readonly ProjectPerson[]
}

export const PROJECT_BADGES: readonly ProjectBadge[] = [
  { name: 'AnalogJS', badge: 'Analog alchemist', style: 'bg-[#DD0330]/10 text-[#B80A2C] ring-[#DD0330]/30 dark:text-[#F47088] dark:ring-[#DD0330]/40', builtOn: true, href: 'https://analogjs.org', logo: '/credits/analogjs.svg', does: 'The meta-framework: pages, server rendering, the API', people: [
    { githubId: 42211, username: 'brandonroberts', name: 'Brandon Roberts', role: 'creator' },
  ] },
  { name: 'spartan/ui', badge: 'Spartan king', style: 'bg-foreground/5 text-foreground ring-foreground/25', builtOn: true, href: 'https://spartan.ng', logo: '/credits/spartan.svg', does: 'The UI components', people: [
    { githubId: 35136007, username: 'goetzrobin', name: 'Robin Goetz', role: 'creator' },
  ] },
  { name: 'ng-icons', badge: 'Icon smith', style: 'bg-[#E53935]/10 text-[#C62828] ring-[#E53935]/30 dark:text-[#FF8A80] dark:ring-[#E53935]/40', builtOn: true, href: 'https://ng-icons.github.io/ng-icons', logo: '/credits/ng-icons.svg', does: 'The icons', people: [
    { githubId: 20795331, username: 'ashley-hunter', name: 'Ashley Hunter', role: 'creator' },
  ] },
  { name: 'ngxtension', badge: 'Utility wizard', style: 'bg-[#F20755]/10 text-[#C2185B] ring-[#F20755]/30 dark:text-[#FF5BE1] dark:ring-[#F20755]/40', builtOn: true, href: 'https://ngxtension.dev', logo: '/credits/ngxtension.svg', does: 'Signal utilities', people: [
    { githubId: 25516557, username: 'nartc', name: 'Chau Tran', role: 'creator' },
    { githubId: 25394362, username: 'eneajaho', name: 'Enea Jahollari', role: 'creator' },
  ] },
  { name: 'Angularians', badge: 'Creator', style: 'bg-primary/10 text-primary ring-primary/30', href: 'https://angularians.dev', logo: '/logo.svg', does: 'Everyone who has contributed to Angular, ranked', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'creator' },
  ] },
  { name: 'Pangular Inspector', badge: 'Chief inspector', style: 'bg-[#D97706]/10 text-[#B45309] ring-[#D97706]/30 dark:text-[#FBBF24] dark:ring-[#D97706]/40', href: 'https://pangular-inspector.dev', logo: '/credits/pangular.svg', does: 'Angular DevTools: components, signals, DI and routes', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'co-creator' },
    { githubId: 11923975, username: 'santoshyadavdev', name: 'Santosh Yadav', role: 'co-creator' },
  ] },
  { name: 'Angular Docs TR', badge: 'Docs TR scribe', style: 'bg-[#E30A17]/10 text-[#C4161C] ring-[#E30A17]/30 dark:text-[#FF7B72] dark:ring-[#E30A17]/40', href: 'https://angular-docs.tr', logo: '/credits/angular-docs-tr.svg', does: 'angular.dev in Turkish', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'maintainer' },
  ] },
  { name: 'slide.ng', badge: 'Slide master', style: 'bg-[#CC4209]/10 text-[#A33A08] ring-[#CC4209]/30 dark:text-[#F0883E] dark:ring-[#CC4209]/40', href: 'https://slide-ng.dev', logo: '/credits/slide-ng.svg', does: 'Slides in markdown, compiled with Angular', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'creator' },
  ] },
  { name: 'Angular Native', badge: 'Native navigator', style: 'bg-[#F0224F]/10 text-[#C4002D] ring-[#F0224F]/30 dark:text-[#FF6B88] dark:ring-[#F0224F]/40', href: 'https://ng-native.com', logo: '/credits/ng-native.svg', does: 'Angular apps as real native iOS and Android views', people: [
    { githubId: 20795331, username: 'ashley-hunter', name: 'Ashley Hunter', role: 'creator' },
  ] },
  { name: 'Angular Primitives', badge: 'Headless hero', style: 'bg-[#E90364]/10 text-[#B8024F] ring-[#E90364]/30 dark:text-[#FF5C9A] dark:ring-[#E90364]/40', href: 'https://angularprimitives.com', logo: '/credits/ng-primitives.svg', does: 'Headless, accessible UI primitives', people: [
    { githubId: 20795331, username: 'ashley-hunter', name: 'Ashley Hunter', role: 'creator' },
  ] },
  { name: 'ngx-builders', badge: 'Builder baron', style: 'bg-[#455A64]/10 text-[#37474F] ring-[#455A64]/30 dark:text-[#B0BEC5] dark:ring-[#90A4AE]/40', href: 'https://github.com/ngx-builders', logo: '/credits/ngx-builders.png', does: 'Angular CLI builders: Netlify deploys, bundle analysis', people: [
    { githubId: 11923975, username: 'santoshyadavdev', name: 'Santosh Yadav', role: 'creator' },
  ] },
]

export const BUILT_ON = PROJECT_BADGES.filter(project => project.builtOn)

export const projectBadgesOf = (githubId: number) =>
  PROJECT_BADGES.flatMap(project => project.people.filter(person => person.githubId === githubId).map(person => ({ project, role: person.role })))
