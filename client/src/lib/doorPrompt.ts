import { Container, Graphics, Sprite, Texture } from "pixi.js";
import { playDoorActivationSound } from "@/lib/gameAudio";

export const DOOR_PROMPT_ASSET = "/assets/IconaPressUppxart_a6a51b41.png";
export const DOOR_PROMPT_WIDTH = 42;
export const DOOR_PROMPT_MOBILE_WIDTH = 36;
export const DOOR_PROXIMITY = 86;
const activeDoorGlows = new WeakMap<Container, boolean>();

export function createDoorGlow(x: number, y: number, width: number, height: number) {
  const door = new Graphics({ label: "door", roundPixels: true });
  door.rect(-3, -2, width + 6, height + 4).fill({ color: 0xf4f8fa, alpha: 1 });
  door.rect(5, 5, width - 10, height - 10).fill({ color: 0x20252a, alpha: 1 });
  door.rect(8, 8, width - 16, 3).fill({ color: 0xffffff, alpha: 1 });

  const halo = new Graphics({ label: "door-proximity-glow", roundPixels: true });
  halo.rect(-16, -12, width + 32, height + 24).fill({ color: 0xbfc7d0, alpha: 0.08 });
  halo.rect(-9, -7, width + 18, height + 14).fill({ color: 0xdde7ef, alpha: 0.14 });
  halo.position.set(0, 0);
  halo.alpha = 0;

  const glow = new Container({ label: "door-with-proximity-glow" });
  glow.addChild(halo, door);
  glow.position.set(x, y);
  activeDoorGlows.set(glow, false);
  return glow;
}

export function createDoorPrompt(texture: Texture, x: number, y: number, doorWidth: number, doorHeight: number) {
  const prompt = new Sprite(texture);
  const promptWidth = typeof window !== "undefined" && window.innerWidth <= 700
    ? DOOR_PROMPT_MOBILE_WIDTH
    : DOOR_PROMPT_WIDTH;
  prompt.label = "door-proximity-prompt";
  prompt.anchor.set(0.5, 1);
  prompt.width = promptWidth;
  prompt.height = promptWidth * (texture.height / texture.width);
  prompt.position.set(x + doorWidth / 2, y - 10);
  prompt.visible = false;
  return prompt;
}

export function createDoorPromptLayer() {
  return new Container({ label: "door-proximity-prompts" });
}

export function setDoorPromptVisible(prompt: Sprite, visible: boolean, elapsed: number) {
  prompt.visible = visible;
  if (visible) {
    prompt.alpha = 0.78 + Math.sin(elapsed * 5) * 0.22;
  }
}

export function setDoorGlowVisible(glow: Container, visible: boolean, elapsed: number) {
  const wasVisible = activeDoorGlows.get(glow) ?? false;
  if (visible && !wasVisible) playDoorActivationSound();
  activeDoorGlows.set(glow, visible);
  glow.visible = true;
  const halo = glow.getChildByLabel("door-proximity-glow");
  if (halo) {
    halo.visible = true;
    halo.alpha = visible ? 0.78 + Math.sin(elapsed * 3) * 0.16 : 0;
  }
}
