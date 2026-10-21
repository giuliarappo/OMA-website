import { useEffect, useRef } from "react";
import { Application, Assets, Container, Graphics, Text, TextStyle, Ticker, Texture } from "pixi.js";
import { useLocation } from "wouter";
import { playGameSound } from "@/lib/gameAudio";
import { addFixedHomeButton, HOME_BUTTON_OFF_ASSET, HOME_BUTTON_ON_ASSET } from "@/lib/homeButton";
import { createDoorGlow, createDoorPrompt, DOOR_PROMPT_ASSET, setDoorGlowVisible, setDoorPromptVisible } from "@/lib/doorPrompt";

type InputState = { left: boolean; right: boolean; jump: boolean };
type HubDoor = { x: number; label: string; route: string; returnToHub?: boolean };

const WORLD_HEIGHT = 900;
const BASE_Y = 650;
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 48;
const DOOR_WIDTH = 48;
const DOOR_HEIGHT = 72;
const WALK_SPEED = 250;
const GRAVITY = 1500;
const JUMP_SPEED = 700;

// Add future rooms here: the hub will draw a new door and route automatically.
const HUB_ROOM_DEFINITIONS = [
  { label: "Cura anomala", route: "/room-01", returnToHub: true },
  { label: "Sala dei sette", route: "/room-02", returnToHub: true },
  { label: "Documentazione", route: "/room-03", returnToHub: true },
];

function getHubDoors(worldWidth: number): HubDoor[] {
  const sideMargin = Math.max(DOOR_WIDTH, worldWidth * 0.15);
  const spacing = (worldWidth - sideMargin * 2 - DOOR_WIDTH) / 2;
  return HUB_ROOM_DEFINITIONS.map((room, index) => ({
    ...room,
    x: sideMargin + index * spacing,
  }));
}

function drawSurface(g: Graphics, worldWidth: number) {
  g.rect(0, BASE_Y, worldWidth, 80).fill({ color: 0xf2f2f2 });
  g.rect(0, BASE_Y, worldWidth, 5).fill({ color: 0xffffff });
  g.rect(0, BASE_Y + 74, worldWidth, 6).fill({ color: 0x8a8a8a });
  for (let x = 12; x < worldWidth - 8; x += 28) g.rect(x, BASE_Y + 13, 11, 4).fill({ color: 0xbcbcbc, alpha: 0.75 });
}

function drawDoor(g: Graphics, x: number) {
}

function makeHubWorld(worldWidth: number, hubDoors: HubDoor[]) {
  const world = new Container({ label: "hub-world" });
  const bg = new Graphics({ label: "hub-backdrop" });
  bg.rect(0, 0, worldWidth, WORLD_HEIGHT).fill({ color: 0x080808 });
  for (let x = 0; x < worldWidth; x += 96) bg.rect(x, 0, 1, WORLD_HEIGHT).fill({ color: 0x191919 });
  for (let y = 0; y < WORLD_HEIGHT; y += 96) bg.rect(0, y, worldWidth, 1).fill({ color: 0x151515 });
  bg.rect(0, BASE_Y, worldWidth, 2).fill({ color: 0x343434 });
  world.addChild(bg);

  const structures = new Graphics({ label: "hub-structures", roundPixels: true });
  drawSurface(structures, worldWidth);
  hubDoors.forEach((door) => drawDoor(structures, door.x));
  world.addChild(structures);

  const signStyle = new TextStyle({ fontFamily: "Press Start 2P, monospace", fontSize: 8, fill: 0x111111, letterSpacing: 0, align: "center" });
  hubDoors.forEach((door) => {
    const signW = Math.max(110, door.label.length * 7 + 22);
    const signX = Math.max(4, Math.min(worldWidth - signW - 4, door.x + DOOR_WIDTH / 2 - signW / 2));
    const signY = BASE_Y - DOOR_HEIGHT - 88;
    const sign = new Graphics({ label: `hub-sign-${door.route}`, roundPixels: true });
    sign.rect(signX, signY, signW, 42).fill({ color: 0xd0d0d0 }).stroke({ color: 0x080808, width: 2, pixelLine: true });
    [[signX + 6, signY + 6], [signX + signW - 11, signY + 6], [signX + 6, signY + 29], [signX + signW - 11, signY + 29]].forEach(([x, y]) => {
      sign.rect(x, y, 5, 5).fill({ color: 0x666666 });
      sign.rect(x + 1, y + 1, 3, 1).fill({ color: 0xd8d8d8 });
    });
    const label = new Text({ text: door.label, style: signStyle });
    label.anchor.set(0.5);
    label.position.set(signX + signW / 2, signY + 21);
    world.addChild(sign, label);
  });
  return world;
}

export default function HubCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<InputState>({ left: false, right: false, jump: false });
  const [, navigate] = useLocation();

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let disposed = false;
      const app = new Application();
    const input = inputRef.current;
    const run = async () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      await app.init({ resizeTo: host, background: 0x080808, antialias: false, resolution: pixelRatio, autoDensity: true, preference: "webgl", eventFeatures: { move: false, globalMove: false, wheel: false, click: true } });
      if (disposed) { app.destroy(true, { children: true }); return; }
      host.appendChild(app.canvas);
      app.canvas.className = "game-canvas";
      app.canvas.setAttribute("aria-label", "Stanza hub, collegamento alle stanze");
      const resizeObserver = new ResizeObserver(() => { const rect = host.getBoundingClientRect(); if (rect.width > 0 && rect.height > 0) app.renderer.resize(Math.floor(rect.width), Math.floor(rect.height)); });
      resizeObserver.observe(host);
      app.resize();
      const initialRect = host.getBoundingClientRect();
      const initialWidth = Math.max(1, Math.floor(initialRect.width || window.innerWidth));
      const initialHeight = Math.max(1, Math.floor(initialRect.height || window.innerHeight));
      app.renderer.resize(initialWidth, initialHeight);
      const homeTextures = await Assets.load([HOME_BUTTON_OFF_ASSET, HOME_BUTTON_ON_ASSET]) as Record<string, Texture>;
      const doorPromptTexture = await Assets.load(DOOR_PROMPT_ASSET) as Texture;
      const worldWidth = Math.max(320, Math.floor(app.screen.width));
      const hubDoors = getHubDoors(worldWidth);
      const world = makeHubWorld(worldWidth, hubDoors);
      app.stage.addChild(world);
      const doorPrompts = hubDoors.map((door) => createDoorPrompt(doorPromptTexture, door.x, BASE_Y - DOOR_HEIGHT, DOOR_WIDTH, DOOR_HEIGHT));
      doorPrompts.forEach((prompt) => world.addChild(prompt));
      const doorGlows = hubDoors.map((door) => createDoorGlow(door.x, BASE_Y - DOOR_HEIGHT, DOOR_WIDTH, DOOR_HEIGHT));
      doorGlows.forEach((glow) => world.addChild(glow));
      const player = new Graphics({ label: "hub-player", roundPixels: true });
      const drawPlayer = (walkPhase: number, facing: 1 | -1) => {
        const swing = Math.round(Math.sin(walkPhase) * 4);
        const legSwing = Math.round(Math.sin(walkPhase) * 3);
        player.clear();
        player.rect(2, 2, 20, 44).fill({ color: 0x050505 });
        player.rect(6, 6, 14, 12).fill({ color: 0xffffff }).stroke({ color: 0x050505, width: 2, pixelLine: true });
        player.rect(6, 2, 14, 5).fill({ color: 0xd0d0d0 });
        player.rect(facing === 1 ? 17 : 0, 6, 8, 3).fill({ color: 0xffffff });
        player.rect(facing === 1 ? 15 : 6, 10, 3, 3).fill({ color: 0x080808 });
        player.rect(facing === 1 ? 9 : 15, 10, 3, 3).fill({ color: 0x080808 });
        player.rect(6, 18, 14, 14).fill({ color: 0xf2f2f2 }).stroke({ color: 0x050505, width: 2, pixelLine: true });
        const frontArm = facing === 1 ? 19 : 0;
        const backArm = facing === 1 ? 0 : 19;
        player.rect(backArm, 20, 5, 8).fill({ color: 0xd0d0d0 });
        player.rect(backArm + (facing === 1 ? -swing : swing), 27, 5, 6).fill({ color: 0xc0c0c0 });
        player.rect(frontArm, 20, 5, 8).fill({ color: 0xd0d0d0 });
        player.rect(frontArm + (facing === 1 ? swing : -swing), 27, 5, 6).fill({ color: 0xc0c0c0 });
        player.rect(7, 31, 5, 8).fill({ color: 0xffffff });
        player.rect(7 + legSwing, 38, 5, 8).fill({ color: 0xd8d8d8 });
        player.rect(13, 31, 5, 8).fill({ color: 0xffffff });
        player.rect(13 - legSwing, 38, 5, 8).fill({ color: 0xd8d8d8 });
        player.rect(facing === 1 ? 10 + legSwing : 4 + legSwing, 44, 8, 3).fill({ color: 0xffffff });
        player.rect(facing === 1 ? 16 - legSwing : 10 - legSwing, 44, 8, 3).fill({ color: 0xffffff });
      };
      world.addChild(player);
      const hud = new Container({ label: "hub-hud" });
      const hudStyle = new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: 0xf2f2f2, letterSpacing: 2 });
      const title = new Text({ text: "CENTRAL HUB  /  ALL ROOMS", style: hudStyle });
      title.position.set(18, 18);
      hud.addChild(title);
      const hint = new Text({ text: "← → MOVE     SPACE JUMP     APPROACH A DOOR", style: new TextStyle({ ...hudStyle, fontSize: 11, fill: 0xa6a6a6, letterSpacing: 1 }) });
      hint.position.set(18, 42);
      hud.addChild(hint);
      app.stage.addChild(hud);
      const homeButton = addFixedHomeButton(app, navigate, homeTextures[HOME_BUTTON_OFF_ASSET], homeTextures[HOME_BUTTON_ON_ASSET]);
      const returnDoorRaw = sessionStorage.getItem("return-from-hub-door");
      const returnDoorX = returnDoorRaw === null ? null : Number(returnDoorRaw);
      const entrySide = sessionStorage.getItem("hub-entry-side");
      sessionStorage.removeItem("return-from-hub-door");
      sessionStorage.removeItem("hub-entry-side");
      const entrySpawnX = entrySide === "left" ? worldWidth - 120 : 70;
      const playerState = { x: returnDoorX === null || !Number.isFinite(returnDoorX) ? entrySpawnX : returnDoorX + DOOR_WIDTH + 12, y: BASE_Y - PLAYER_HEIGHT, vx: 0, vy: 0, grounded: true, jumpLock: false };
      let cameraX = 0;
      let cameraY = 0;
      let elapsed = 0;
      let facing: 1 | -1 = 1;
      const initialScreenWidth = Math.max(1, app.screen.width || initialWidth);
      const initialScreenHeight = Math.max(1, app.screen.height || initialHeight);
      cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - initialScreenWidth), playerState.x - initialScreenWidth * 0.35));
      cameraY = Math.max(0, Math.min(Math.max(0, WORLD_HEIGHT - initialScreenHeight), playerState.y - initialScreenHeight * 0.58));
      world.position.set(Math.round(-cameraX), Math.round(-cameraY));
      const onKey = (event: KeyboardEvent, pressed: boolean) => { if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault(); if (event.code === "ArrowLeft") input.left = pressed; if (event.code === "ArrowRight") input.right = pressed; if (event.code === "Space" || event.code === "ArrowUp") input.jump = pressed; };
      const keyDown = (event: KeyboardEvent) => onKey(event, true);
      const keyUp = (event: KeyboardEvent) => onKey(event, false);
      window.addEventListener("keydown", keyDown, { passive: false });
      window.addEventListener("keyup", keyUp, { passive: false });
      const frame = (ticker: Ticker) => {
        const dt = Math.min(ticker.deltaMS / 1000, 0.033);
        homeButton.position();
        elapsed += dt;
        const direction = Number(input.right) - Number(input.left);
        playerState.vx += (direction * WALK_SPEED - playerState.vx) * Math.min(1, dt * 12);
        if (direction !== 0) facing = direction > 0 ? 1 : -1;
        let activeDoor: HubDoor | undefined;
        for (const door of hubDoors) if (Math.abs(playerState.x + PLAYER_WIDTH / 2 - (door.x + DOOR_WIDTH / 2)) < 72 && Math.abs(playerState.y - (BASE_Y - PLAYER_HEIGHT)) < 80) { activeDoor = door; break; }
        doorPrompts.forEach((prompt, index) => setDoorPromptVisible(prompt, activeDoor === hubDoors[index], elapsed));
        doorGlows.forEach((glow, index) => setDoorGlowVisible(glow, activeDoor === hubDoors[index], elapsed));
        if (input.jump && activeDoor && playerState.grounded && !playerState.jumpLock) {
          if (activeDoor.returnToHub) {
            sessionStorage.setItem("return-to-hub", "1");
            sessionStorage.setItem("return-from-hub-door", String(activeDoor.x));
          }
          navigate(activeDoor.route);
          return;
        }
        if (input.jump && playerState.grounded && !playerState.jumpLock) { playerState.vy = -JUMP_SPEED; playGameSound("jump"); playerState.grounded = false; playerState.jumpLock = true; }
        if (!input.jump) playerState.jumpLock = false;
        playerState.vy += GRAVITY * dt;
        playerState.x += playerState.vx * dt;
        playerState.x = Math.max(0, Math.min(worldWidth - PLAYER_WIDTH, playerState.x));
        playerState.y += playerState.vy * dt;
        if (playerState.y >= BASE_Y - PLAYER_HEIGHT) { playerState.y = BASE_Y - PLAYER_HEIGHT; playerState.vy = 0; playerState.grounded = true; } else playerState.grounded = false;
        if (playerState.x >= worldWidth - 40 && playerState.grounded) {
          sessionStorage.setItem("home-return-side", "left");
          navigate("/");
          return;
        }
        if (playerState.x <= 20 && playerState.grounded) {
          sessionStorage.setItem("home-return-side", "right");
          navigate("/");
          return;
        }
        const screenWidth = Math.max(1, app.screen.width || initialWidth);
        cameraX += ((playerState.x - screenWidth * 0.35) - cameraX) * Math.min(1, dt * 5);
        cameraX = Math.max(0, Math.min(Math.max(0, worldWidth - screenWidth), cameraX));
        world.x = Math.round(-cameraX);
        const screenHeight = Math.max(1, app.screen.height || initialHeight);
        cameraY += ((playerState.y - screenHeight * 0.58) - cameraY) * Math.min(1, dt * 5);
        cameraY = Math.max(0, Math.min(Math.max(0, WORLD_HEIGHT - screenHeight), cameraY));
        world.y = Math.round(-cameraY);
        drawPlayer(Math.abs(playerState.vx) > 12 ? elapsed * 10 : 0, facing);
        player.position.set(Math.round(playerState.x), Math.round(playerState.y));
        title.alpha = 0.88 + Math.sin(elapsed * 2) * 0.08;
        hint.position.set(18, 42);
      };
      app.ticker.add(frame);
      return () => { app.ticker.remove(frame); resizeObserver.disconnect(); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); app.destroy(true, { children: true }); };
    };
    let cleanup: (() => void) | undefined;
    run().then((fn) => { cleanup = fn; });
    return () => { disposed = true; cleanup?.(); };
  }, [navigate]);

  const setButton = (key: keyof InputState, value: boolean) => (event: React.PointerEvent<HTMLButtonElement>) => { event.preventDefault(); inputRef.current[key] = value; event.currentTarget.setPointerCapture?.(event.pointerId); };
  return <div ref={hostRef} className="game-shell"><div className="game-vignette" aria-hidden="true" /><div className="touch-controls" aria-label="Controlli touch"><button type="button" className="touch-button touch-left" onPointerDown={setButton("left", true)} onPointerUp={setButton("left", false)} onPointerCancel={setButton("left", false)} aria-label="Sinistra">←</button><button type="button" className="touch-button touch-right" onPointerDown={setButton("right", true)} onPointerUp={setButton("right", false)} onPointerCancel={setButton("right", false)} aria-label="Destra">→</button><button type="button" className="touch-button touch-jump" onPointerDown={setButton("jump", true)} onPointerUp={setButton("jump", false)} onPointerCancel={setButton("jump", false)} aria-label="Entra">↑</button></div><div className="mobile-note">TOUCH MODE / HOLD TO MOVE</div></div>;
}
