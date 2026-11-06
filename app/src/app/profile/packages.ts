import { canonicalPackage, packageRepo } from '@angularians/shared';
import { remixAccessibilityLine, remixApps2Line, remixArrowUpCircleLine, remixAtomLine, remixBox1Line, remixBox3Line, remixBrainLine, remixBroadcastLine, remixBugLine, remixCalendarLine, remixChatCheckLine, remixCodeLine, remixCpuLine, remixDashboardLine, remixFlaskLine, remixFlowChart, remixGlobalLine, remixHammerLine, remixInputField, remixMagicLine, remixMapLine, remixPaletteLine, remixPlantLine, remixPlayLine, remixPuzzleLine, remixRouteLine, remixServerLine, remixSettings3Line, remixSparklingLine, remixStackLine, remixTerminalBoxLine, remixTimerLine, remixTranslate2, remixWindowLine } from '@ng-icons/remixicon';
import { vikingScroll } from '../layout/viking-icons';


/**
 * What a package of `packages.json` is, under its name:
 * - a PR scope of angular/angular (`router`): its npm package (`@angular/router`), or the repository for scopes
 *   that are not a published package (bazel…);
 * - a package of the other repositories, an npm name already (`@angular/material`, `@angular/build`): its repository.
 */
const PACKAGES: Record<string, string> = {
  'animations': '@angular/animations',
  'common': '@angular/common',
  'http': '@angular/common/http',
  'compiler': '@angular/compiler',
  'compiler-cli': '@angular/compiler-cli',
  'core': '@angular/core',
  'elements': '@angular/elements',
  'forms': '@angular/forms',
  'language-service': '@angular/language-service',
  'localize': '@angular/localize',
  'platform-browser': '@angular/platform-browser',
  'platform-browser-dynamic': '@angular/platform-browser-dynamic',
  'platform-server': '@angular/platform-server',
  'router': '@angular/router',
  'service-worker': '@angular/service-worker',
  'upgrade': '@angular/upgrade',
  'zone.js': 'zone.js',
  'benchpress': '@angular/benchpress',
  'devtools': 'Angular DevTools',
  'docs': 'angular.dev',
  'docs-infra': 'angular.dev',
  'skills': 'Angular agent skills',
  'migrations': '@angular/core schematics',
}

export function packageLabel(name: string): string {
  return packageRepo(name) === 'angular/angular' ? PACKAGES[name] ?? 'angular/angular' : packageRepo(name)
}

/**
 * An icon for what a package does (Remix Icon names, all in `PACKAGE_ICONS` for `provideIcons`). A package without its own falls back to its repository's.
 */
const ICONS: Record<string, string> = {
  // angular/angular
  'core': 'remixAtomLine',
  'common': 'remixBox1Line',
  'http': 'remixGlobalLine',
  'compiler': 'remixCpuLine',
  'compiler-cli': 'remixTerminalBoxLine',
  'ivy': 'remixPlantLine',
  'router': 'remixRouteLine',
  'forms': 'remixInputField',
  'animations': 'remixSparklingLine',
  'elements': 'remixPuzzleLine',
  'localize': 'remixTranslate2',
  'platform-browser': 'remixWindowLine',
  'platform-browser-dynamic': 'remixWindowLine',
  'platform-server': 'remixServerLine',
  'service-worker': 'remixBroadcastLine',
  'upgrade': 'remixArrowUpCircleLine',
  'zone.js': 'remixTimerLine',
  'language-service': 'remixChatCheckLine',
  'language-server': 'remixChatCheckLine',
  'vscode-extension': 'remixCodeLine',
  'devtools': 'remixBugLine',
  'docs': 'vikingScroll',
  'docs-infra': 'vikingScroll',
  'shared-docs': 'vikingScroll',
  'skills': 'remixBrainLine',
  'migrations': 'remixMagicLine',
  'schematics': 'remixMagicLine',
  'benchpress': 'remixDashboardLine',
  'benchmarks': 'remixDashboardLine',
  'bazel': 'remixSettings3Line',
  'dev-infra': 'remixSettings3Line',
  // angular/components
  '@angular/material': 'remixPaletteLine',
  '@angular/cdk': 'remixStackLine',
  '@angular/aria': 'remixAccessibilityLine',
  '@angular/material-experimental': 'remixFlaskLine',
  '@angular/cdk-experimental': 'remixFlaskLine',
  '@angular/google-maps': 'remixMapLine',
  '@angular/youtube-player': 'remixPlayLine',
  '@angular/material-luxon-adapter': 'remixCalendarLine',
  '@angular/material-moment-adapter': 'remixCalendarLine',
  '@angular/material-date-fns-adapter': 'remixCalendarLine',
  // angular/angular-cli
  '@angular/cli': 'remixTerminalBoxLine',
  '@angular/build': 'remixHammerLine',
  '@angular-devkit/build-angular': 'remixHammerLine',
  '@angular/ssr': 'remixServerLine',
  '@schematics/angular': 'remixMagicLine',
  '@angular-devkit/schematics': 'remixMagicLine',
  '@angular-devkit/schematics-cli': 'remixMagicLine',
  '@angular-devkit/architect': 'remixFlowChart',
  '@angular-devkit/core': 'remixSettings3Line',
  '@ngtools/webpack': 'remixApps2Line',
}

/** The icon of each repository, for its packages without one of their own. */
const REPO_ICONS: Record<string, string> = {
  'angular/angular': 'remixBox3Line',
  'angular/components': 'remixPuzzleLine',
  'angular/angular-cli': 'remixTerminalBoxLine',
  'angular/domino': 'remixServerLine',
  'angular/universal': 'remixServerLine',
}

export function packageIcon(name: string): string {
  return ICONS[name] ?? REPO_ICONS[packageRepo(name)] ?? 'remixBox3Line'
}

/** Every icon `packageIcon` can name, for `provideIcons`. */
export const PACKAGE_ICONS = { vikingScroll, remixAccessibilityLine, remixWindowLine, remixAtomLine, remixApps2Line, remixBox1Line, remixBrainLine, remixBugLine, remixCalendarLine, remixArrowUpCircleLine, remixCodeLine, remixSettings3Line, remixPuzzleLine, remixCpuLine, remixFlaskLine, remixDashboardLine, remixGlobalLine, remixHammerLine, remixTranslate2, remixStackLine, remixMapLine, remixChatCheckLine, remixBox3Line, remixPaletteLine, remixPlayLine, remixBroadcastLine, remixRouteLine, remixServerLine, remixSparklingLine, remixPlantLine, remixTerminalBoxLine, remixInputField, remixTimerLine, remixMagicLine, remixFlowChart }

/** A contributor's packages with misspelled scopes folded into the package they mean, most PRs first. */
export function foldPackages(packages: ReadonlyArray<{ name: string, pullRequests: number }>): Array<{ name: string, pullRequests: number }> {
  const counts = new Map<string, number>()
  for (const { name, pullRequests } of packages) {
    const key = canonicalPackage(name)
    counts.set(key, (counts.get(key) ?? 0) + pullRequests)
  }
  return [...counts].map(([name, pullRequests]) => ({ name, pullRequests })).sort((a, b) => b.pullRequests - a.pullRequests || a.name.localeCompare(b.name))
}
