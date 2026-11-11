import { Assets, Container, Graphics, Sprite, Texture, Text } from "pixi.js";
import { signPanel, type Rect } from "./utils_graphics";
import { PLAYER_SPAWN_X } from "./Player";

export const DOOR_WIDTH = 48;
export const DOOR_HEIGHT = 72;

export const DOOR_PROMPT_ASSET = "/assets/door-prompt.png";

const PROMPT_WIDTH = 28;
const PROMPT_GAP = 10;

const SIGN_BOTTOM = 56;
const SIGN_HEIGHT = 40;
const SIGN_MAX_TEXT = 200;

type DoorKind = "platform" | "exit";

type DoorOptions = {
  kind?: DoorKind;
  target?: string;
  x?: number;      
  spawnX?: number;
	label?: string;
};

export class Door {
  // Texture condivisa da tutte le porte: si carica una volta sola
  private static promptTexture: Texture | null = null;
  onPlayerNear?: () => void;
  wasNear: boolean = false;

  static async loadAssets() {
    if (Door.promptTexture) return;
    try {
      const texture = await Assets.load<Texture>(DOOR_PROMPT_ASSET);
      texture.source.scaleMode = "nearest"; // pixel art nitida
      Door.promptTexture = texture;
    } catch {
      console.warn("[Door] immagine della freccia non trovata:", DOOR_PROMPT_ASSET);
    }
  }

  readonly view = new Container();
  readonly bounds: Rect;
  readonly target?: string;
	readonly kind: DoorKind;

  private glow = new Graphics();
  private frame = new Graphics();
  private prompt: Sprite | null = null;

  private amount = 0;       // 0 = spenta, 1 = evidenziata (per la dissolvenza)
  private isLit = false;

  constructor(platform: Rect, options: DoorOptions = {}) {

		
    const { kind = "platform", target, spawnX = PLAYER_SPAWN_X } = options;
		this.target = target;

		const y = platform.y - DOOR_HEIGHT;
		const x = options.x ?? (kind === "exit" ? this.exitX(platform, spawnX) : this.platformX(platform));

    this.bounds = { x, y, w: DOOR_WIDTH, h: DOOR_HEIGHT };
		this.kind = kind;
    this.view.position.set(x, y);

    // Ordine: alone dietro, porta, freccia davanti
    this.view.addChild(this.glow, this.frame);
    this.drawGlow();
    this.drawFrame(false);

		const text = options.label ?? (kind === "exit" ? "Uscita" : undefined);
		if (text) this.addSign(text);

    if (Door.promptTexture) {
      const arrow = new Sprite(Door.promptTexture);
      arrow.anchor.set(0.5, 1); // origine al centro in basso
      arrow.scale.set(PROMPT_WIDTH / Door.promptTexture.width);
      arrow.position.set(DOOR_WIDTH / 2, -PROMPT_GAP);
      arrow.alpha = 0;
      this.view.addChild(arrow);
      this.prompt = arrow;
    }
  }

  private platformX(platform: Rect) {
    const center = platform.x + platform.w / 2;
    return Math.round(center - DOOR_WIDTH / 2 - platform.w * 0.12);
  }

  private exitX(platform: Rect, spawnX: number) {
  	return Math.max(platform.x + 8, spawnX - DOOR_WIDTH - 20);
	}

	private addSign(label: string) {
		const text = new Text({
			text: label,
			style: { fontFamily: '"Press Start 2P", monospace', fontSize: 12, fill: 0x080808 },
		});
		text.anchor.set(0.5);
		if (text.width > SIGN_MAX_TEXT) text.scale.set(SIGN_MAX_TEXT / text.width); // testi lunghi: rimpiccioliti

		const w = Math.ceil(text.width) + 32;
		const sign = new Container({ label: "door-sign" });
		sign.addChild(signPanel(w, SIGN_HEIGHT), text);
		sign.position.set(DOOR_WIDTH / 2, Math.round(-SIGN_BOTTOM - SIGN_HEIGHT / 2));
		this.view.addChild(sign);
	}

  isNear(player: Rect) {
    const dx = Math.abs(player.x + player.w / 2 - (this.bounds.x + this.bounds.w / 2));
    const dy = Math.abs(player.y + player.h - (this.bounds.y + this.bounds.h));
    return dx < 60 && dy < 40;
  }

  /** Da chiamare a ogni frame. time = secondi totali, dt = secondi dall'ultimo frame. */
  update(time: number, dt: number, near: boolean) {
    if (near && !this.wasNear) this.onPlayerNear?.();
    this.wasNear = near;
    // Dissolvenza morbida verso acceso/spento

    const target = near ? 1 : 0;
    this.amount += (target - this.amount) * Math.min(1, dt * 10);
    if (Math.abs(target - this.amount) < 0.01) this.amount = target;

    const pulse = 0.5 + 0.5 * Math.sin(time * 4); // oscilla tra 0 e 1

    // Alone: visibile solo da acceso, pulsa in intensità e dimensione
    this.glow.visible = this.amount > 0;
    this.glow.alpha = this.amount * (0.55 + 0.45 * pulse);
    this.glow.scale.set(1 + 0.05 * pulse);

    // Freccia: appare con la dissolvenza e fluttua su e giù
    if (this.prompt) {
      this.prompt.alpha = this.amount;
      this.prompt.y = -PROMPT_GAP + Math.sin(time * 5) * 3;
    }

    // Ridisegna la porta solo quando cambia stato
    const lit = this.amount > 0.5;
    if (lit !== this.isLit) {
      this.isLit = lit;
      this.drawFrame(lit);
    }
  }

  private drawFrame(lit: boolean) {
    const g = this.frame;
    g.clear();
    g.rect(0, 0, DOOR_WIDTH, DOOR_HEIGHT).fill({ color: lit ? 0xffffff : 0xdde6ea });
    g.rect(6, 6, DOOR_WIDTH - 12, DOOR_HEIGHT - 6).fill({ color: 0x1b2027 });
    g.rect(12, 12, DOOR_WIDTH - 24, 3).fill({ color: 0xf2f2f2 });
  }

  // Alone: rettangoli concentrici sempre più grandi e trasparenti
  private drawGlow() {
    const g = this.glow;
    g.clear();
    const layers = 3;
    for (let i = layers; i >= 1; i--) {
      const grow = i * 4;
      g.rect(-grow, -grow, DOOR_WIDTH + grow * 2, DOOR_HEIGHT + grow * 2)
        .fill({ color: 0xffffff, alpha: 0.2 });
    }
    // Il pivot al centro fa sì che la pulsazione si espanda in tutte le direzioni
    g.pivot.set(DOOR_WIDTH / 2, DOOR_HEIGHT / 2);
    g.position.set(DOOR_WIDTH / 2, DOOR_HEIGHT / 2);
  }

	
}

