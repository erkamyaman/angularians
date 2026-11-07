/**
 * The community translations of angular.dev (its footer's "Community translations"), and who translated each: the lead,
 * and everyone with five or more translation commits in its repository. Each translator scores a translation once, on the
 * day it joined the footer, and wears its badge. By GitHub id: a username can change. A list, not data the collector
 * finds: update it by hand, as in the `add-a-translator` skill.
 */
export interface Translation {
  /** The language as angular.dev's footer writes it. */
  language: string
  site: string
  repository: string
  /** ISO date: when angular.dev's footer first linked it. */
  joinedAt: string
  translators: ReadonlyArray<{ githubId: number, username: string }>
}

/** As of November 2026, in the footer's order. */
export const TRANSLATIONS: readonly Translation[] = [
  { language: 'Azərbaycanca', site: 'https://angular.az', repository: 'https://github.com/Tapdiq49/angular', joinedAt: '2026-03-04', translators: [
    { githubId: 72246230, username: 'Tapdiq49' },
  ] },
  { language: 'Español', site: 'https://docs.angular.lat', repository: 'https://github.com/angular-hispano/angular-docs-es', joinedAt: '2026-05-26', translators: [
    { githubId: 35105981, username: 'ricardochl' },
    { githubId: 1909643, username: 'oidacra' },
  ] },
  { language: 'Oʻzbekcha', site: 'https://ilyoskhuja.github.io/angular-uz/', repository: 'https://github.com/Ilyoskhuja/angular-uz', joinedAt: '2026-10-24', translators: [
    { githubId: 30035451, username: 'Ilyoskhuja' },
  ] },
  { language: 'Türkçe', site: 'https://angular-docs.tr', repository: 'https://github.com/erkamyaman/angular-tr', joinedAt: '2026-03-07', translators: [
    { githubId: 88717125, username: 'erkamyaman' },
  ] },
  { language: 'Русский', site: 'https://angular-docs.ru', repository: 'https://github.com/misha98857/angular-docs.ru', joinedAt: '2025-12-12', translators: [
    { githubId: 22891743, username: 'misha98857' },
  ] },
  { language: '한국어', site: 'https://angular.kr', repository: 'https://github.com/han41858/angular-ko', joinedAt: '2023-11-06', translators: [
    { githubId: 15343639, username: 'han41858' },
  ] },
  { language: '日本語', site: 'https://angular.jp', repository: 'https://github.com/angular/angular-ja', joinedAt: '2023-11-06', translators: [
    { githubId: 1529180, username: 'lacolaco' },
    { githubId: 114789857, username: 'darkss-xyzzy' },
    { githubId: 86603334, username: 'ist-h-i' },
  ] },
  // 正體中文 (dev.angular.tw) is converted from this one, so its translator is this one's.
  { language: '简体中文', site: 'https://angular.cn', repository: 'https://github.com/ng-docs', joinedAt: '2023-11-06', translators: [
    { githubId: 1446119, username: 'asnowwolf' },
  ] },
  { language: '正體中文', site: 'https://dev.angular.tw', repository: 'https://github.com/ng-docs/dev.angular.tw', joinedAt: '2023-11-06', translators: [
    { githubId: 1446119, username: 'asnowwolf' },
  ] },
]

/** The translations a contributor translated, in the footer's order. */
export function translationsOf(githubId: number): Translation[] {
  return TRANSLATIONS.filter(translation => translation.translators.some(translator => translator.githubId === githubId))
}
