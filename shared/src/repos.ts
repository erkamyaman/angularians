/** The repositories on the board, in the order the site lists them. The collector's default, and the site's links. */
export const REPOS: readonly string[] = ['angular/angular', 'angular/components', 'angular/angular-cli', 'angular/dev-infra', 'angular/domino']

/** `repo:a repo:b …`: a GitHub search across every repository on the board. */
export const reposQuery = (): string => REPOS.map(repo => `repo:${repo}`).join(' ')
