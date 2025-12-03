import { clamp, dist } from "./math.js";
import { updateFX, renderFX } from "./effects.js";
import { drawCreaturePNG, drawCaustics, spriteMetrics } from "./render.js";


export function initTankIfNeeded(state, c) {
  if (c.tank) return;

  const m = spriteMetrics(state, c);
  const pad = 18;

  const left = pad + m.halfW;
  const right = state.canvas.width - pad - m.halfW;
  const top = 90 + m.halfH;
  const bottom = state.canvas.height - pad - m.halfH;

  c.tank = {
    x: left + Math.random() * Math.max(10, right - left),
    y: top + Math.random() * Math.max(10, bottom - top),
    vx: (Math.random() - 0.5) * 60,
    vy: (Math.random() - 0.5) * 40
  };
}

export function enterTankView(state) {
  for (const c of state.creatures) {
    if (c.captured) initTankIfNeeded(state, c);
  }
}


// Picking (drag select)

export function pickCaptured(state, x, y) {
  for (let i = state.creatures.length - 1; i >= 0; i--) {
    const c = state.creatures[i];
    if (!c.captured) continue;
    initTankIfNeeded(state, c);

    const r = spriteMetrics(state, c).hitR;
    if (dist(x, y, c.tank.x, c.tank.y) <= r) return c;
  }
  return null;
}

// Drag state

export function startDrag(state, x, y) {
  const c = pickCaptured(state, x, y);
  if (!c) return false;

  state.draggingId = c.id;
  state.dragOffX = x - c.tank.x;
  state.dragOffY = y - c.tank.y;
  return true;
}

export function stopDrag(state) {
  state.draggingId = null;
}

export function dragMove(state, x, y) {
  if (!state.draggingId) return false;

  const c = state.byId.get(state.draggingId);
  if (!c || !c.captured) return false;
  initTankIfNeeded(state, c);

  const m = spriteMetrics(state, c);
  const pad = 18;

  const left = pad + m.halfW;
  const right = state.canvas.width - pad - m.halfW;
  const top = 90 + m.halfH;
  const bottom = state.canvas.height - pad - m.halfH;

  const nx = x - state.dragOffX;
  const ny = y - state.dragOffY;

  c.tank.x = clamp(nx, left, right);
  c.tank.y = clamp(ny, top, bottom);
  c.tank.vx = 0;
  c.tank.vy = 0;

  return true;
}


// Update + Render

export function updateTank(state, dt) {
  enterTankView(state);

  for (const c of state.creatures) {
    if (!c.captured) continue;
    initTankIfNeeded(state, c);

    if (state.draggingId === c.id) continue;

    const t = c.tank;

    if (c.kind === "jelly") {
      t.vx += Math.sin(state.tNow * 0.9 + c.seed) * 6 * dt;
      t.vy += Math.cos(state.tNow * 1.1 + c.seed) * 8 * dt;
      t.vy -= 10 * dt;
    } else if (c.kind === "ray" || c.kind === "lion") {
      t.vx += Math.sin(state.tNow * 0.7 + c.seed) * 12 * dt;
      t.vy += Math.cos(state.tNow * 0.6 + c.seed) * 8 * dt;
    } else if (c.kind === "star") {
      t.vx *= 0.85;
      t.vy *= 0.85;
      t.y += Math.sin(state.tNow * 1.2 + c.seed) * 2 * dt;
    } else if (c.kind === "seaweed") {
      t.vx += Math.sin(state.tNow * 0.6 + c.seed) * 6 * dt;
      t.vy += Math.cos(state.tNow * 0.7 + c.seed) * 4 * dt;
    } else {
      t.vx += Math.sin(state.tNow * 0.9 + c.seed) * 10 * dt;
      t.vy += Math.cos(state.tNow * 1.0 + c.seed) * 6 * dt;
    }

    t.vx *= 0.98;
    t.vy *= 0.98;

    t.x += t.vx * dt;
    t.y += t.vy * dt;

    const m = spriteMetrics(state, c);
    const pad = 18;

    const left = pad + m.halfW;
    const right = state.canvas.width - pad - m.halfW;
    const top = 90 + m.halfH;
    const bottom = state.canvas.height - pad - m.halfH;

    if (t.x < left)  { t.x = left;  t.vx *= -1; }
    if (t.x > right) { t.x = right; t.vx *= -1; }
    if (t.y < top)   { t.y = top;   t.vy *= -1; }
    if (t.y > bottom){ t.y = bottom;t.vy *= -1; }
  }

  updateFX(state, dt);
}

function drawTopPanel(state) {
  const { ctx } = state;
  const total = state.creatures.length;
  const captured = state.creatures.filter(c => c.captured).length;

  const x = 16, y = 16;
  const w = 260, h = 44, r = 14;

  const roundRect = (ctx, x, y, w, h, r) => {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  };

  ctx.save();

  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 1;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 0.9;
  ctx.fillStyle = "rgba(120,200,255,0.85)";
  ctx.beginPath();
  ctx.arc(x + 14, y + 22, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(255,255,255,0.90)";
  ctx.font = "13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText("My Aquarium", x + 24, y + 18);

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(`#${state.room}  •  Drag  •  H`, x + 24, y + 34);

  const pillW = 64, pillH = 22;
  const px = x + w - pillW - 10;
  const py = y + (h - pillH) / 2;

  roundRect(ctx, px, py, pillW, pillH, 999);
  ctx.fillStyle = "rgba(255,255,255,0.10)";
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.86)";
  ctx.font = "11px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.fillText(`${captured}/${total}`, px + 18, py + 15);

  ctx.restore();
}

export function renderTank(state) {
  const { ctx, canvas } = state;

  ctx.font = '700 18px "Cinzel Decorative", serif';
  ctx.font = '600 13px "Space Grotesk", system-ui, -apple-system, Segoe UI, Roboto, Arial';



  drawCaustics(state);


  drawTopPanel(state);

  // draw creatures
  for (const c of state.creatures) {
    if (!c.captured) continue;
    initTankIfNeeded(state, c);

    // if (state.draggingId === c.id) {
    //   const r = spriteMetrics(state, c).hitR + 16;
    //   ctx.save();
    //   ctx.globalAlpha = 0.22;
    //   ctx.strokeStyle = "rgba(255,255,255,0.9)";
    //   ctx.lineWidth = 2;
    //   ctx.beginPath();
    //   ctx.arc(c.tank.x, c.tank.y, r, 0, Math.PI * 2);
    //   ctx.stroke();
    //   ctx.restore();
    // }

    drawCreaturePNG(state, c, c.tank.x, c.tank.y, 1);
  }

  renderFX(state);
}
