/**
 * A theme colour as WebGL wants it: both themes recolour the globe through `--globe-*` and `--primary` (styles.css).
 * Percentages are read as they are; any other colour through a canvas, to 8 bits a channel.
 */
export const themeColor = (name: string, fallback: [number, number, number]): [number, number, number] => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const percents = /^rgb\(([\d.]+)% ([\d.]+)% ([\d.]+)%\)$/.exec(value);
  if (percents) return [Number(percents[1]) / 100, Number(percents[2]) / 100, Number(percents[3]) / 100];
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!context || !value) return fallback;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
};
/** The library's lighting for each theme, and the theme's colours (its base dimmed on dark). */
export const palette = (dark: boolean) => ({
  ...(dark
    ? { dark: 1, diffuse: 1.2, mapBrightness: 4, mapBaseBrightness: 0.03 }
    : { dark: 0, diffuse: 1.4, mapBrightness: 8, mapBaseBrightness: 0 }),
  baseColor: themeColor('--globe-base', [0.94, 0.95, 0.96]).map(channel => dark ? channel * 0.6 : channel) as [number, number, number],
  glowColor: themeColor('--globe-glow', [0.92, 0.93, 0.95]),
});
