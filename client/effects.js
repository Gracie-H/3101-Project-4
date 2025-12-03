export function ensureFX(state) {
    state.fx ||= { bubbles: [], flashes: [], pings: [] };
  }
  
  export function burstBubbles(state, x, y, n = 20) {
    ensureFX(state);
    for (let i = 0; i < n; i++) {
      state.fx.bubbles.push({
        x, y,
        vx: (Math.random() - 0.5) * 90,
        vy: -40 - Math.random() * 140,
        r: 2 + Math.random() * 4,
        t: 0,
        life: 0.6 + Math.random() * 0.6
      });
    }
  }
  
  export function flashAt(state, x, y, life = 0.14) {
    ensureFX(state);
    state.fx.flashes.push({ x, y, t: 0, life });
  }
  
  export function addPing(state, x, y) {
    ensureFX(state);
    state.fx.pings.push({ x, y, t: 0, life: 0.9 });
  }
  
  export function updateFX(state, dt) {
    ensureFX(state);
  
    const { bubbles, flashes, pings } = state.fx;
  
    for (let i = bubbles.length - 1; i >= 0; i--) {
      const b = bubbles[i];
      b.t += dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.vy += 30 * dt;
      if (b.t >= b.life) bubbles.splice(i, 1);
    }
  
    for (let i = flashes.length - 1; i >= 0; i--) {
      flashes[i].t += dt;
      if (flashes[i].t >= flashes[i].life) flashes.splice(i, 1);
    }
  
    for (let i = pings.length - 1; i >= 0; i--) {
      pings[i].t += dt;
      if (pings[i].t >= pings[i].life) pings.splice(i, 1);
    }
  }
  
  export function renderFX(state) {
    ensureFX(state);
    const { ctx } = state;
    const { bubbles, flashes, pings } = state.fx;
  
    // pings
    // ctx.save();
    // for (const p of pings) {
    //   const t = p.t / p.life;
    //   const a = 1 - t;
    //   const r = 10 + t * 60;
    //   ctx.globalAlpha = a * 0.8;
    //   ctx.strokeStyle = "rgba(0,150,255,0.85)";
    //   ctx.lineWidth = 2;
    //   ctx.beginPath();
    //   ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    //   ctx.stroke();
    // }
    // ctx.restore();
  
    // bubbles
    ctx.save();
    for (const b of bubbles) {
      const a = 1 - b.t / b.life;
      ctx.globalAlpha = a * 0.85;
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  
    // flash
    ctx.save();
    for (const f of flashes) {
      const t = f.t / f.life;
      const a = 1 - t;
      const r = 30 + t * 140;
      const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, r);
      g.addColorStop(0, `rgba(255,255,255,${0.85 * a})`);
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(f.x, f.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  