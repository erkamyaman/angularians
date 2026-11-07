import type { BadgeTone } from './badge-pill'

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
  /** Its colours: a `tone-*` class of `badge-pill.css`. */
  tone: BadgeTone
  people: readonly ProjectPerson[]
}

export const PROJECT_BADGES: readonly ProjectBadge[] = [
  { name: 'AnalogJS', badge: 'Analog alchemist', tone: 'analog', builtOn: true, href: 'https://analogjs.org', logo: '/credits/analogjs.svg', does: 'The meta-framework: pages, server rendering, the API', people: [
    { githubId: 42211, username: 'brandonroberts', name: 'Brandon Roberts', role: 'creator' },
  ] },
  { name: 'spartan/ui', badge: 'Spartan king', tone: 'foreground', builtOn: true, href: 'https://spartan.ng', logo: '/credits/spartan.svg', does: 'The UI components', people: [
    { githubId: 35136007, username: 'goetzrobin', name: 'Robin Goetz', role: 'creator' },
  ] },
  { name: 'ng-icons', badge: 'Icon smith', tone: 'ng-icons', builtOn: true, href: 'https://ng-icons.github.io/ng-icons', logo: '/credits/ng-icons.svg', does: 'The icons', people: [
    { githubId: 20795331, username: 'ashley-hunter', name: 'Ashley Hunter', role: 'creator' },
  ] },
  { name: 'ngxtension', badge: 'Utility wizard', tone: 'ngxtension', builtOn: true, href: 'https://ngxtension.dev', logo: '/credits/ngxtension.svg', does: 'Signal utilities', people: [
    { githubId: 25516557, username: 'nartc', name: 'Chau Tran', role: 'creator' },
    { githubId: 25394362, username: 'eneajaho', name: 'Enea Jahollari', role: 'creator' },
  ] },
  { name: 'Angularians', badge: 'Creator', tone: 'primary', href: 'https://angularians.dev', logo: '/logo.svg', does: 'Everyone who has contributed to Angular, ranked', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'creator' },
  ] },
  { name: 'Pangular Inspector', badge: 'Chief inspector', tone: 'pangular', href: 'https://pangular-inspector.dev', logo: '/credits/pangular.svg', does: 'Angular DevTools: components, signals, DI and routes', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'co-creator' },
    { githubId: 11923975, username: 'santoshyadavdev', name: 'Santosh Yadav', role: 'co-creator' },
  ] },
  { name: 'Angular Docs TR', badge: 'Docs TR scribe', tone: 'docs-tr', href: 'https://angular-docs.tr', logo: '/credits/angular-docs-tr.svg', does: 'angular.dev in Turkish', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'maintainer' },
  ] },
  { name: 'slide.ng', badge: 'Slide master', tone: 'slide-ng', href: 'https://slide-ng.dev', logo: '/credits/slide-ng.svg', does: 'Slides in markdown, compiled with Angular', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'creator' },
  ] },
  { name: 'Angular Native', badge: 'Native navigator', tone: 'ng-native', href: 'https://ng-native.com', logo: '/credits/ng-native.svg', does: 'Angular apps as real native iOS and Android views', people: [
    { githubId: 20795331, username: 'ashley-hunter', name: 'Ashley Hunter', role: 'creator' },
  ] },
  { name: 'Angular Primitives', badge: 'Headless hero', tone: 'ng-primitives', href: 'https://angularprimitives.com', logo: '/credits/ng-primitives.svg', does: 'Headless, accessible UI primitives', people: [
    { githubId: 20795331, username: 'ashley-hunter', name: 'Ashley Hunter', role: 'creator' },
  ] },
  { name: 'ngx-builders', badge: 'Builder baron', tone: 'ngx-builders', href: 'https://github.com/ngx-builders', logo: '/credits/ngx-builders.png', does: 'Angular CLI builders: Netlify deploys, bundle analysis', people: [
    { githubId: 11923975, username: 'santoshyadavdev', name: 'Santosh Yadav', role: 'creator' },
  ] },
]

export const BUILT_ON = PROJECT_BADGES.filter(project => project.builtOn)

export const projectBadgesOf = (githubId: number) =>
  PROJECT_BADGES.flatMap(project => project.people.filter(person => person.githubId === githubId).map(person => ({ project, role: person.role })))
