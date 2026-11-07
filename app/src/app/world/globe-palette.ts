/** The theme's primary colour as WebGL wants it: both themes recolour the land through it. */
export const primaryColor = (fallback: [number, number, number]): [number, number, number] => {
  const context = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const value = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  if (!context || !value) return fallback;
  context.fillStyle = value;
  context.fillRect(0, 0, 1, 1);
  const [red, green, blue] = context.getImageData(0, 0, 1, 1).data;
  return [red / 255, green / 255, blue / 255];
};
/** The globe's colours in each theme, for cobe. */
export const palette = (dark: boolean) => dark
  ? { dark: 1, diffuse: 1.2, mapBrightness: 4, mapBaseBrightness: 0.03, baseColor: primaryColor([0.44, 0.69, 0.48]).map(channel => channel * 0.6) as [number, number, number], glowColor: [0.06, 0.08, 0.1] as [number, number, number] }
  : { dark: 0, diffuse: 1.4, mapBrightness: 8, mapBaseBrightness: 0, baseColor: [0.94, 0.95, 0.96] as [number, number, number], glowColor: [0.92, 0.93, 0.95] as [number, number, number] };
