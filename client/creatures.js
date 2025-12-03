export const cfg = {
    lightR: 210,
    revealSmall: 0.35,
    revealLarge: 0.65,
    captureSmall: 0.55,
    captureLarge: 0.75,
  

    hitSmall: 70,
    hitLarge: 110,
  

    creatureScaleSmall: 0.25,
    creatureScaleLarge: 0.55
  };
  
  
  // special collab
  export const needDual = new Set([
    "mantaRay", // 8.png 
    "jelly5"    // 13.png jellyfish
  ]);
  
  function mkCreature(id, label, kind, size, nx, ny, seed, imgKey) {
    return {
      id, label, kind, size, nx, ny, seed, imgKey,
      captured: false,
      revealT: 0,
      captureT: 0,
      reveal: 0,
      capture: 0,
      tank: null
    };
  }
  
  export function createCreatures() {
    return [
      mkCreature("jelly1",    "Jellyfish 1", "jelly",    "small", 0.18, 0.20, 0.3,  "img1"),
      mkCreature("seahorse1", "Seahorse 1",  "seahorse", "small", 0.30, 0.46, 1.1,  "img2"),
      mkCreature("star1",     "Starfish",    "star",     "small", 0.52, 0.88, 0.9,  "img3"),
      mkCreature("seahorse2", "Seahorse 2",  "seahorse", "small", 0.24, 0.62, 2.4,  "img4"),
      mkCreature("urchin",    "Sea Urchin",  "urchin",   "small", 0.70, 0.84, 1.8,  "img5"),
      mkCreature("seaweed",   "Seaweed",     "seaweed",  "large", 0.86, 0.72, 1.4,  "img6"),
      mkCreature("octopus",   "Octopus",     "octo",     "large", 0.18, 0.82, 1.6,  "img7"),
      mkCreature("mantaRay",  "Manta Ray",   "ray",      "large", 0.74, 0.56, 2.2,  "img8"),
      mkCreature("lionFish",  "Lion Fish",   "lion",     "large", 0.78, 0.36, 1.9,  "img9"),
      mkCreature("jelly2",    "Jellyfish 2", "jelly",    "small", 0.52, 0.18, 0.7,  "img10"),
      mkCreature("jelly3",    "Jellyfish 3", "jelly",    "small", 0.83, 0.24, 2.1,  "img11"),
      mkCreature("jelly4",    "Jellyfish 4", "jelly",    "small", 0.40, 0.34, 2.8,  "img12"),
      mkCreature("jelly5",    "Jellyfish 5", "jelly",    "large", 0.56, 0.78, 3.7,  "img13")
    ];
  }
  

  export function makeCreatures() {
    return createCreatures();
  }

  export function creaturePos(canvas, c) {
    return { x: c.nx * canvas.width, y: c.ny * canvas.height };
  }
  
  export function creatureHitR(c) {
    return c.size === "large" ? cfg.hitLarge : cfg.hitSmall;
  }
  
  export function creatureRevealNeed(c) {
    return c.size === "large" ? cfg.revealLarge : cfg.revealSmall;
  }
  
  export function creatureCaptureNeed(c) {
    return c.size === "large" ? cfg.captureLarge : cfg.captureSmall;
  }
  
  export function initTank(canvas, c) {
    if (c.tank) return;
    const margin = 90;
    c.tank = {
      x: margin + Math.random() * Math.max(10, canvas.width - margin * 2),
      y: margin + Math.random() * Math.max(10, canvas.height - margin * 2),
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 40
    };
  }
  