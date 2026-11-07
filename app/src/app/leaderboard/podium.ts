/** Gold, silver and bronze for the top three of a period: `--medal-*` in styles.css, classes in `styles/podium.css`. */
export const PODIUM: Record<number, { icon: string, medal: 'gold' | 'silver' | 'bronze' } | undefined> = {
  1: { icon: 'vikingHelmet', medal: 'gold' },
  2: { icon: 'vikingShield', medal: 'silver' },
  3: { icon: 'vikingAxes', medal: 'bronze' },
}
