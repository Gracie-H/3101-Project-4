import {
    creaturePos,
    creatureHitR,
    creatureRevealNeed,
    creatureCaptureNeed,
    initTank,
    cfg,
    needDual
  } from "./creatures.js";
  import { smooth, drawLight, drawRing, drawHintNeedBoth, drawHUD, drawCreaturePNG, spriteMetrics, clampSpriteToView } from "./render.js";

  import { burstBubbles, flashAt, updateFX, renderFX } from "./effects.js";
  
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  const inLight = (lx, ly, x, y) => dist(lx, ly, x, y) <= cfg.lightR;
  
  export function updateHunt(state, dt) {
    // smooth partner cursor
    state.partnerCursor.x += (state.partnerCursor.tx - state.partnerCursor.x) * 0.18;
    state.partnerCursor.y += (state.partnerCursor.ty - state.partnerCursor.y) * 0.18;
  
    for (const c of state.creatures) {
      if (c.captured) continue;
  
      const p = creaturePos(state.canvas, c);
      const m = spriteMetrics(state, c);
      const p2 = clampSpriteToView(state, p.x, p.y, m.halfW, m.halfH);

      const myLit = inLight(state.myCursor.x, state.myCursor.y, p.x, p.y);
      const partnerLit = inLight(state.partnerCursor.x, state.partnerCursor.y, p.x, p.y);
  
      const dual = needDual.has(c.id);
      const revealOk = dual ? (myLit && partnerLit) : (myLit || partnerLit);
  
      // reveal timer
      const revealNeed = creatureRevealNeed(c);
      if (revealOk) c.revealT = Math.min(revealNeed, c.revealT + dt);
      else c.revealT = Math.max(0, c.revealT - dt * 0.9);
  
      c.reveal = smooth(c.revealT / revealNeed);
  
      // capture (after reveal enough)
      if (c.reveal > 0.7) {
        const hitR = m.hitR;

        const myHit = dist(p.x, p.y, state.myCursor.x, state.myCursor.y) <= hitR;
        const partnerHit = dist(p.x, p.y, state.partnerCursor.x, state.partnerCursor.y) <= hitR;
  
        const capOk = dual ? (myHit && partnerHit) : (myHit || partnerHit);
  
        const capNeed = creatureCaptureNeed(c);
        if (capOk) c.captureT = Math.min(capNeed, c.captureT + dt);
        else c.captureT = Math.max(0, c.captureT - dt * 1.25);
  
        c.capture = smooth(c.captureT / capNeed);
  
        if (c.capture >= 1) {
          c.captured = true;
          c.reveal = 1;
          c.capture = 1;
          initTank(state.canvas, c);
  
          burstBubbles(state, p.x, p.y, 26);
          flashAt(state, p.x, p.y, 0.14);
  
          if (state.socket?.readyState === WebSocket.OPEN) {
            state.socket.send(JSON.stringify({ type: "capture", creatureId: c.id }));
          }
        }
      } else {
        c.captureT = Math.max(0, c.captureT - dt * 1.5);
        c.capture = smooth(c.captureT / creatureCaptureNeed(c));
      }
    }
  
    updateFX(state, dt);
  }
  
  export function renderHunt(state) {
    const { ctx, canvas } = state;
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  
    // creatures
    for (const c of state.creatures) {
      if (c.captured) continue;
  
      const p = creaturePos(canvas, c);
  
      const anyLight =
        inLight(state.myCursor.x, state.myCursor.y, p.x, p.y) ||
        inLight(state.partnerCursor.x, state.partnerCursor.y, p.x, p.y);
  
      if (!anyLight && c.reveal < 0.06) continue;
  
      const alpha = 0.15 + c.reveal * 0.85;
      drawCreaturePNG(state, c, p.x, p.y, alpha);
  
      if (c.capture > 0.02) {
        drawRing(ctx, p.x, p.y, (c.size === "large" ? 84 : 62), c.capture);
      }
  
      if (needDual.has(c.id)) {
        const myLit2 = inLight(state.myCursor.x, state.myCursor.y, p.x, p.y);
        const partnerLit2 = inLight(state.partnerCursor.x, state.partnerCursor.y, p.x, p.y);
        if (myLit2 && !partnerLit2 && c.reveal < 1) drawHintNeedBoth(ctx, p.x, p.y);
      }
    }
  
    renderFX(state);
  
    // lights last
    // drawLight(ctx, state.partnerCursor.x, state.partnerCursor.y, "rgba(0,150,255,0.8)", cfg.lightR);
    drawLight(ctx, state.myCursor.x, state.myCursor.y, "rgba(255,255,255,0.9)", cfg.lightR);
  
    drawHUD(state);
  }
  