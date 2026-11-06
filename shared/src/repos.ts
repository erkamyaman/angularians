/** The repositories on the board, in the order the site lists them. The collector's default, and the site's links. */
export const REPOS: readonly string[] = [
  'angular/angular', 'angular/components', 'angular/angular-cli', 'angular/dev-infra', 'angular/domino',
  // Archived: their code moved into angular/angular (zone.js, 2019) and angular/angular-cli (Universal's SSR, 2023).
  'angular/zone.js', 'angular/universal',
]

/** `repo:a repo:b …`: a GitHub search across every repository on the board. */
export const reposQuery = (): string => REPOS.map(repo => `repo:${repo}`).join(' ')
