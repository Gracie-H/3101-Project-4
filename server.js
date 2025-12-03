import http from "http";
import { WebSocketServer, WebSocket } from "ws";

import { randomUUID } from "crypto";

const PORT = 3000;


const rooms = new Map();

function getRoom(name) {
  if (!rooms.has(name)) {
    rooms.set(name, {
      clients: new Map(),
      state: { captured: {}, tank: {} },
    });
  }
  return rooms.get(name);
}

function broadcast(roomObj, msg, exceptId = null) {
  const data = JSON.stringify(msg);
  for (const [id, client] of roomObj.clients.entries()) {
    if (exceptId && id === exceptId) continue;
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  }
}


const server = http.createServer((req, res) => {


  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("WS server running.\n");
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const roomName = (url.searchParams.get("room") || "default").trim() || "default";
  const roomObj = getRoom(roomName);

  // two users only
  if (roomObj.clients.size >= 2) {
    ws.send(JSON.stringify({ type: "room_full" }));
    ws.close();
    return;
  }

  const id = randomUUID();
  roomObj.clients.set(id, ws);

  ws.send(
    JSON.stringify({
      type: "welcome",
      id,
      state: roomObj.state,
    })
  );

  ws.on("message", (raw) => {
    let data;
    try {
      data = JSON.parse(String(raw));
    } catch {
      return;
    }
    if (!data || typeof data.type !== "string") return;


    const x = Number(data.x);
    const y = Number(data.y);

    if (data.type === "cursor") {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      broadcast(roomObj, { type: "cursor", x, y }, id);
      return;
    }

    if (data.type === "ping") {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      broadcast(roomObj, { type: "ping", x, y }, id);
      return;
    }

    if (data.type === "capture") {
      const creatureId = String(data.creatureId || "");
      if (!creatureId) return;

      roomObj.state.captured[creatureId] = true;

   
      broadcast(roomObj, { type: "captured", creatureId }, null);
      return;
    }

    if (data.type === "tank_move") {
      const creatureId = String(data.creatureId || "");
      if (!creatureId) return;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      const vx = Number(data.vx) || 0;
      const vy = Number(data.vy) || 0;

      roomObj.state.tank[creatureId] = { x, y, vx, vy };

      broadcast(
        roomObj,
        {
          type: "tank_move",
          creatureId,
          x,
          y,
          vx,
          vy,
        },
        id
      );
      return;
    }
  });

  ws.on("close", () => {
    roomObj.clients.delete(id);
    if (roomObj.clients.size === 0) rooms.delete(roomName);
  });
});

server.listen(PORT, () => {
  console.log(`WS server listening on http://localhost:${PORT} (path: /ws)`);
});
