import { faceOnGlobe, projectOnGlobe } from './globe-math';

describe('globe math', () => {
  it('puts the point the camera faces in the middle, on the visible side', () => {
    for (const location of [[48.86, 2.35], [-33.87, 151.21], [40.71, -74.01], [0, 0]] as const) {
      const { phi, theta } = faceOnGlobe(location);
      const out = { depth: 0, x: 0, y: 0 };
      projectOnGlobe(out, location, phi, theta, 1);
      expect(out.x).toBeCloseTo(0, 6);
      expect(out.y).toBeCloseTo(0, 6);
      expect(out.depth).toBeGreaterThan(0.7);
    }
  });

  it('hides the opposite side of the globe', () => {
    const { phi, theta } = faceOnGlobe([0, 0]);
    const out = { depth: 0, x: 0, y: 0 };
    projectOnGlobe(out, [0, 180], phi, theta, 1);
    expect(out.depth).toBeLessThan(0);
  });
});
