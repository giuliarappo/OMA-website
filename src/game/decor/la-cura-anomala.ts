import { Assets, Sprite, Texture } from "pixi.js";
import type { Decor, IconItem } from "../rooms";




export function iconsDecor(items: IconItem[]): Decor[] {
  return items.flatMap((item) => {
    const img = Assets.get<Texture>(item.src);
    if (!img) {
      console.warn("[decor] texture non caricata:", item.src);
      return [];
    }
    const sprite = new Sprite(img);
    sprite.anchor.set(0.5, 1);                                   // origine al centro in basso
    if (item.height) sprite.scale.set(item.height / img.height);
    sprite.position.set(item.x, item.y);
    return [{ view: sprite }];
  });
}