import { Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from "pixi.js";
import type { Decor, ViewInfo } from "../rooms";
import { signPanel, type Rect } from "../utils_graphics";
import { PLAYER_SPAWN_X } from "../Player";

export const HERO_DESKTOP = "/assets/OMA_Hero.png";
export const HERO_MOBILE = "/assets/OMA_Hero.png";

const FONT = "Press Start 2P, monospace";
const HERO_MAX_SCALE = 0.8;   // com'è oggi a schermo

/** Asse comune: centro della parte di piattaforma visibile all'avvio. */
function introAxis(v: ViewInfo, platform: Rect) {
  const right = Math.min(platform.x + platform.w, v.w);   // la camera parte da x = 0
  return { cx: (platform.x + right) / 2, width: right - platform.x };
}

export function openingHero(platform: Rect): Decor {
  const sprite = new Sprite();            // texture vuota finché non arriva quella vera
  sprite.anchor.set(0.5, 1);              // origine al centro in basso
  sprite.visible = false;

  let token = 0;                          // scarta risposte vecchie dopo un resize

  return {
    view: sprite,
    layout(v) {
      const url = v.screenW <= 700 ? HERO_MOBILE : HERO_DESKTOP;
      const mine = ++token;

      Assets.load<Texture>(url).then((tex) => {
        if (mine !== token || sprite.destroyed) return;

        sprite.texture = tex;
        const { cx, width } = introAxis(v, platform);
        const maxH = v.h * 0.6 - 40;
        sprite.scale.set(
          Math.min(HERO_MAX_SCALE, (width * 0.9) / tex.width, maxH / tex.height),
        );
        sprite.position.set(Math.round(cx), platform.y - 40);
        sprite.visible = true;
      });
    },
  };
}

/** Scritta + bottone, disegnati sulla "faccia" frontale della piattaforma. */
export function offerButton(platform: Rect, onClick: () => void): Decor {
  const BTN_H = 50;
  const view = new Container({ label: "offer-button" });

  const hint = new Text({
    text: "NON HAI TEMPO PER GIOCARE?",
    style: { fontFamily: FONT, fontSize: 12, fill: 0x555555 },
  });
  hint.anchor.set(0.5, 0);

  const button = new Container();
  const shadow = new Graphics();
  const face = new Graphics();
  const title = new Text({ text: "CONTATTACI", style: { fontFamily: FONT, fontSize: 16, fill: 0x555555 } });
  title.anchor.set(0.5);
  const diamond = new Text({ text: "◆", style: { fontFamily: "monospace", fontSize: 10, fill: 0xaaaaaa } });
  diamond.anchor.set(0.5);
  button.addChild(shadow, face, diamond, title);
  button.eventMode = "static";
  button.cursor = "pointer";
  button.on("pointertap", onClick);
  view.addChild(hint, button);
  let istruzioniImg = Assets.get<Texture>("/assets/istruzioni.png")
  let instruzioni = new Sprite(istruzioniImg)
  instruzioni.position.set(PLAYER_SPAWN_X, 650);
  view.addChild(instruzioni);

  let w = 220;
  let hovered = false;

  const draw = () => {
    shadow.clear().rect(4, 4, w, BTN_H).fill({ color: 0x000000, alpha: 0.6 });
    face.clear().rect(0, 0, w, BTN_H).fill({ color: hovered ? 0x101010 : 0xbebdbd });
    title.style.fill = hovered ? 0xf2f2f2 : 0x555555;
    diamond.style.fill = hovered ? 0xf2f2f2 : 0xaaaaaa;
    title.scale.set(1);
    title.scale.set(Math.min(1, (w - 56) / title.width));
    title.position.set(Math.round(w / 2), Math.round(BTN_H / 2));
    diamond.visible = w >= 200;
    diamond.position.set(22, BTN_H / 2);
    button.hitArea = new Rectangle(0, 0, w, BTN_H);
    button.pivot.x = w / 2;                       // il bottone è centrato sull'asse
  };
  button.on("pointerover", () => { hovered = true; draw(); });
  button.on("pointerout", () => { hovered = false; draw(); });

  return {
    view,
    layer: "front",
    layout(v) {
      const { cx, width } = introAxis(v, platform);
      w = Math.min(220, Math.floor(width * 0.9));
      hint.scale.set(1);
      hint.scale.set(Math.min(1, (width * 0.95) / hint.width));   // mai più largo dello schermo
      hint.position.set(0, platform.y + 6);
      button.position.set(0, platform.y + 22);
      view.position.set(Math.round(cx), 0);
      draw();
    },
  };
}

/** Cartello appoggiato sulla piattaforma, centrato su di essa. */
export function creditsSign(text: string, platform: Rect): Decor {
  const label = new Text({
    text,
    style: { fontFamily: "monospace", fontSize: 13, fill: 0x080808, letterSpacing: 2, lineHeight: 21, align: "center" },
  });
  label.anchor.set(0.5);

  const w = Math.ceil(label.width) + 48;
  const h = Math.ceil(label.height) + 36;
  const view = new Container({ label: "credits" });
  view.addChild(signPanel(w, h), label);
  view.position.set(
    Math.round(platform.x + platform.w / 2),
    Math.round(platform.y - 16 - h / 2),
  );
  return { view };
}