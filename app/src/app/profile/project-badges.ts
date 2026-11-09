import type { BadgeTone } from './badge-pill'

export type ProjectRole = 'creator' | 'co-creator' | 'founder' | 'co-founder' | 'maintainer' | 'organizer' | 'lead organizer'

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
  badgeIsOfficial?: true
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
  { name: 'Angularians', badgeIsOfficial: true, badge: 'Creator', tone: 'primary', href: 'https://angularians.dev', logo: '/logo.svg', does: 'Everyone who has contributed to Angular, ranked', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'creator' },
  ] },
  { name: 'Pangular Inspector', badge: 'Chief inspector', tone: 'pangular', href: 'https://pangular-inspector.dev', logo: '/credits/pangular.svg', does: 'Angular DevTools: components, signals, DI and routes', people: [
    { githubId: 88717125, username: 'erkamyaman', name: 'Erkam Yaman', role: 'co-creator' },
    { githubId: 11923975, username: 'santoshyadavdev', name: 'Santosh Yadav', role: 'co-creator' },
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
  { name: 'NG Baguette', badgeIsOfficial: true, badge: 'NG Baguette organizer', tone: 'ng-baguette', href: 'https://ngbaguette.angulardevs.fr', logo: '/credits/ng-baguette.png', does: 'The French Angular conference', people: [
    { githubId: 32737308, username: 'geromegrignon', name: 'Gérôme Grignon', role: 'organizer' },
  ] },
  { name: 'Angular Devs France', badgeIsOfficial: true, badge: 'Angular Devs France co-founder', tone: 'angular-devs-france', href: 'https://angulardevs.fr', logo: '/credits/angular-devs-france.png', does: 'The French-speaking Angular community', people: [
    { githubId: 32737308, username: 'geromegrignon', name: 'Gérôme Grignon', role: 'co-founder' },
  ] },
  { name: 'OpenNG', badge: 'OpenNG sorcerer', tone: 'openng', href: 'https://www.openng.org', logo: '/credits/openng.png', does: 'Keeps abandoned Angular libraries maintained', people: [
    { githubId: 32737308, username: 'geromegrignon', name: 'Gérôme Grignon', role: 'maintainer' },
  ] },
  { name: 'NG Poland', badgeIsOfficial: true, badge: 'NG Poland organizer', tone: 'ng-poland', href: 'https://ng-poland.pl', logo: '/credits/ng-poland.png', does: 'The Angular conference in Poland', people: [
    { githubId: 6573939, username: 'kalbarczyk', name: 'Dariusz Kalbarczyk', role: 'organizer' },
  ] },
  { name: 'NG Asia', badgeIsOfficial: true, badge: 'NG Asia founder', tone: 'ng-asia', href: 'https://ng-asia.org', logo: '/credits/ng-asia.png', does: 'The Angular conference and community across Asia', people: [
    { githubId: 30035451, username: 'Ilyoskhuja', name: 'Ilyoskhuja Ikromkhujaev', role: 'founder' },
  ] },
  { name: 'NG Tunisia', badgeIsOfficial: true, badge: 'NG Tunisia lead organizer', tone: 'ng-tunisia', href: 'https://ng-tunisia.org', logo: '/credits/ng-tunisia.png', does: 'The Angular community of Tunisia', people: [
    { githubId: 192744266, username: 'azizaydi23', name: 'Mohamed Aziz Aydi', role: 'lead organizer' },
  ] },
  { name: 'Angular Space', badgeIsOfficial: true, badge: 'Angular Space founder', tone: 'angular-space', href: 'https://www.angularspace.com', logo: '/credits/angular-space.png', does: 'Articles and podcasts for Angular developers', people: [
    { githubId: 69144223, username: 'danielglejzner', name: 'Daniel Glejzner', role: 'founder' },
  ] },
  { name: 'Angular Wrocław', badgeIsOfficial: true, badge: 'Angular Wrocław organizer', tone: 'angular-wroclaw', href: 'https://www.meetup.com/angularwroclaw/', logo: '/credits/angular-wroclaw.png', does: 'The Angular meetup in Wrocław', people: [
    { githubId: 69144223, username: 'danielglejzner', name: 'Daniel Glejzner', role: 'organizer' },
  ] },
]

export const BUILT_ON = PROJECT_BADGES.filter(project => project.builtOn)

export const projectBadgesOf = (githubId: number) =>
  PROJECT_BADGES.flatMap(project => project.people.filter(person => person.githubId === githubId).map(person => ({ project, role: person.role })))
