// Shared scoring primitives. Every score is a pure function in [0,1] so the
// whole diagnostic layer is unit-testable and replayable. Ported and adapted
// from the AreteOS engine; kept dependency-free and client-safe (no Prisma).

export const clamp01 = (x: number): number => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);

/** Arithmetic mean of a list, 0 if empty, each term clamped to [0,1]. */
export const mean = (xs: number[]): number =>
  xs.length ? clamp01(xs.reduce((a, b) => a + clamp01(b), 0) / xs.length) : 0;

/** Geometric mean in [0,1] — collapses if any single layer is neglected, so one
 *  maxed axis cannot fake a healthy whole. 0 if empty. */
export const geometricMean = (xs: number[]): number => {
  if (!xs.length) return 0;
  const eps = 1e-6;
  const logSum = xs.reduce((a, x) => a + Math.log(Math.max(clamp01(x), eps)), 0);
  return clamp01(Math.exp(logSum / xs.length));
};

/** Confidence from sample size: 0 at n=0, → 1 as n grows (half at n=k). */
export const sampleConfidence = (n: number, k = 6): number => (n <= 0 ? 0 : clamp01(n / (n + k)));

export interface ScoreWithConfidence {
  value: number;
  confidence: number;
  low: number;
  high: number;
  samples: number;
}

/** Wrap a point estimate with a confidence band that widens when evidence is thin,
 *  so the UI can show "73% ±12% (n=4)" instead of false precision. */
export function withConfidence(value: number, samples: number, k = 6): ScoreWithConfidence {
  const v = clamp01(value);
  const confidence = sampleConfidence(samples, k);
  const halfWidth = (1 - confidence) * 0.5;
  return { value: v, confidence, low: clamp01(v - halfWidth), high: clamp01(v + halfWidth), samples };
}
