import { Application, Assets, Container, Ticker } from "pixi.js";
import { drawPlatforms, setBackdrop, type Rect } from "./utils_graphics";
import { Door, DOOR_WIDTH } from "./Door";
import { Player, PLAYER_HEIGHT, PLAYER_WIDTH, type InputState } from "./Player";
import type { Decor, DecorContext, RoomConfig, ViewInfo } from "./rooms";
import { playGameSound, playLandSound, startWalkSound, stopWalkSound } from "./lib/gameAudio";

const lastDoorUsed = new Map<string, string>();

export class Game {
  private app = new Application();
  private world = new Container();
  private elapsed = 0;

  private room: RoomConfig;
  private platforms: Rect[];
  private player: Player;
  private doors: Door[] = [];
  private decor: Decor[] = [];
  private keys: InputState = { left: false, right: false, jump: false };

  private cameraX = 0;
  private cameraY = 0;
  private lastW = 0;
  private lastH = 0;

  private ready = false;
  private destroyed = false;
  private leaving = false;

  private host: HTMLElement;
  private onEnterDoor?: (target: string) => void;
  private onEvent?: (name: string, payload?: unknown) => void;

  constructor(
    host: HTMLElement,
    room: RoomConfig,
    onEnterDoor?: (target: string) => void,
    onEvent?: (name: string, payload?: unknown) => void,
  ) {
    this.host = host;
    this.room = room;
    this.onEnterDoor = onEnterDoor;
    this.onEvent = onEvent;
    this.platforms = room.platforms;

    this.player = new Player(room.spawn, {
      width: room.worldWidth,
      height: room.worldHeight,
    });
    const fallTarget = room.fallTarget;
    if (fallTarget) this.player.onFall = () => this.leave(fallTarget);
    this.player.onJump = () => playGameSound("jump");
    this.player.onLand = () => playGameSound("impatto");
  }

  // ---------- ciclo di vita ----------

  async init() {
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    await this.app.init({
      resizeTo: this.host,
      background: 0x080808,
      antialias: false,
      resolution: pixelRatio,
      autoDensity: true,
      preference: "webgl",
      eventFeatures: { move: true, globalMove: false, wheel: false, click: true },
    });

    // Tutto ciò che serve prima di costruire la scena. Il font va caricato prima
    // di creare i Text, altrimenti vengono misurati col fallback e il centraggio sballa.
    try {
      await Promise.all([
        Door.loadAssets(),
        this.room.assets?.length ? Assets.load(this.room.assets) : undefined,
        document.fonts?.load('12px "Press Start 2P"').catch(() => undefined),
      ]);
    } catch (err) {
      console.warn("[Game] caricamento asset fallito:", err);
    }

    // Se il componente è stato smontato mentre aspettavamo (StrictMode)
    if (this.destroyed) {
      this.app.destroy(true, { children: true });
      return;
    }

    this.ready = true;
    this.host.appendChild(this.app.canvas);
    this.buildWorld();
    this.bindInput();
    this.app.stage.addChild(this.world);
    this.app.ticker.add(this.update);
  }

  destroy() {
    this.destroyed = true;
    stopWalkSound();
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    if (!this.ready) return; // ci pensa init() a ripulire
    this.app.ticker.remove(this.update);
    this.app.destroy(true, { children: true });
  }

  // ---------- costruzione della scena ----------

  private buildWorld() {
    const { worldWidth, worldHeight, doors, spawn } = this.room;

    const ctx: DecorContext = {
      player: this.player,
      emit: (name, payload) => this.onEvent?.(name, payload),
      navigate: (target) => this.leave(target),
    };
    this.decor = this.room.decor?.(ctx) ?? [];
    const layer = (l: "back" | "front") =>
      this.decor.filter((d) => (d.layer ?? "back") === l);

    // Dal fondo in su: sfondo, decori dietro, piattaforme, porte, giocatore, decori davanti
    this.world.addChild(setBackdrop(worldHeight, worldWidth));
    layer("back").forEach((d) => this.world.addChild(d.view));
    this.world.addChild(drawPlatforms(this.platforms));

    this.doors = doors.map(
      (d) =>
        new Door(this.platforms[d.platformIndex], {
          target: d.target,
          kind: d.kind,
          x: d.x,
          spawnX: spawn.x,
          label: d.label
        }),
    );
    this.doors.forEach((d) => this.world.addChild(d.view));

    // Ritorno da un'altra stanza: riappari accanto alla porta da cui eri uscito
    const back = lastDoorUsed.get(this.room.id);
    const idx = back
      ? this.room.doors.findIndex((d) => d.kind !== "exit" && d.target === back)
      : -1;
    if (idx >= 0) this.placeBesideDoor(this.doors[idx], this.platforms[this.room.doors[idx].platformIndex]);

    this.world.addChild(this.player.view);
    layer("front").forEach((d) => this.world.addChild(d.view));

    this.relayout();
    this.snapCamera();
  }

    private placeBesideDoor(door: Door, platform: Rect) {
        // A destra della porta, fuori dal raggio in cui si accende il glow...
        let x = door.bounds.x + DOOR_WIDTH + 24;
        // ...ma sempre sopra la piattaforma, anche se la porta è vicina al bordo
        if (x + PLAYER_WIDTH > platform.x + platform.w) x = door.bounds.x - PLAYER_WIDTH - 24;
        x = Math.max(platform.x, Math.min(platform.x + platform.w - PLAYER_WIDTH, x));

        this.player.moveTo(x, platform.y - PLAYER_HEIGHT);
    }
  // ---------- input ----------

  private bindInput() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.repeat) {
      this.preventIfGameKey(e);
      return;
    }
    this.setKeyFromEvent(e, true);
  };
  private onKeyUp = (e: KeyboardEvent) => this.setKeyFromEvent(e, false);

  // Alt-tab con un tasto premuto: senza questo il personaggio "corre da solo"
  private onBlur = () => {
    this.keys.left = this.keys.right = this.keys.jump = false;
  };

  private preventIfGameKey(e: KeyboardEvent) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(e.code)) e.preventDefault();
  }

  private setKeyFromEvent(e: KeyboardEvent, pressed: boolean) {
    this.preventIfGameKey(e);
    if (e.code === "ArrowLeft") this.keys.left = pressed;
    if (e.code === "ArrowRight") this.keys.right = pressed;
    if (e.code === "Space" || e.code === "ArrowUp") this.keys.jump = pressed;
  }

  /** Per i pulsanti touch: game.setKey("left", true) */
  setKey(key: "left" | "right" | "jump", pressed: boolean) {
    this.keys[key] = pressed;
  }

  private playFallSound() {
    const ground = this.room.groundY;
    if (ground === undefined) return;
    const p = this.player;
    if (p.y + PLAYER_HEIGHT > ground && p.vy > 0) {
        playGameSound("fall");
    }
  }

  updateWalkSound() {
    const walking = this.keys.left !== this.keys.right;
    if (walking && this.player.grounded) startWalkSound();
    else stopWalkSound();
  }

  // ---------- loop ----------

  private update = (ticker: Ticker) => {
    if (this.leaving) return;

    const dt = Math.min(ticker.deltaMS / 1000, 0.033);
    this.elapsed += dt;

    // Ridisponi i decori solo quando cambia la dimensione dello schermo
    const { width, height } = this.app.screen;
    if (width !== this.lastW || height !== this.lastH) this.relayout();

    this.decor.forEach((d) => d.update?.(this.elapsed, dt));

    this.updateWalkSound()
    if (this.updateDoors(dt)) return; // sei entrato in una porta: niente salto
    this.player.update(dt, this.keys, this.platforms);
    this.player.update(dt, this.keys, this.platforms);
    this.playFallSound();
    this.updateCamera(dt);
  };

  // Ritorna true se il personaggio è entrato in una porta
  private updateDoors(dt: number): boolean {
    const rect = this.player.rect;
    for (const door of this.doors) {
      const near = door.isNear(rect);
      door.update(this.elapsed, dt, near);
      if (near && this.keys.jump && this.player.grounded) {
        playGameSound("door")
        if (door.target) {
            if (door.kind !== "exit") lastDoorUsed.set(this.room.id, door.target);
                this.leave(door.target);
        }
        return true;
      }
    }
    return false;
  }

  // Una sola navigazione per stanza (con jump premuto, senza questo
  // verrebbe chiamata a ogni frame finché React non smonta)
  private leave(target: string) {
    if (this.leaving) return;
    this.leaving = true;
    stopWalkSound();
    this.onEnterDoor?.(target);
  }

  // ---------- vista e camera ----------

  // Lo zoom del vecchio hub: considera anche la larghezza e ingrandisce sui telefoni
  private computeZoom(w: number, h: number) {
    const base = Math.min(h / 560, w / 640);
    const isPhone = Math.min(w, h) <= 600; // vale sia in verticale sia in orizzontale
    return Math.max(0.45, Math.min(2, base * (isPhone ? 1.5 : 1)));
  }

  private getView(): ViewInfo {
    const { width, height } = this.app.screen;
    const zoom = this.computeZoom(width, height);
    return { zoom, w: width / zoom, h: height / zoom, screenW: width, screenH: height };
  }

  private relayout() {
    const view = this.getView();
    this.lastW = view.screenW;
    this.lastH = view.screenH;
    this.decor.forEach((d) => d.layout?.(view));
  }

  private clampCamera(viewW: number, viewH: number) {
    const { worldWidth, worldHeight } = this.room;
    // Se il mondo è più piccolo della vista lo centra, altrimenti clampa ai bordi
    this.cameraX =
      worldWidth <= viewW
        ? (worldWidth - viewW) / 2
        : Math.max(0, Math.min(worldWidth - viewW, this.cameraX));
    this.cameraY =
      worldHeight <= viewH
        ? (worldHeight - viewH) / 2
        : Math.max(0, Math.min(worldHeight - viewH, this.cameraY));
  }

  private applyCamera(zoom: number) {
    this.world.scale.set(zoom);
    this.world.position.set(
      Math.round(-this.cameraX * zoom),
      Math.round(-this.cameraY * zoom),
    );
  }

  // Posiziona subito la camera sul giocatore (evita lo scivolamento iniziale da x = 0)
  private snapCamera() {
    const { zoom, w, h } = this.getView();
    this.cameraX = this.player.x - w * 0.35;
    this.cameraY = this.player.y - h * 0.58;
    this.clampCamera(w, h);
    this.applyCamera(zoom);
  }

  private updateCamera(dt: number) {
    const p = this.player;
    const { zoom, w: viewW, h: viewH } = this.getView();

    // Segue il giocatore con un po' di morbidezza
    const k = Math.min(1, dt * 5);
    this.cameraX += (p.x - viewW * 0.35 - this.cameraX) * k;
    this.cameraY += (p.y - viewH * 0.58 - this.cameraY) * k;

    this.clampCamera(viewW, viewH);
    this.applyCamera(zoom);
  }
}