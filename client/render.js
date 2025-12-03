import { cfg } from "./creatures.js";

export const clamp01 = (v) => Math.max(0, Math.min(1, v));
export const smooth = (t) => {
  t = clamp01(t);
  return t * t * (3 - 2 * t);
};

export function drawLight(ctx, x, y, color = "white", radius = cfg.lightR) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, "transparent");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export function drawRing(ctx, x, y, r, p) {
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = "rgba(255,255,255,0.85)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp01(p));
  ctx.stroke();
  ctx.restore();
}

export function drawHintNeedBoth(ctx, x, y) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.font = '700 18px "Cinzel Decorative", serif';

  ctx.fillText("Need both lights", x - 46, y - 62);
  ctx.restore();
}

export function drawHUD(state) {
  const { ctx } = state;
  const total = state.creatures.length;
  const captured = state.creatures.filter(c => c.captured).length;

  ctx.save();
  ctx.font = '600 13px "Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, Arial';

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(`Captured: ${captured}/${total}`, 18, 28);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.fillText(`#${state.room}  | T:Tank  H:Hunt | Exploring the Deep Sea with Light`, 18, 50);
  ctx.restore();
}

export function drawCreaturePNG(state, c, x, y, alpha) {
  const { ctx, tNow, images } = state;
  const img = images[c.imgKey];

  const iw = (img?.naturalWidth || img?.width || 140);
  const ih = (img?.naturalHeight || img?.height || 140);

  const floatX = Math.sin(tNow * 1.05 + c.seed) * 6;
  const floatY = Math.sin(tNow * 1.25 + c.seed) * 8;

  let rot = 0;
  if (c.kind === "fish" || c.kind === "lion" || c.kind === "ray") rot = Math.sin(tNow * 0.9 + c.seed) * 0.08;
  if (c.kind === "jelly") rot = Math.sin(tNow * 0.7 + c.seed) * 0.04;

  const base = (c.size === "large") ? cfg.creatureScaleLarge : cfg.creatureScaleSmall;
  const pulse = 1 + smooth(c.capture || 0) * 0.18;

  const perIdScale =
  c.id === "seaweed" ? 0.68 : 1;
  c.id === "lionFish" ? 0.58 :  1;
  

  const scale = base * pulse * perIdScale;

  const w = iw * scale;
  const h = ih * scale;

  ctx.save();
  ctx.translate(x + floatX, y + floatY);
  ctx.rotate(rot);

  ctx.globalAlpha = alpha;
  ctx.shadowBlur = (c.size === "large") ? 26 : 16;
  ctx.shadowColor = (c.kind === "jelly")
    ? "rgba(140,200,255,0.55)"
    : "rgba(255,255,255,0.25)";

  if (img) ctx.drawImage(img, -w / 2, -h / 2, w, h);

  ctx.restore();
}

// background
export function drawCaustics(state) {
  const { ctx, canvas, tNow } = state;
  ctx.save();
  ctx.globalAlpha = 0.085; 
  ctx.strokeStyle = "#cfe9ff";
  ctx.lineWidth = 1;

  const step = 22;
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x += 18) {
      const yy = y + Math.sin(tNow * 1.2 + x * 0.02 + y * 0.04) * 6;
      ctx.lineTo(x, yy);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function spriteMetrics(state, c) {
  const img = state.images[c.imgKey];
  const iw = (img?.naturalWidth || img?.width || 140);
  const ih = (img?.naturalHeight || img?.height || 140);

  const base = (c.size === "large") ? cfg.creatureScaleLarge : cfg.creatureScaleSmall;
  const pulse = 1 + smooth(c.capture || 0) * 0.18;
  const scale = base * pulse;

  const w = iw * scale;
  const h = ih * scale;

  const hitR = Math.max(
    (c.size === "large" ? cfg.hitLarge : cfg.hitSmall),
    Math.min(160, Math.min(w, h) * 0.32)
  );

  return { w, h, halfW: w / 2, halfH: h / 2, hitR };
}

export function clampSpriteToView(state, x, y, halfW, halfH, pad = 18) {
  const W = state.canvas.width;
  const H = state.canvas.height;
  return {
    x: Math.max(halfW + pad, Math.min(W - halfW - pad, x)),
    y: Math.max(halfH + pad, Math.min(H - halfH - pad, y))
  };
}
