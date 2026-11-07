import { Graphics } from "pixi.js";

export type Rect = { x: number; y: number; w: number; h: number };


export function drawPlatforms(platforms: Rect[]): Graphics {
  const g = new Graphics();

  for (const platform of platforms) {
    g.rect(platform.x, platform.y, platform.w, platform.h).fill({ color: 0xf2f2f2 });
    g.rect(platform.x, platform.y, platform.w, 5).fill({ color: 0xffffff });
    g.rect(platform.x, platform.y + platform.h - 6, platform.w, 6).fill({ color: 0x8a8a8a });
    for (let x = platform.x + 12; x < platform.x + platform.w - 8; x += 28) {
      g.rect(x, platform.y + 13, 11, 4).fill({ color: 0xbcbcbc, alpha: 0.75 });
    }
  }

  return g;
}

// Utile anche fuori da Game: collisione tra due rettangoli
export function overlaps(a: Rect, b: Rect) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function setBackdrop(WORLD_HEIGHT: number, WORLD_WIDTH: number) {
  const backdrop = new Graphics({ label: "backdrop" });
  backdrop.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill({ color: 0x080808 });
  for (let x = 0; x < WORLD_WIDTH; x += 96) {
    backdrop.rect(x, 0, 1, WORLD_HEIGHT).fill({ color: 0x191919 });
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 96) {
    backdrop.rect(0, y, WORLD_WIDTH, 1).fill({ color: 0x151515 });
  }
  backdrop.rect(0, 650, WORLD_WIDTH, 2).fill({ color: 0x343434 });

  return backdrop
}

/** Pannello con "viti" agli angoli, centrato sull'origine. */
export function signPanel(w: number, h: number): Graphics {
  const g = new Graphics({ roundPixels: true });
  g.rect(-w / 2, -h / 2, w, h).fill({ color: 0xd0d0d0 }).stroke({ color: 0x080808, width: 2, pixelLine: true });
  const corners = [
    [-w / 2 + 6, -h / 2 + 6], [w / 2 - 11, -h / 2 + 6],
    [-w / 2 + 6, h / 2 - 11], [w / 2 - 11, h / 2 - 11],
  ];
  for (const [x, y] of corners) {
    g.rect(x, y, 5, 5).fill({ color: 0x666666 });
    g.rect(x + 1, y + 1, 3, 1).fill({ color: 0xd8d8d8 });
  }
  return g;
}