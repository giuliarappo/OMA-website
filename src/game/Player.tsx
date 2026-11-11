import { Graphics } from "pixi.js";
import { overlaps, type Rect } from "./utils_graphics";

export const PLAYER_WIDTH = 24;
export const PLAYER_HEIGHT = 48;
export const PLAYER_SPAWN_X = 100;

const GRAVITY = 1500;
const WALK_SPEED = 250;
const JUMP_SPEED = 700;

export type InputState = { left: boolean; right: boolean; jump: boolean };
type Facing = 1 | -1;


// Solo disegno: swing = oscillazione delle braccia, legSwing = delle gambe
function drawPlayer(g: Graphics, swing: number, legSwing: number, facing: Facing) {
  g.clear();
  g.rect(2, 2, 20, 44).fill({ color: 0x050505 });
  g.rect(6, 6, 14, 12).fill({ color: 0xffffff }).stroke({ color: 0x050505, width: 2, pixelLine: true });
  g.rect(6, 2, 14, 5).fill({ color: 0xd0d0d0 });
  g.rect(facing === 1 ? 17 : 0, 6, 8, 3).fill({ color: 0xffffff });
  g.rect(facing === 1 ? 15 : 6, 10, 3, 3).fill({ color: 0x080808 });
  g.rect(facing === 1 ? 9 : 15, 10, 3, 3).fill({ color: 0x080808 });
  g.rect(6, 18, 14, 14).fill({ color: 0xf2f2f2 }).stroke({ color: 0x050505, width: 2, pixelLine: true });

  const frontArm = facing === 1 ? 19 : 0;
  const backArm = facing === 1 ? 0 : 19;
  g.rect(backArm, 20, 5, 8).fill({ color: 0xd0d0d0 });
  g.rect(backArm + (facing === 1 ? -swing : swing), 27, 5, 6).fill({ color: 0xc0c0c0 });
  g.rect(frontArm, 20, 5, 8).fill({ color: 0xd0d0d0 });
  g.rect(frontArm + (facing === 1 ? swing : -swing), 27, 5, 6).fill({ color: 0xc0c0c0 });

  g.rect(7, 31, 5, 8).fill({ color: 0xffffff });
  g.rect(7 + legSwing, 38, 5, 8).fill({ color: 0xd8d8d8 });
  g.rect(13, 31, 5, 8).fill({ color: 0xffffff });
  g.rect(13 - legSwing, 38, 5, 8).fill({ color: 0xd8d8d8 });
  g.rect(facing === 1 ? 10 + legSwing : 4 + legSwing, 44, 8, 3).fill({ color: 0xffffff });
  g.rect(facing === 1 ? 16 - legSwing : 10 - legSwing, 44, 8, 3).fill({ color: 0xffffff });
  g.zIndex = 1;
}

export class Player {
  readonly view = new Graphics({ label: "player", roundPixels: true });

  x: number;
  y: number;
  vx = 0;
  vy = 0;
  grounded = true;
  onFall?: () => void;
  onJump?: () => void;
  onLand?: () => void;

  private spawn: { x: number; y: number };
  private world: { width: number; height: number };
  private facing: Facing = 1;
  private time = 0;            // per l'animazione del passo
  private jumpLocked = false;  // un salto per ogni pressione del tasto
  private drawnKey = "";       // evita di ridisegnare se la posa non cambia
  private isFalling = false;

  constructor(
    spawn: { x: number; y: number },
    world: { width: number; height: number },
  ) {
    this.spawn = spawn;
    this.world = world;
    this.x = spawn.x;
    this.y = spawn.y;
    this.render();
  }

  /** Rettangolo del personaggio (per porte e collisioni). */
  get rect(): Rect {
    return { x: this.x, y: this.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT };
  }

  respawn() {
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.vx = 0;
    this.vy = 0;
    this.jumpLocked = false;
    this.isFalling = false;
  }

  update(dt: number, input: InputState, platforms: Rect[]) {
    this.time += dt;
    const wasGrounded = this.grounded;
    // Movimento orizzontale con un po' di inerzia
    const direction = Number(input.right) - Number(input.left);
    this.vx += (direction * WALK_SPEED - this.vx) * Math.min(1, dt * 12);
    if (direction !== 0) this.facing = direction > 0 ? 1 : -1;

    // Salto
    if (input.jump && this.grounded && !this.jumpLocked) {
      this.vy = -JUMP_SPEED;
      this.grounded = false;
      this.jumpLocked = true;
      this.onJump?.();
    }
    if (!input.jump) this.jumpLocked = false;

    this.vy += GRAVITY * dt;

    const previousBottom = this.y + PLAYER_HEIGHT;
    this.x += this.vx * dt;
    this.x = Math.max(0, Math.min(this.world.width - PLAYER_WIDTH, this.x));
    this.y += this.vy * dt;
    this.grounded = false;

    // Si atterra sulle piattaforme solo dall'alto
    if (this.vy >= 0) {
      for (const platform of platforms) {
        if (previousBottom <= platform.y && overlaps(this.rect, platform)) {
          this.y = platform.y - PLAYER_HEIGHT;
          this.vy = 0;
          this.grounded = true;
          if (!wasGrounded) this.onLand?.();
          break;
        }
      }
    }
    if (!this.isFalling && this.y > 650) {
      this.onFall?.();
      this.isFalling = true;
    }
    
    // Caduto fuori dal mondo: riparte dallo spawn
    if (this.y > this.world.height + 120) this.respawn();

    this.render();
  }

  // Aggiorna posizione e posa sullo schermo
  private render() {
    const moving = Math.abs(this.vx) > 12;
    const phase = moving ? this.time * 10 : 0;
    const swing = Math.round(Math.sin(phase) * 4);
    const legSwing = Math.round(Math.sin(phase) * 3);

    const key = `${swing}|${legSwing}|${this.facing}`;
    if (key !== this.drawnKey) {
      
      this.drawnKey = key;
      drawPlayer(this.view, swing, legSwing, this.facing);
    }

    this.view.position.set(Math.round(this.x), Math.round(this.y));
  }

    moveTo(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.render();
    }
}