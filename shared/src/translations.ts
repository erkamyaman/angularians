/**
 * The community translations of angular.dev (its footer's "Community translations"), and who translated each: the lead,
 * and everyone with five or more translation commits in its repository. Each scores a translation once, on its
 * `joinedAt` (the lead more), and wears its badge. By GitHub id: a username can change. A list, not data the collector
 * finds: update it by hand, as in the `add-a-translator` skill.
 */
export interface Translation {
  /** The language's name in that language. */
  language: string
  /** Names its badge's colours, a `tone-lang-*` class of `badge-pill.css`. */
  code: string
  /** The country code of the flag its badge shows. */
  flag: string
  site: string
  repository: string
  /** ISO date: when the commit linking it landed in angular.dev's footer, or when a pull request asked for that link. */
  joinedAt: string
  /** `helper`: not its lead, five or more translation commits. Their badge says contributor, not translator. */
  translators: ReadonlyArray<{ githubId: number, username: string, helper?: true }>
}

/** As of November 2026, in the footer's order, then those a pull request asks the footer to add. */
export const TRANSLATIONS: readonly Translation[] = [
  { language: 'Azərbaycanca', code: 'az', flag: 'az', site: 'https://angular.az', repository: 'https://github.com/Tapdiq49/angular', joinedAt: '2026-03-04', translators: [
    { githubId: 72246230, username: 'Tapdiq49' },
  ] },
  { language: 'Español', code: 'es', flag: 'es', site: 'https://docs.angular.lat', repository: 'https://github.com/angular-hispano/angular-docs-es', joinedAt: '2026-05-27', translators: [
    { githubId: 35105981, username: 'ricardochl' },
    { githubId: 1909643, username: 'oidacra', helper: true },
  ] },
  { language: 'Oʻzbekcha', code: 'uz', flag: 'uz', site: 'https://ilyoskhuja.github.io/angular-uz/', repository: 'https://github.com/Ilyoskhuja/angular-uz', joinedAt: '2026-10-24', translators: [
    { githubId: 30035451, username: 'Ilyoskhuja' },
  ] },
  { language: 'Türkçe', code: 'tr', flag: 'tr', site: 'https://angular-docs.tr', repository: 'https://github.com/erkamyaman/angular-tr', joinedAt: '2026-03-09', translators: [
    { githubId: 88717125, username: 'erkamyaman' },
  ] },
  { language: 'Русский', code: 'ru', flag: 'ru', site: 'https://angular-docs.ru', repository: 'https://github.com/misha98857/angular-docs.ru', joinedAt: '2026-01-12', translators: [
    { githubId: 22891743, username: 'misha98857' },
  ] },
  { language: '한국어', code: 'ko', flag: 'kr', site: 'https://angular.kr', repository: 'https://github.com/han41858/angular-ko', joinedAt: '2023-11-06', translators: [
    { githubId: 15343639, username: 'han41858' },
  ] },
  { language: '日本語', code: 'ja', flag: 'jp', site: 'https://angular.jp', repository: 'https://github.com/angular/angular-ja', joinedAt: '2023-11-06', translators: [
    { githubId: 1529180, username: 'lacolaco' },
    { githubId: 114789857, username: 'darkss-xyzzy', helper: true },
    { githubId: 86603334, username: 'ist-h-i', helper: true },
  ] },
  // 正體中文 (dev.angular.tw) is converted from this one, so its translator is this one's.
  { language: '简体中文', code: 'zh-cn', flag: 'cn', site: 'https://angular.cn', repository: 'https://github.com/ng-docs', joinedAt: '2023-11-06', translators: [
    { githubId: 1446119, username: 'asnowwolf' },
  ] },
  { language: '正體中文', code: 'zh-tw', flag: 'tw', site: 'https://dev.angular.tw', repository: 'https://github.com/ng-docs/dev.angular.tw', joinedAt: '2023-11-06', translators: [
    { githubId: 1446119, username: 'asnowwolf' },
  ] },
  // Not in the footer yet: angular/angular#71836 adds it.
  { language: 'Français', code: 'fr', flag: 'fr', site: 'https://docs.angulardevs.fr', repository: 'https://github.com/angular-devs-france/angular-docs-fr', joinedAt: '2026-11-05', translators: [
    { githubId: 32737308, username: 'geromegrignon' },
  ] },
]

/** The translations a contributor translated, in the footer's order. */
export function translationsOf(githubId: number): Translation[] {
  return TRANSLATIONS.filter(translation => translation.translators.some(translator => translator.githubId === githubId))
}
