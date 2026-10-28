import { useEffect, useRef } from "react";
import {
  Application,
  Assets,
  Container,
  Graphics,
  Rectangle,
  Sprite,
  Text,
  TextStyle,
  Ticker,
  Texture,
  isMobile,
} from "pixi.js";
import { useLocation } from "wouter";
import { playGameSound } from "@/lib/gameAudio";
import { createDoorGlow, createDoorPrompt, DOOR_PROMPT_ASSET, setDoorGlowVisible, setDoorPromptVisible } from "@/lib/doorPrompt";

type Platform = { x: number; y: number; w: number; h: number };

type InputState = {
  left: boolean;
  right: boolean;
  jump: boolean;
};

const WORLD_WIDTH = 4000;
const WORLD_HEIGHT = 900;
const BASE_Y = 650;
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 48;
const DOOR_WIDTH = 48;
const DOOR_HEIGHT = 72;
const GRAVITY = 1500;
const WALK_SPEED = 250;
const JUMP_SPEED = 700;
const FIRST_DOOR = { x: 1220, y: 520 - DOOR_HEIGHT };
const SECOND_DOOR = { x: 1840, y: 500 - DOOR_HEIGHT };
const THIRD_DOOR = { x: 2670, y: 500 - DOOR_HEIGHT };
const FOURTH_DOOR = { x: 2670, y: 500 - DOOR_HEIGHT };

const DESKTOP_OPENING_SCREEN = "/assets/OMA_Hero.svg";
const MOBILE_OPENING_SCREEN = "/assets/OMASchermatainizialemobile_e0c65842.svg";

const platforms: Platform[] = [
  { x: 0, y: 650, w: 700, h: 80 },
  { x: 820, y: 650, w: 520, h: 80 },
  { x: 1500, y: 650, w: 680, h: 80 },
  { x: 2350, y: 650, w: 540, h: 80 },
  { x: 3060, y: 650, w: 940, h: 80 },
  { x: 1080, y: 520, w: 420, h: 24 },
  { x: 1660, y: 500, w: 460, h: 24 },
  { x: 2110, y: 390, w: 430, h: 24 },
  { x: 2520, y: 500, w: 450, h: 24 },
  { x: 3150, y: 480, w: 460, h: 24 },
  { x: 3500, y: 380, w: 400, h: 24 },
];

function drawPixelPlatform(g: Graphics, platform: Platform) {
  g.rect(platform.x, platform.y, platform.w, platform.h).fill({ color: 0xf2f2f2 });
  g.rect(platform.x, platform.y, platform.w, 5).fill({ color: 0xffffff });
  g.rect(platform.x, platform.y + platform.h - 6, platform.w, 6).fill({ color: 0x8a8a8a });
  for (let x = platform.x + 12; x < platform.x + platform.w - 8; x += 28) {
    g.rect(x, platform.y + 13, 11, 4).fill({ color: 0xbcbcbc, alpha: 0.75 });
  }
}

function makeWorld(): Container {
  const world = new Container({ label: "world" });
  const backdrop = new Graphics({ label: "backdrop" });
  backdrop.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill({ color: 0x080808 });
  for (let x = 0; x < WORLD_WIDTH; x += 96) {
    backdrop.rect(x, 0, 1, WORLD_HEIGHT).fill({ color: 0x191919 });
  }
  for (let y = 0; y < WORLD_HEIGHT; y += 96) {
    backdrop.rect(0, y, WORLD_WIDTH, 1).fill({ color: 0x151515 });
  }
  backdrop.rect(0, 650, WORLD_WIDTH, 2).fill({ color: 0x343434 });
  world.addChild(backdrop);

  const structures = new Graphics({ label: "structures", roundPixels: true });
  platforms.forEach((platform) => drawPixelPlatform(structures, platform));
  world.addChild(structures);
  return world;
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: Platform) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export default function GameCanvas() {
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
      await app.init({
        resizeTo: host,
        background: 0x080808,
        antialias: false,
        resolution: pixelRatio,
        autoDensity: true,
        preference: "webgl",
        eventFeatures: { move: true, globalMove: false, wheel: false, click: true },
      });
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      host.appendChild(app.canvas);
      app.canvas.className = "game-canvas";
      app.canvas.setAttribute("aria-label", "Monochrome Platform, gioco platform 2D");
      
      const resizeObserver = new ResizeObserver(() => {
        const rect = host.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          app.renderer.resize(Math.floor(rect.width), Math.floor(rect.height));
        }
      });
      resizeObserver.observe(host);
      app.resize();
      const initialRect = host.getBoundingClientRect();
      const initialWidth = Math.max(1, Math.floor(initialRect.width || window.innerWidth));
      const initialHeight = Math.max(1, Math.floor(initialRect.height || window.innerHeight));
      app.renderer.resize(initialWidth, initialHeight);

      const world = makeWorld();
      app.stage.addChild(world);
      
      const MOBILE_BOOST = 1.5; // 1 = com'era, 1.3 = +30%, 1.5 = +50%

      const computeZoom = () => {
        const w = app.screen.width;
        const h = app.screen.height;
        const base = Math.min(h / 560, w / 640);
        const isPhone = Math.min(w, h) <= 600; // vale sia in verticale sia in orizzontale
        const boosted = base * (isPhone ? MOBILE_BOOST : 1);
        return Math.max(0.45, Math.min(2, boosted)); // massimo alzato da 1.5 a 2
      };      

      const isMobileViewport = app.screen.width <= 700;
      const openingScreenTexture = await Assets.load(DESKTOP_OPENING_SCREEN);
      const openingScreen = new Sprite(openingScreenTexture);
      openingScreen.label = isMobileViewport ? "opening-screen-mobile" : "opening-screen-desktop";

      const isPortrait = app.screen.height > app.screen.width;
      const visibleWorldW = app.screen.width / computeZoom(); // larghezza di mondo visibile all'inizio

      // Su portrait lo sprite non deve superare la larghezza visibile
      const spriteW = Math.min(420, visibleWorldW * 0.9);
      openingScreen.scale.set(isMobile ? 0.8 : 1);

      const openingGap = isPortrait ? 160 : 40; // distanza dalla piattaforma: più alto = più in alto
      const openingX = isPortrait ? 80 : 300; // centrato su portrait
      openingScreen.position.set(openingX, openingScreen.width / 2 + 200);
      world.addChild(openingScreen);

      const vai_a_offerta_formativa = new Text({
        text: "NON HAI TEMPO PER GIOCARE?",
        style: new TextStyle({
          fontFamily: "Press Start 2P, monospace",
          fontSize: 12,
          fill: 0x555555,
          letterSpacing: 1,
        }),
      });
      vai_a_offerta_formativa.anchor.set(0.5, 0);
      vai_a_offerta_formativa.position.set(openingX + 160, 656);
      world.addChild(vai_a_offerta_formativa);
      // PULSANTE PER CHI NON HA TEMPO DI GIOCARE
      const offerButton = new Container({ label: "offer-formativa-button" });

      
      const offerButtonWidth = 220;
      const offerButtonHeight = 50;
      const offerButtonX = openingX;
      const offerButtonY = 672;
      const offerButtonBackground = new Graphics({ roundPixels: true });
      const drawOfferButtonBackground = (hovered: boolean) => {
        offerButtonBackground.clear();
        offerButtonBackground
          .rect(0, 0, offerButtonWidth, offerButtonHeight)
          .fill({ color: hovered ? 0x101010 : 0xbebdbd });
      };
      drawOfferButtonBackground(false);

        const offerButtonShadow = new Graphics();

      offerButtonShadow
        .rect(4, 4, offerButtonWidth, offerButtonHeight)
        .fill({
          color: 0x000000,
          alpha: 0.6,
        });
      offerButton.addChild(offerButtonShadow);
      offerButton.addChild(offerButtonBackground);

      const offerButtonCursor = new Text({
        text: "◆",
        style: new TextStyle({
          fontFamily: "monospace",
          fontSize: 10,
          fill: 0xaaaaaa,
        }),
      });
      offerButtonCursor.anchor.set(0.5);
      offerButtonCursor.position.set(24, offerButtonHeight / 2);
      offerButton.addChild(offerButtonCursor);

      const offerButtonTitle = new Text({
        text: "CONTATTACI",
        style: new TextStyle({
          fontFamily: "Press Start 2P, monospace",
          fontSize: 16,
          fill: 0x555555,
          letterSpacing: 1,
        }),
      });
      offerButtonTitle.anchor.set(0.5, 0); // origine al centro orizzontale
      offerButtonTitle.position.set(offerButtonWidth / 2, 17);
      offerButton.addChild(offerButtonTitle);

      
      
    // world.addChild(hint);
      const credits = new Text({
        text: "Realizzato da:\nGiulia Rappo, Antonio Russo",
        style: new TextStyle({
          fontFamily: "monospace",
          fontSize: 13,
          fill: 0x080808, // scuro, perché ora sta su sfondo chiaro
          letterSpacing: 2,
          lineHeight: 21,
          align: "center",
        }),
      });
      credits.anchor.set(0.5, 0.5);

      // Pannello come doorSign: dimensioni calcolate sul testo
      const creditsPadX = 24;
      const creditsPadY = 18;
      const creditsW = credits.width + creditsPadX * 2;
      const creditsH = credits.height + creditsPadY * 2;

      const creditsSign = new Container({ label: "opening-credits" });
      const creditsBg = new Graphics({ roundPixels: true });
      const cx = -creditsW / 2; // il container è centrato sul suo punto di posizione
      const cy = -creditsH / 2;
      creditsBg
        .rect(cx, cy, creditsW, creditsH)
        .fill({ color: 0xd0d0d0 })
        .stroke({ color: 0x080808, width: 2, pixelLine: true });
      [
        [cx + 6, cy + 6],
        [cx + creditsW - 11, cy + 6],
        [cx + 6, cy + creditsH - 11],
        [cx + creditsW - 11, cy + creditsH - 11],
      ].forEach(([x, y]) => {
        creditsBg.rect(x, y, 5, 5).fill({ color: 0x666666 });
        creditsBg.rect(x + 1, y + 1, 3, 1).fill({ color: 0xd8d8d8 });
      });
      credits.position.set(0, 0);
      creditsSign.addChild(creditsBg, credits);

      const creditsOffsetX = platforms[10].x; // più alto = più a destra (negativo = più a sinistra)
      const creditsOffsetY = 120; // più alto = più in basso

      if (isPortrait) {
        // Sotto lo sprite, centrato con lui
        creditsSign.position.set(
          creditsOffsetX,
          openingScreen.position.y + openingScreen.height + 40 + creditsH / 2 + creditsOffsetY,
        );
      } else {
        // Tra lo sprite e il primo buco
        const omaRight = openingScreen.position.x + openingScreen.width;
        const firstHoleStart = platforms[0].x + platforms[0].w;
        const holeCenter = firstHoleStart + (platforms[1].x - firstHoleStart) / 2;
        creditsSign.position.set(
          omaRight + (holeCenter - omaRight) / 2 + creditsOffsetX,
          openingScreen.position.y + openingScreen.height / 2 + creditsOffsetY,
        );
      }
      world.addChild(creditsSign);

      const doorPromptTexture = await Assets.load(DOOR_PROMPT_ASSET) as Texture;
      const doorDefinitions = [
        { x: FIRST_DOOR.x, y: FIRST_DOOR.y },
        { x: SECOND_DOOR.x, y: SECOND_DOOR.y },
        { x: THIRD_DOOR.x, y: THIRD_DOOR.y },
        { x: 3800, y: 380 - DOOR_HEIGHT },
      ];
      const doorPrompts = doorDefinitions.map((door) => createDoorPrompt(doorPromptTexture, door.x, door.y, DOOR_WIDTH, DOOR_HEIGHT));
      doorPrompts.forEach((prompt) => world.addChild(prompt));
      const doorGlows = doorDefinitions.map((door) => createDoorGlow(door.x, door.y, DOOR_WIDTH, DOOR_HEIGHT));
      doorGlows.forEach((glow) => world.addChild(glow));

      const player = new Graphics({ label: "player", roundPixels: true });
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
      drawPlayer(0, 1);
      world.addChild(player);


      
    // Dietro al personaggio, così non gli passa sopra

      // Testi responsive e centrati: sottotitolo 16-18, titolo che si adatta alla larghezza
      let offerLayoutKey = "";
      const updateOfferTextSize = (zoom: number) => {
        const isMobile = app.screen.width <= 700;
        const TITLE_BASE = isMobile ? 18 : 12; // mobile : desktop
        const preferredTitle = TITLE_BASE;
        const sub = Math.max(16, Math.min(18, Math.round(16 / zoom)));
        const key = `${sub}-${preferredTitle}`;
        if (key === offerLayoutKey) return; // evita di ridisegnare il testo a ogni frame
        offerLayoutKey = key;


      

        // Centratura verticale dei due testi (altezza pulsante fissa)
        const gap = 10;
        offerButtonTitle.position.set(offerButtonWidth / 2, offerButtonHeight / 2 - 5);
      };

      offerButton.position.set(offerButtonX + 40, offerButtonY);
      offerButton.eventMode = "static";
      offerButton.cursor = "pointer";
      offerButton.hitArea = new Rectangle(0, 0, offerButtonWidth, offerButtonHeight);
      offerButton.on("pointerover", () => {
        offerButton.position.x = offerButtonX + 5;
        drawOfferButtonBackground(true);
        offerButtonCursor.style.fill = 0x080808;
        offerButtonTitle.style.fill = 0x555555;
      });
      offerButton.on("pointerout", () => {
        drawOfferButtonBackground(false);
        offerButton.position.x = offerButtonX;
        offerButtonCursor.style.fill = 0xaaaaaa;
        offerButtonTitle.style.fill = 0x555555;
      });
      offerButton.on("pointertap", () => navigate("/offerta-formativa"));
      world.addChild(offerButton);
      world.addChildAt(offerButton, world.getChildIndex(player));

    

      const doorSign = new Graphics({ label: "cura-anomala-sign", roundPixels: true });
      const signW = 200;
      const signH = 48;
      const signX = FIRST_DOOR.x + DOOR_WIDTH / 2 - signW / 2;
      const signY = FIRST_DOOR.y - 98;
      doorSign.rect(signX, signY, signW, signH).fill({ color: 0xd0d0d0 }).stroke({ color: 0x080808, width: 2, pixelLine: true });
      [
        [signX + 6, signY + 6],
        [signX + signW - 11, signY + 6],
        [signX + 6, signY + signH - 11],
        [signX + signW - 11, signY + signH - 11],
      ].forEach(([x, y]) => {
        doorSign.rect(x, y, 5, 5).fill({ color: 0x666666 });
        doorSign.rect(x + 1, y + 1, 3, 1).fill({ color: 0xd8d8d8 });
      });
      doorSign.visible = true;
      world.addChild(doorSign);

      const doorLabel = new Text({
        text: "Cosa facciamo",
        style: new TextStyle({
          fontFamily: "Press Start 2P, monospace",
          fontSize: 12,
          fill: 0x080808,
          letterSpacing: 0,
          align: "center",
        }),
      });
      doorLabel.anchor.set(0.5, 0.5);
      doorLabel.position.set(signX + signW / 2, signY + signH / 2);
      doorLabel.visible = true;
      world.addChild(doorLabel);

      const secondDoorSign = new Graphics({ label: "seven-room-sign", roundPixels: true });
      const secondSignX = SECOND_DOOR.x - 58;
      const secondSignY = SECOND_DOOR.y - 98;
      const secondSignW = 164;
      const secondSignH = 48;
      secondDoorSign.rect(secondSignX, secondSignY, secondSignW, secondSignH).fill({ color: 0xd0d0d0 }).stroke({ color: 0x080808, width: 2, pixelLine: true });
      [
        [secondSignX + 6, secondSignY + 6],
        [secondSignX + secondSignW - 11, secondSignY + 6],
        [secondSignX + 6, secondSignY + secondSignH - 11],
        [secondSignX + secondSignW - 11, secondSignY + secondSignH - 11],
      ].forEach(([x, y]) => {
        secondDoorSign.rect(x, y, 5, 5).fill({ color: 0x666666 });
        secondDoorSign.rect(x + 1, y + 1, 3, 1).fill({ color: 0xd8d8d8 });
      });
      secondDoorSign.visible = true;
      world.addChild(secondDoorSign);

      const secondDoorLabel = new Text({
        text: "Chi siamo",
        style: new TextStyle({
          fontFamily: "Press Start 2P, monospace",
          fontSize: 12,
          fill: 0x080808,
          letterSpacing: 0,
          align: "center",
        }),
      });
      secondDoorLabel.anchor.set(0.5, 0.5);
      secondDoorLabel.position.set(SECOND_DOOR.x + DOOR_WIDTH / 2, secondSignY + secondSignH / 2);
      secondDoorLabel.visible = true;
      world.addChild(secondDoorLabel);

      const thirdDoorSign = new Graphics({ label: "documentation-room-sign", roundPixels: true });
      const thirdSignW = 220;
      const thirdSignH = 48;
      const thirdSignX = THIRD_DOOR.x + DOOR_WIDTH / 2 - thirdSignW / 2;
      const thirdSignY = THIRD_DOOR.y - 98;
      thirdDoorSign.rect(thirdSignX, thirdSignY, thirdSignW, thirdSignH).fill({ color: 0xd0d0d0 }).stroke({ color: 0x080808, width: 2, pixelLine: true });
      [[thirdSignX + 6, thirdSignY + 6], [thirdSignX + thirdSignW - 11, thirdSignY + 6], [thirdSignX + 6, thirdSignY + thirdSignH - 11], [thirdSignX + thirdSignW - 11, thirdSignY + thirdSignH - 11]].forEach(([x, y]) => {
        thirdDoorSign.rect(x, y, 5, 5).fill({ color: 0x666666 });
        thirdDoorSign.rect(x + 1, y + 1, 3, 1).fill({ color: 0xd8d8d8 });
      });
      world.addChild(thirdDoorSign);

      const thirdDoorLabel = new Text({
        text: "Stanza della documentazione",
        style: new TextStyle({ fontFamily: "Press Start 2P, monospace", fontSize: 8, fill: 0x080808, align: "center" }),
      });
      thirdDoorLabel.anchor.set(0.5);
      thirdDoorLabel.position.set(THIRD_DOOR.x + DOOR_WIDTH / 2, thirdSignY + thirdSignH / 2);
      world.addChild(thirdDoorLabel);

      const hud = new Container({ label: "hud" });
      const hudStyle = new TextStyle({
        fontFamily: "monospace",
        fontSize: 13,
        fill: 0xf2f2f2,
        letterSpacing: 2,
      });
      
      const location = new Text({ text: "EXPLORE  00%", style: new TextStyle({ ...hudStyle, fontSize: 11, fill: 0xbcbcbc, letterSpacing: 1 }) });
      hud.addChild(location);
      app.stage.addChild(hud);

      const returningFromRoom = sessionStorage.getItem("return-to-intermediate") === "1";
      const returningFromPortraitRoom = sessionStorage.getItem("return-from-portrait-room") === "1";
      const returningFromDocumentation = sessionStorage.getItem("return-from-documentation") === "1";
      const returningFromDocumentationRightHole = sessionStorage.getItem("return-from-documentation-right-hole") === "1";
      sessionStorage.removeItem("return-to-intermediate");
      sessionStorage.removeItem("return-from-portrait-room");
      sessionStorage.removeItem("return-from-documentation");
      sessionStorage.removeItem("return-from-documentation-right-hole");
      const playerState = {
        x: returningFromRoom ? FIRST_DOOR.x + 60 : returningFromPortraitRoom ? SECOND_DOOR.x + 60 : returningFromDocumentationRightHole ? THIRD_DOOR.x + DOOR_WIDTH + 18 : returningFromDocumentation ? THIRD_DOOR.x + 60 : 180,
        y: returningFromRoom ? FIRST_DOOR.y + DOOR_HEIGHT - PLAYER_HEIGHT : returningFromPortraitRoom ? SECOND_DOOR.y + DOOR_HEIGHT - PLAYER_HEIGHT : returningFromDocumentationRightHole ? THIRD_DOOR.y + DOOR_HEIGHT - PLAYER_HEIGHT : returningFromDocumentation ? THIRD_DOOR.y + DOOR_HEIGHT - PLAYER_HEIGHT : 650 - PLAYER_HEIGHT,
        vx: 0,
        vy: 0,
        grounded: returningFromRoom,
        jumpLock: false,
      };
      let cameraX = 0;
      let cameraY = 0;
      let elapsed = 0;
      let facing: 1 | -1 = 1;

      // Camera iniziale (tiene conto dello zoom)
      const initialZoom = computeZoom();
      updateOfferTextSize(initialZoom);
      const initialViewW = Math.max(1, app.screen.width || initialWidth) / initialZoom;
      const initialViewH = Math.max(1, app.screen.height || initialHeight) / initialZoom;
      cameraX = Math.max(0, Math.min(Math.max(0, WORLD_WIDTH - initialViewW), playerState.x - initialViewW * 0.35));
      cameraY = Math.max(0, Math.min(Math.max(0, WORLD_HEIGHT - initialViewH), playerState.y - initialViewH * 0.58));
      world.scale.set(initialZoom);
      world.position.set(Math.round(-cameraX * initialZoom), Math.round(-cameraY * initialZoom));

      const onKey = (event: KeyboardEvent, pressed: boolean) => {
        if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space"].includes(event.code)) event.preventDefault();
        if (event.code === "ArrowLeft") input.left = pressed;
        if (event.code === "ArrowRight") input.right = pressed;
        if (event.code === "Space" || event.code === "ArrowUp") input.jump = pressed;
      };
      const keyDown = (event: KeyboardEvent) => onKey(event, true);
      const keyUp = (event: KeyboardEvent) => onKey(event, false);
      window.addEventListener("keydown", keyDown, { passive: false });
      window.addEventListener("keyup", keyUp, { passive: false });

      const frame = (ticker: Ticker) => {
        const dt = Math.min(ticker.deltaMS / 1000, 0.033);
        elapsed += dt;
        const direction = Number(input.right) - Number(input.left);
        playerState.vx += (direction * WALK_SPEED - playerState.vx) * Math.min(1, dt * 12);
        if (direction !== 0) facing = direction > 0 ? 1 : -1;
        doorPrompts.forEach((prompt, index) => {
          const door = doorDefinitions[index];
          const nearDoor = Math.abs(playerState.x + PLAYER_WIDTH / 2 - (door.x + DOOR_WIDTH / 2)) < 86
            && Math.abs(playerState.y - door.y) < 86;
          setDoorPromptVisible(prompt, nearDoor, elapsed);
          setDoorGlowVisible(doorGlows[index], nearDoor, elapsed);
        });
        const playerCenter = playerState.x + PLAYER_WIDTH / 2;
        const doorCenter = FIRST_DOOR.x + DOOR_WIDTH / 2;
        const secondDoorCenter = SECOND_DOOR.x + DOOR_WIDTH / 2;
        const thirdDoorCenter = THIRD_DOOR.x + DOOR_WIDTH / 2;
        const nearFirstDoor = Math.abs(playerCenter - doorCenter) < 86 && Math.abs(playerState.y - FIRST_DOOR.y) < 86;
        const nearSecondDoor = Math.abs(playerCenter - secondDoorCenter) < 86 && Math.abs(playerState.y - SECOND_DOOR.y) < 86;
        const nearThirdDoor = Math.abs(playerCenter - thirdDoorCenter) < 86 && Math.abs(playerState.y - THIRD_DOOR.y) < 86;
        doorSign.visible = true;
        doorLabel.visible = true;
        secondDoorSign.visible = true;
        secondDoorLabel.visible = true;
        if (input.jump && nearFirstDoor && playerState.grounded) {
          navigate("/stanza-intermedia");
          return;
        }
        if (input.jump && nearSecondDoor && playerState.grounded) {
          navigate("/room-02");
          return;
        }
        if (input.jump && nearThirdDoor && playerState.grounded) {
          navigate("/room-03");
          return;
        }
        if (input.jump && playerState.grounded && !playerState.jumpLock) {
          playerState.vy = -JUMP_SPEED;
          playGameSound("jump");
          playerState.grounded = false;
          playerState.jumpLock = true;
        }
        if (!input.jump) playerState.jumpLock = false;
        playerState.vy += GRAVITY * dt;
        const previousBottom = playerState.y + PLAYER_HEIGHT;
        playerState.x += playerState.vx * dt;

        let wrappedToRight = false;
        let wrappedToLeft = false;

        if (playerState.x + PLAYER_WIDTH <= 0) {
          // Se supera il bordo sinistro, ricompare a destra.
          playerState.x = WORLD_WIDTH - PLAYER_WIDTH;
          wrappedToRight = true;
        } else if (playerState.x >= WORLD_WIDTH) {
          // Se supera il bordo destro, ricompare a sinistra.
          playerState.x = 0;
          wrappedToLeft = true;
        }

        playerState.y += playerState.vy * dt;
        playerState.grounded = false;
        if (playerState.vy >= 0) {
          for (const platform of platforms) {
            if (previousBottom <= platform.y && overlaps({ x: playerState.x, y: playerState.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }, platform)) {
              playerState.y = platform.y - PLAYER_HEIGHT;
              playerState.vy = 0;
              playerState.grounded = true;
              break;
            }
          }
        }
        const currentBottom = playerState.y + PLAYER_HEIGHT;
        if (previousBottom <= BASE_Y && currentBottom > BASE_Y && playerState.vy > 0) playGameSound("fall");
        if (playerState.y > WORLD_HEIGHT + 120) {
          playerState.x = 120;
          playerState.y = 650 - PLAYER_HEIGHT;
          playerState.vy = 0;
        }

        // Camera con zoom
        const zoom = computeZoom();
        updateOfferTextSize(zoom);
        const screenWidth = Math.max(1, app.screen.width || initialWidth);
        const screenHeight = Math.max(1, app.screen.height || initialHeight);
        const viewW = screenWidth / zoom; // quanto mondo è visibile
        const viewH = screenHeight / zoom;

        if (wrappedToRight) {
          // Il personaggio è uscito a sinistra:
          // la camera mostra immediatamente il lato destro.
          cameraX = Math.max(0, WORLD_WIDTH - viewW);
          } else if (wrappedToLeft) {
            // Il personaggio è uscito a destra:
            // la camera mostra immediatamente il lato sinistro.
            cameraX = 0;
          } else {
            cameraX +=
              ((playerState.x - viewW * 0.35) - cameraX) *
              Math.min(1, dt * 5);
          }

          cameraX = Math.max(
            0,
            Math.min(Math.max(0, WORLD_WIDTH - viewW), cameraX),
          );

        cameraY += ((playerState.y - viewH * 0.58) - cameraY) * Math.min(1, dt * 5);
        cameraY = Math.max(0, Math.min(Math.max(0, WORLD_HEIGHT - viewH), cameraY));

        world.scale.set(zoom);
        world.position.set(Math.round(-cameraX * zoom), Math.round(-cameraY * zoom));

        drawPlayer(Math.abs(playerState.vx) > 12 ? elapsed * 10 : 0, facing);
        player.position.set(Math.round(playerState.x), Math.round(playerState.y));
        const explored = Math.min(99, Math.max(0, Math.round(((playerState.x + screenWidth * 0.4) / WORLD_WIDTH) * 100)));
        location.text = `EXPLORE  ${String(explored).padStart(2, "0")}%`;
        hud.visible = true;
        location.position.set(Math.max(18, screenWidth - 126), 20);
      };
      app.ticker.add(frame);

      return () => {
        app.ticker.remove(frame);
        resizeObserver.disconnect();
        window.removeEventListener("keydown", keyDown);
        window.removeEventListener("keyup", keyUp);
        app.destroy(true, { children: true });
      };
    };

    let cleanup: (() => void) | undefined;
    run().then((fn) => { cleanup = fn; });
    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  const setButton = (key: keyof InputState, value: boolean) => (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    inputRef.current[key] = value;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  return (
    <div ref={hostRef} className="game-shell">
      <div className="game-vignette" aria-hidden="true" />
      <div className="touch-controls" aria-label="Controlli touch">
        <button type="button" className="touch-button touch-left" onPointerDown={setButton("left", true)} onPointerUp={setButton("left", false)} onPointerCancel={setButton("left", false)} aria-label="Sinistra">←</button>
        <button type="button" className="touch-button touch-right" onPointerDown={setButton("right", true)} onPointerUp={setButton("right", false)} onPointerCancel={setButton("right", false)} aria-label="Destra">→</button>
        <button type="button" className="touch-button touch-jump" onPointerDown={setButton("jump", true)} onPointerUp={setButton("jump", false)} onPointerCancel={setButton("jump", false)} aria-label="Salta">↑</button>
      </div>
      <div className="mobile-note">TOUCH MODE / HOLD TO MOVE</div>
    </div>
  );
}