export type ProjectRole = 'creator' | 'maintainer' | 'organizer'

export interface ProjectPerson {
  githubId: number
  username: string
  name: string
  role: ProjectRole
}

export interface ProjectBadge {
  name: string
  badge?: string
  href: string
  logo: string
  does: string
  people: readonly ProjectPerson[]
}

export const PROJECT_BADGES: readonly ProjectBadge[] = [
  { name: 'AnalogJS', href: 'https://analogjs.org', logo: '/credits/analogjs.svg', does: 'The meta-framework: pages, server rendering, the API', people: [
    { githubId: 42211, username: 'brandonroberts', name: 'Brandon Roberts', role: 'creator' },
  ] },
  { name: 'spartan/ui', badge: 'spartan-ng', href: 'https://spartan.ng', logo: '/credits/spartan.svg', does: 'The UI components', people: [
    { githubId: 35136007, username: 'goetzrobin', name: 'Robin Goetz', role: 'creator' },
  ] },
  { name: 'ng-icons', href: 'https://ng-icons.github.io/ng-icons', logo: '/credits/ng-icons.svg', does: 'The icons', people: [
    { githubId: 20795331, username: 'ashley-hunter', name: 'Ashley Hunter', role: 'creator' },
  ] },
  { name: 'ngxtension', href: 'https://ngxtension.dev', logo: '/credits/ngxtension.svg', does: 'Signal utilities', people: [
    { githubId: 25516557, username: 'nartc', name: 'Chau Tran', role: 'creator' },
    { githubId: 25394362, username: 'eneajaho', name: 'Enea Jahollari', role: 'creator' },
  ] },
]

export const projectBadgesOf = (githubId: number) =>
  PROJECT_BADGES.flatMap(project => project.people.filter(person => person.githubId === githubId).map(person => ({ project, role: person.role })))
