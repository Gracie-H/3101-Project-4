// client/math.js
export const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
export const clamp01 = (v) => clamp(v, 0, 1);

export const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);

export const smooth = (t) => {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
};
