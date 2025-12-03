import { makeCreatures, needDual, cfg } from "./creatures.js";
import { ensureFX, addPing, flashAt } from "./effects.js";
import { updateHunt, renderHunt } from "./hunt.js";
import {
  enterTankView,
  updateTank,
  renderTank,
  startDrag,
  stopDrag,
  dragMove
} from "./tank.js";


// Canvas setup

const canvas = document.getElementById("aquarium");
const ctx = canvas.getContext("2d");

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();


// Parse room / view from URL

function parseHash() {
  const raw = (location.hash || "#default").slice(1);
  const [roomPart, viewPart] = raw.split("/");
  return {
    room: (roomPart || "default").trim(),
    view: (viewPart || "hunt").trim().toLowerCase()
  };
}

const parsed = parseHash();
const room = parsed.room;
let view = parsed.view;

// If view hash changes
window.addEventListener("hashchange", () => {
  const p = parseHash();
  if (p.room !== room) {
    alert("Room changed. Refresh to reconnect.");
    return;
  }
  view = (p.view || "hunt");
  if (view === "tank") enterTankView(state);
});


// Global state

const state = {
  canvas,
  ctx,
  room,
  view,

  tNow: 0,
  myId: null,

  // local mouse
  myCursor: { x: canvas.width / 2, y: canvas.height / 2 },

  // partner mouse (smooth)
  partnerCursor: {
    x: canvas.width / 2,
    y: canvas.height / 2,
    tx: canvas.width / 2,
    ty: canvas.height / 2
  },

  draggingId: null,
  dragOffX: 0,
  dragOffY: 0,
  lastSend: 0,

  creatures: makeCreatures(),
  byId: null,

  images: {}
};

// Map ID → creature
state.byId = new Map(state.creatures.map(c => [c.id, c]));

// Effects
ensureFX(state);


// Assign image keys

const ID_TO_IMGNUM = {
  jelly1: 1,
  seahorse1: 2,
  starfish: 3,
  seahorse2: 4,
  urchin: 5,
  seaweed: 6,
  octopus: 7,
  ray: 8,
  lionfish: 9,
  jelly2: 10,
  jelly3: 11,
  jelly4: 12,
  jelly5: 13
};

for (const c of state.creatures) {
  if (!c.imgKey) {
    const n = ID_TO_IMGNUM[c.id];
    if (n) c.imgKey = `img${n}`;
  }
}


// Load creature images

for (let i = 1; i <= 13; i++) {
  const img = new Image();
  img.src = `/assets/${i}.png`;
  state.images[`img${i}`] = img;

  img.onload = () => console.log("loaded", i, img.naturalWidth, img.naturalHeight);
  img.onerror = () => console.warn("FAILED", i, img.src);
}

// WebSocket setup

const socket = new WebSocket(
  `ws://${location.hostname}:3000/ws?room=${encodeURIComponent(room)}`
);

state.socket = socket;

socket.addEventListener("open", () => console.log("WS connected"));

socket.addEventListener("message", (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch {
    return;
  }
  console.log("[WS <-]", data.type, data);

  // Room full
  if (data.type === "room_full") {
    alert("Room is full (2 users only). Use a different #room.");
    return;
  }

  // Welcome
  if (data.type === "welcome") {
    state.myId = data.id;

    // restore captured state
    const captured = data.state?.captured || {};
    for (const c of state.creatures) {
      if (captured[c.id]) {
        c.captured = true;
        c.reveal = 1;
        c.capture = 1;
      }
    }

    // restore tank state
    const tank = data.state?.tank || {};
    for (const [cid, pos] of Object.entries(tank)) {
      const c = state.byId.get(cid);
      if (!c) continue;

      c.captured = true;
      c.reveal = 1;
      c.capture = 1;
      c.tank = {
        x: pos.x,
        y: pos.y,
        vx: pos.vx || 0,
        vy: pos.vy || 0
      };
    }

    if (view === "tank") enterTankView(state);
    return;
  }

  // partner cursor
  if (data.type === "cursor") {
    state.partnerCursor.tx = data.x;
    state.partnerCursor.ty = data.y;
    return;
  }

  // ping
  if (data.type === "ping") {
    addPing(state, data.x, data.y);
    return;
  }

  // captured
  if (data.type === "captured") {
    const c = state.byId.get(data.creatureId);
    if (c && !c.captured) {
      c.captured = true;
      c.reveal = 1;
      c.capture = 1;
      flashAt(
        state,
        data.x ?? state.partnerCursor.x,
        data.y ?? state.partnerCursor.y,
        0.14
      );
    }
    return;
  }

  // tank movement
  if (data.type === "tank_move") {
    const c = state.byId.get(data.creatureId);
    if (!c) return;

    c.captured = true;
    c.reveal = 1;
    c.capture = 1;

    c.tank = c.tank || {};
    c.tank.x = data.x;
    c.tank.y = data.y;
    c.tank.vx = data.vx ?? 0;
    c.tank.vy = data.vy ?? 0;
    return;
  }
});

// on closing
window.addEventListener("beforeunload", () => {
  try {
    socket.close();
  } catch {}
});


// Inputs

window.addEventListener("keydown", (e) => {
  if (e.key === "t" || e.key === "T") location.hash = `#${room}/tank`;
  if (e.key === "h" || e.key === "H") location.hash = `#${room}`;
});

// ping or drag start
window.addEventListener("mousedown", (e) => {
  if (view === "tank") {
    if (!e.shiftKey) {
      const ok = startDrag(state, e.clientX, e.clientY);
      if (ok) return;
    }
  }

  // ping
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({ type: "ping", x: e.clientX, y: e.clientY }));
  }
  addPing(state, e.clientX, e.clientY);
});

// drag end
window.addEventListener("mouseup", () => stopDrag(state));

// mouse move (send cursor)
window.addEventListener("mousemove", (e) => {
  state.myCursor.x = e.clientX;
  state.myCursor.y = e.clientY;

  // Send cursor position
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({ type: "cursor", x: state.myCursor.x, y: state.myCursor.y })
    );
  }

  // dragging in tank
  if (view === "tank" && state.draggingId) {
    const moved = dragMove(state, e.clientX, e.clientY);
    if (!moved) return;

    const c = state.byId.get(state.draggingId);
    if (!c?.tank) return;

    const now = performance.now();
    if (socket.readyState === WebSocket.OPEN && now - state.lastSend > 30) {
      state.lastSend = now;
      socket.send(
        JSON.stringify({
          type: "tank_move",
          creatureId: c.id,
          x: c.tank.x,
          y: c.tank.y,
          vx: 0,
          vy: 0
        })
      );
    }
  }
});


// Animation loop

let last = performance.now();

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  state.tNow = now / 1000;

  // Smooth partner cursor
  state.partnerCursor.x +=
    (state.partnerCursor.tx - state.partnerCursor.x) * 0.18;
  state.partnerCursor.y +=
    (state.partnerCursor.ty - state.partnerCursor.y) * 0.18;

  view = state.view = parseHash().view;

  if (view === "tank") {
    updateTank(state, dt);
    renderTank(state);
  } else {
    updateHunt(state, dt, socket, needDual, cfg);
    renderHunt(state, needDual, cfg);
    // ---- draw partner cursor (light blue) ----
ctx.save();
ctx.globalCompositeOperation = "lighter";

const r = 120; // radius
const g = ctx.createRadialGradient(
  state.partnerCursor.x, state.partnerCursor.y, 0,
  state.partnerCursor.x, state.partnerCursor.y, r
);

g.addColorStop(0, "rgba(120,160,255,0.55)");
g.addColorStop(0.5, "rgba(80,130,255,0.22)");
g.addColorStop(1, "rgba(60,100,255,0)");

ctx.fillStyle = g;
ctx.beginPath();
ctx.arc(state.partnerCursor.x, state.partnerCursor.y, r, 0, Math.PI * 2);
ctx.fill();
ctx.restore();
  }

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);
