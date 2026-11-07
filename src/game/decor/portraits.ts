import { Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import type { Decor, DecorContext } from "../rooms";
import type { Member } from "../team";

const SIZE = 99;          // lato della cornice (150 * 0.66 del vecchio codice)
const CUE_RADIUS = 220;
const CUE_TIME = 1.25;

export function pit(x: number, y: number, w: number, h = 80): Decor {
  const g = new Graphics();
  g.rect(x, y, w, h).fill({ color: 0x020202 });
  g.rect(x, y, w, 3).fill({ color: 0x555555 });
  return { view: g };
}

export function portraitWall(
  members: Member[],
  at: { x: number; y: number; spacing: number },
  ctx: DecorContext,
): Decor {
  const view = new Container({ label: "portrait-wall" });
  const centers = members.map((_, i) => ({ x: at.x + i * at.spacing + SIZE / 2, y: at.y + SIZE / 2 }));

  members.forEach((m, i) => {
    const frame = new Container({ label: `portrait-${m.id}` });
    frame.position.set(at.x + i * at.spacing, at.y);

    const g = new Graphics({ roundPixels: true });
    g.rect(0, 0, SIZE, SIZE).fill({ color: 0xd0d0d0 }).stroke({ color: 0x777777, width: 2, pixelLine: true });
    g.rect(6, 6, SIZE - 12, SIZE - 12).fill({ color: 0x111111 });
    g.rect(9, 82, 81, 8).fill({ color: 0xd0d0d0 });            // striscia della didascalia

    const photo = new Sprite(Assets.get<Texture>(m.thumb));
    photo.position.set(9, 9);
    photo.width = 81;
    photo.height = 73;

    const name = new Text({
      text: m.name.toUpperCase(),
      style: { fontFamily: "monospace", fontSize: 7, fill: 0x181818, letterSpacing: 0.25 },
    });
    name.anchor.set(0.5);
    name.position.set(SIZE / 2, 86);

    frame.addChild(g, photo, name);
    frame.eventMode = "static";
    frame.cursor = "pointer";
    frame.hitArea = new Rectangle(0, 0, SIZE, SIZE);
    frame.on("pointertap", () => ctx.emit("portrait", m.id));
    view.addChild(frame);
  });

  // Cornice che evidenzia il ritratto più vicino al giocatore
  const cue = new Graphics({ roundPixels: true });
  cue.rect(-53, -53, 106, 106).stroke({ color: 0xffffff, width: 2, pixelLine: true });
  cue.rect(-49, -49, 98, 98).stroke({ color: 0xa6a6a6, width: 1, pixelLine: true });
  cue.visible = false;
  view.addChild(cue);

  let nearest = -1;
  let glow = 0;

  return {
    view,
    update(_time, dt) {
      const p = ctx.player.rect;
      const px = p.x + p.w / 2;
      const py = p.y + p.h / 2;

      let best = -1;
      let bestDist = CUE_RADIUS;
      centers.forEach((c, i) => {
        const d = Math.hypot(px - c.x, py - c.y);
        if (d < bestDist) { bestDist = d; best = i; }
      });

      if (best !== nearest) { nearest = best; glow = best >= 0 ? CUE_TIME : 0; }
      glow = Math.max(0, glow - dt);

      cue.visible = best >= 0;
      if (best >= 0) {
        cue.position.set(centers[best].x, centers[best].y);
        const t = 1 - glow / CUE_TIME;
        cue.alpha = 0.5 + 0.5 * (t < 0.42 ? Math.sin((t / 0.42) * Math.PI) : 0);
      }
    },
  };
}