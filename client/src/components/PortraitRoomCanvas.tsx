import { useEffect, useRef } from "react";
import { Application, Assets, Container, Graphics, Sprite, Text, TextStyle, Texture, Ticker } from "pixi.js";
import { useLocation } from "wouter";
import { playGameSound } from "@/lib/gameAudio";
import { addFixedHomeButton, HOME_BUTTON_OFF_ASSET, HOME_BUTTON_ON_ASSET } from "@/lib/homeButton";
import { createDoorGlow, createDoorPrompt, DOOR_PROMPT_ASSET, setDoorGlowVisible, setDoorPromptVisible } from "@/lib/doorPrompt";

type InputState = { left: boolean; right: boolean; jump: boolean };
type Surface = { x: number; y: number; w: number; h: number };

const WORLD_WIDTH = 2200;
const WORLD_HEIGHT = 900;
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 48;
const DOOR_WIDTH = 48;
const DOOR_HEIGHT = 72;
const GRAVITY = 1500;
const WALK_SPEED = 250;
const JUMP_SPEED = 700;
const BASE_Y = 650;
const HOLE = { x: 110, w: 160 };
const RETURN_DOOR = { x: 1490, y: BASE_Y - DOOR_HEIGHT };
const ROOM_SPAWN_X = RETURN_DOOR.x + DOOR_WIDTH + 12;
const PORTRAIT_START_X = 520;
const PORTRAIT_SPACING = 210;
const PORTRAIT_Y = 470;

function drawPixelSurface(g: Graphics, surface: Surface) {
  g.rect(surface.x, surface.y, surface.w, surface.h).fill({ color: 0xf2f2f2 });
  g.rect(surface.x, surface.y, surface.w, 5).fill({ color: 0xffffff });
  g.rect(surface.x, surface.y + surface.h - 6, surface.w, 6).fill({ color: 0x8a8a8a });
  for (let x = surface.x + 12; x < surface.x + surface.w - 8; x += 28) {
    g.rect(x, surface.y + 13, 11, 4).fill({ color: 0xbcbcbc, alpha: 0.75 });
  }
}

function drawDoor(g: Graphics, x: number, y: number) {
}

type PortraitKind = "bernardo" | "guglielmo" | "giulia" | "antonio" | "leonardo" | "lorenzo" | "giovanni";

function drawPortrait(g: Graphics, x: number, y: number, kind: PortraitKind) {
  const face = 0xf2f2f2;
  const light = 0xd0d0d0;
  const mid = 0x8a8a8a;
  const dark = 0x4a4a4a;
  const ink = 0x181818;
  g.rect(x, y, 150, 150).fill({ color: 0xd0d0d0 }).stroke({ color: 0x777777, width: 3, pixelLine: true });
  g.rect(x + 10, y + 10, 130, 130).fill({ color: 0x111111 });
  g.rect(x + 14, y + 14, 122, 3).fill({ color: 0xffffff });
  g.rect(x + 38, y + 109, 74, 31).fill({ color: dark });
  g.rect(x + 48, y + 106, 54, 34).fill({ color: mid });

  if (kind === "bernardo") {
    // Slightly elongated face, pale sparse curls and square glasses.
    g.rect(x + 56, y + 38, 40, 78).fill({ color: face });
    g.rect(x + 52, y + 52, 5, 47).fill({ color: light });
    g.rect(x + 52, y + 25, 12, 16).fill({ color: light });
    g.rect(x + 64, y + 19, 14, 12).fill({ color: light });
    g.rect(x + 79, y + 22, 13, 10).fill({ color: mid });
    g.rect(x + 94, y + 30, 10, 13).fill({ color: light });
    g.rect(x + 52, y + 50, 19, 15).stroke({ color: ink, width: 3, pixelLine: true });
    g.rect(x + 81, y + 50, 19, 15).stroke({ color: ink, width: 3, pixelLine: true });
    g.rect(x + 71, y + 55, 10, 4).fill({ color: ink });
    g.rect(x + 70, y + 81, 12, 4).fill({ color: dark });
    g.rect(x + 68, y + 101, 17, 4).fill({ color: mid });
  } else if (kind === "guglielmo") {
    // Youthful rounded face surrounded by a soft cloud of curls.
    g.rect(x + 48, y + 40, 54, 68).fill({ color: face });
    [[48, 30, 18, 18], [63, 21, 20, 18], [81, 18, 21, 20], [99, 27, 17, 18], [43, 42, 15, 19]].forEach(([dx, dy, w, h], i) => g.rect(x + dx, y + dy, w, h).fill({ color: i % 3 === 0 ? light : mid }));
    g.rect(x + 56, y + 61, 5, 5).fill({ color: ink });
    g.rect(x + 87, y + 61, 5, 5).fill({ color: ink });
    g.rect(x + 70, y + 78, 10, 4).fill({ color: mid });
    g.rect(x + 67, y + 94, 18, 4).fill({ color: light });
    g.rect(x + 58, y + 108, 35, 7).fill({ color: mid });
  } else if (kind === "giulia") {
    // Very short hair, softer tapered face, round glasses and exactly two eyes.
    g.rect(x + 55, y + 42, 43, 64).fill({ color: face });
    g.rect(x + 53, y + 38, 7, 42).fill({ color: light });
    g.rect(x + 93, y + 38, 7, 42).fill({ color: light });
    g.rect(x + 55, y + 34, 43, 13).fill({ color: light });
    g.rect(x + 60, y + 29, 33, 8).fill({ color: mid });
    g.circle(x + 65, y + 68, 14).stroke({ color: ink, width: 3, pixelLine: true });
    g.circle(x + 88, y + 68, 14).stroke({ color: ink, width: 3, pixelLine: true });
    g.rect(x + 77, y + 67, 8, 3).fill({ color: ink });
    g.rect(x + 51, y + 66, 6, 3).fill({ color: ink });
    g.rect(x + 99, y + 66, 6, 3).fill({ color: ink });
    g.rect(x + 63, y + 67, 4, 4).fill({ color: ink });
    g.rect(x + 86, y + 67, 4, 4).fill({ color: ink });
    g.rect(x + 73, y + 90, 12, 3).fill({ color: mid });
    g.rect(x + 68, y + 101, 22, 5).fill({ color: light });
  } else if (kind === "antonio") {
    // Dark tapered haircut, central quiff, square glasses and facial hair.
    g.rect(x + 49, y + 42, 53, 68).fill({ color: face });
    g.rect(x + 48, y + 31, 55, 18).fill({ color: dark });
    g.rect(x + 48, y + 42, 10, 30).fill({ color: dark });
    g.rect(x + 91, y + 41, 11, 31).fill({ color: dark });
    g.rect(x + 70, y + 22, 13, 18).fill({ color: dark });
    g.rect(x + 53, y + 54, 22, 17).stroke({ color: ink, width: 4, pixelLine: true });
    g.rect(x + 79, y + 54, 22, 17).stroke({ color: ink, width: 4, pixelLine: true });
    g.rect(x + 75, y + 60, 8, 4).fill({ color: ink });
    g.rect(x + 64, y + 88, 26, 5).fill({ color: dark });
    g.rect(x + 70, y + 94, 15, 14).fill({ color: dark });
    g.rect(x + 61, y + 103, 33, 6).fill({ color: mid });
  } else if (kind === "leonardo") {
    // Long dark hair, soft face, round glasses, moustache and light beard.
    g.rect(x + 49, y + 42, 54, 67).fill({ color: face });
    g.rect(x + 45, y + 28, 14, 83).fill({ color: dark });
    g.rect(x + 96, y + 27, 15, 85).fill({ color: dark });
    g.rect(x + 55, y + 25, 44, 20).fill({ color: dark });
    g.circle(x + 64, y + 68, 15).stroke({ color: ink, width: 3, pixelLine: true });
    g.circle(x + 88, y + 68, 15).stroke({ color: ink, width: 3, pixelLine: true });
    g.rect(x + 76, y + 66, 6, 4).fill({ color: ink });
    g.rect(x + 61, y + 88, 31, 6).fill({ color: dark });
    g.rect(x + 67, y + 94, 20, 13).fill({ color: mid });
    g.rect(x + 59, y + 108, 38, 6).fill({ color: light });
  } else if (kind === "lorenzo") {
    // Bald head and evenly distributed salt-and-pepper beard.
    g.rect(x + 50, y + 38, 51, 72).fill({ color: face });
    g.rect(x + 55, y + 34, 42, 7).fill({ color: light });
    g.rect(x + 55, y + 83, 41, 28).fill({ color: mid });
    g.rect(x + 59, y + 90, 33, 2).fill({ color: light });
    g.rect(x + 57, y + 96, 37, 1).fill({ color: light });
    g.rect(x + 60, y + 101, 32, 2).fill({ color: light });
    g.rect(x + 64, y + 106, 24, 1).fill({ color: light });
    g.rect(x + 67, y + 88, 2, 18).fill({ color: dark });
    g.rect(x + 80, y + 88, 2, 20).fill({ color: dark });
    g.rect(x + 57, y + 56, 18, 13).stroke({ color: ink, width: 3, pixelLine: true });
    g.rect(x + 82, y + 56, 18, 13).stroke({ color: ink, width: 3, pixelLine: true });
    g.rect(x + 75, y + 61, 7, 4).fill({ color: ink });
    g.rect(x + 62, y + 101, 6, 5).fill({ color: light });
    g.rect(x + 77, y + 96, 6, 5).fill({ color: light });
    g.rect(x + 87, y + 103, 5, 5).fill({ color: light });
  } else {
    // Narrow, delicate face and clean bald head.
    g.rect(x + 60, y + 37, 31, 77).fill({ color: face });
    g.rect(x + 64, y + 32, 24, 7).fill({ color: light });
    g.rect(x + 55, y + 61, 6, 16).fill({ color: light });
    g.rect(x + 90, y + 61, 6, 16).fill({ color: light });
    g.rect(x + 61, y + 59, 6, 6).fill({ color: ink });
    g.rect(x + 84, y + 59, 6, 6).fill({ color: ink });
    g.rect(x + 71, y + 80, 10, 4).fill({ color: mid });
    g.rect(x + 69, y + 97, 14, 4).fill({ color: light });
    g.rect(x + 50, y + 116, 50, 5).fill({ color: mid });
  }
  if (kind === "leonardo") {
    const portraitImage = new Sprite(Texture.from("/assets/leonardo-portrait-square_66dd7e60.jpg"));
    portraitImage.position.set(x + 14, y + 14);
    portraitImage.width = 122;
    portraitImage.height = 110;
    g.addChild(portraitImage);
  }
  if (kind === "antonio") {
    const portraitImage = new Sprite(Texture.from("/assets/antonio-portrait-square_0a07abe0.jpg"));
    portraitImage.position.set(x + 14, y + 14);
    portraitImage.width = 122;
    portraitImage.height = 110;
    g.addChild(portraitImage);
  }
  if (kind === "bernardo") {
    const portraitImage = new Sprite(Texture.from("/assets/bernardo-portrait-square_6b86c2da.jpg"));
    portraitImage.position.set(x + 14, y + 14);
    portraitImage.width = 122;
    portraitImage.height = 110;
    g.addChild(portraitImage);
  }
  if (kind === "guglielmo") {
    const portraitImage = new Sprite(Texture.from("/assets/guglielmo-portrait-square_6098a3a8.jpg"));
    portraitImage.position.set(x + 14, y + 14);
    portraitImage.width = 122;
    portraitImage.height = 110;
    g.addChild(portraitImage);
  }
  if (kind === "giulia") {
    const portraitImage = new Sprite(Texture.from("/assets/IMG_20260928_225333_19134708.jpg"));
    portraitImage.position.set(x + 14, y + 14);
    portraitImage.width = 122;
    portraitImage.height = 110;
    g.addChild(portraitImage);
  }
  if (kind === "lorenzo") {
    const portraitImage = new Sprite(Texture.from("/assets/lorenzo-portrait-square_019cee34.jpg"));
    portraitImage.position.set(x + 14, y + 14);
    portraitImage.width = 122;
    portraitImage.height = 110;
    g.addChild(portraitImage);
  }
  if (kind === "giovanni") {
    const portraitImage = new Sprite(Texture.from("/assets/giovanni-portrait-square_d36d548d.jpg"));
    portraitImage.position.set(x + 14, y + 14);
    portraitImage.width = 122;
    portraitImage.height = 110;
    g.addChild(portraitImage);
  }
  g.rect(x + 14, y + 124, 122, 12).fill({ color: 0xd0d0d0 });
}

function drawRoomObjects(g: Graphics) {
  // Portrait wall: seven distinct pixel-art faces.
  const portraits: PortraitKind[] = ["bernardo", "guglielmo", "giulia", "antonio", "leonardo", "giovanni", "lorenzo"];
  portraits.forEach((kind, index) => {
    const portrait = new Graphics({ label: `portrait-${kind}`, roundPixels: true });
    drawPortrait(portrait, 0, 0, kind);
    portrait.scale.set(0.66);
    portrait.position.set(250 + index * 200, 330);
    g.addChild(portrait);
  });

  // Table, box and projector: one stacked silhouette.
  g.rect(620, 622, 84, 10).fill({ color: 0xffffff });
  g.rect(628, 632, 8, 18).fill({ color: 0xd8d8d8 });
  g.rect(688, 632, 8, 18).fill({ color: 0xd8d8d8 });
  g.rect(632, 602, 60, 20).fill({ color: 0xf2f2f2 }).stroke({ color: 0x202020, width: 2, pixelLine: true });
  g.rect(648, 574, 30, 28).fill({ color: 0xf2f2f2 }).stroke({ color: 0x202020, width: 2, pixelLine: true });
  g.rect(653, 584, 20, 4).fill({ color: 0xb0b0b0 });
  g.rect(654, 558, 20, 16).fill({ color: 0xffffff }).stroke({ color: 0x202020, width: 2, pixelLine: true });
  g.rect(674, 562, 9, 7).fill({ color: 0xd0d0d0 });
  g.rect(683, 564, 7, 4).fill({ color: 0xffffff });
  g.rect(657, 575, 4, 3).fill({ color: 0x252525 });

  // Work ladder: two uprights and evenly spaced rungs.
  g.rect(1030, 474, 10, 176).fill({ color: 0xf2f2f2 });
  g.rect(1100, 474, 10, 176).fill({ color: 0xf2f2f2 });
  for (let y = 500; y <= 620; y += 30) {
    g.rect(1038, y, 62, 8).fill({ color: 0xffffff });
  }
  g.rect(1024, 468, 92, 8).fill({ color: 0xffffff });

  // Chair.
  g.rect(1490, 500, 110, 16).fill({ color: 0xffffff });
  g.rect(1490, 516, 16, 92).fill({ color: 0xd8d8d8 });
  g.rect(1584, 516, 16, 92).fill({ color: 0xd8d8d8 });
  g.rect(1490, 500, 16, 108).fill({ color: 0xffffff });
  g.rect(1490, 500, 110, 16).fill({ color: 0xffffff });
  g.rect(1506, 584, 78, 16).fill({ color: 0xf2f2f2 });

  // Small cage at the far end of Cura Anomala.
  const cageX = 1850;
  const cageY = 510;
  const cageW = 150;
  const cageH = BASE_Y - cageY;
  g.rect(cageX, cageY, cageW, 8).fill({ color: 0xffffff });
  g.rect(cageX, cageY, 8, cageH).fill({ color: 0xf2f2f2 });
  g.rect(cageX + cageW - 8, cageY, 8, cageH).fill({ color: 0xf2f2f2 });
  g.rect(cageX, BASE_Y - 8, cageW, 8).fill({ color: 0xffffff });
  for (let x = cageX + 30; x < cageX + cageW - 8; x += 30) {
    g.rect(x, cageY + 8, 7, cageH - 16).fill({ color: 0xffffff });
  }
  g.rect(cageX + 8, cageY + 28, cageW - 16, 6).fill({ color: 0xd0d0d0 });
}

function drawPortraitRoomObjects(g: Graphics) {
  const portraits: PortraitKind[] = ["bernardo", "guglielmo", "giulia", "antonio", "leonardo", "giovanni", "lorenzo"];
  portraits.forEach((kind, index) => {
    const portrait = new Graphics({ label: `portrait-${kind}`, roundPixels: true });
    drawPortrait(portrait, 0, 0, kind);
    portrait.scale.set(0.66);
    portrait.position.set(PORTRAIT_START_X + index * PORTRAIT_SPACING, PORTRAIT_Y);
    g.addChild(portrait);
  });
}

function makeRoomWorld() {
  const world = new Container({ label: "room-world" });
  const backdrop = new Graphics({ label: "room-backdrop" });
  backdrop.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill({ color: 0x080808 });
  for (let x = 0; x < WORLD_WIDTH; x += 96) backdrop.rect(x, 0, 1, WORLD_HEIGHT).fill({ color: 0x191919 });
  for (let y = 0; y < WORLD_HEIGHT; y += 96) backdrop.rect(0, y, WORLD_WIDTH, 1).fill({ color: 0x151515 });
  backdrop.rect(0, BASE_Y, WORLD_WIDTH, 2).fill({ color: 0x343434 });
  world.addChild(backdrop);

  const structures = new Graphics({ label: "room-structures", roundPixels: true });
  drawPixelSurface(structures, { x: 0, y: BASE_Y, w: HOLE.x, h: 80 });
  drawPixelSurface(structures, { x: HOLE.x + HOLE.w, y: BASE_Y, w: WORLD_WIDTH - HOLE.x - HOLE.w, h: 80 });
  structures.rect(HOLE.x, BASE_Y, HOLE.w, 80).fill({ color: 0x020202 });
  structures.rect(HOLE.x, BASE_Y, HOLE.w, 3).fill({ color: 0x555555 });
  drawDoor(structures, RETURN_DOOR.x, RETURN_DOOR.y);
  drawPortraitRoomObjects(structures);
  world.addChild(structures);
  const portraitNames = ["BERNARDO", "GUGLIELMO", "GIULIA", "ANTONIO", "LEONARDO", "GIOVANNI", "LORENZO"];
  const nameStyle = new TextStyle({ fontFamily: "monospace", fontSize: 7, fill: 0x181818, letterSpacing: 0.25 });
  portraitNames.forEach((name, index) => {
    const label = new Text({ text: name, style: nameStyle });
    label.anchor.set(0.5, 0);
    label.position.set(PORTRAIT_START_X + index * PORTRAIT_SPACING + 49.5, PORTRAIT_Y + 82);
    world.addChild(label);
  });
  return world;
}

export default function RoomCanvas() {
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
      app.canvas.setAttribute("aria-label", "Stanza 01, sala degli oggetti");
      const resizeObserver = new ResizeObserver(() => {
        const rect = host.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) app.renderer.resize(Math.floor(rect.width), Math.floor(rect.height));
      });
      resizeObserver.observe(host);
      app.resize();

      await Assets.load([
        "/assets/leonardo-portrait-square_66dd7e60.jpg",
        "/assets/antonio-portrait-square_0a07abe0.jpg",
        "/assets/1790625621360_051be67b.png",
        "/assets/bernardo-portrait-square_6b86c2da.jpg",
        "/assets/guglielmo-portrait-square_6098a3a8.jpg",
        "/assets/giulia-profile-portrait_94aa42ed.png",
        "/assets/lorenzo-profile-portrait_6eb9a057.png",
        "/assets/giovanni-profile-portrait_1811d7c7.png",
        "/assets/IMG_20260928_225333_19134708.jpg",
        "/assets/lorenzo-portrait-square_019cee34.jpg",
        "/assets/giovanni-portrait-square_d36d548d.jpg",
        "/assets/1790625600775_cb0d2bcc.png",
        "/assets/1790625607312_6e1e91af.png",
        "/assets/1790625614980_82d80014.png",
        "/assets/click-white_095dd50a.png",
      ]);
      const homeTextures = await Assets.load([HOME_BUTTON_OFF_ASSET, HOME_BUTTON_ON_ASSET]) as Record<string, Texture>;
      const doorPromptTexture = await Assets.load(DOOR_PROMPT_ASSET) as Texture;
      const world = makeRoomWorld();
      app.stage.addChild(world);
      const doorPrompt = createDoorPrompt(doorPromptTexture, RETURN_DOOR.x, RETURN_DOOR.y, DOOR_WIDTH, DOOR_HEIGHT);
      world.addChild(doorPrompt);
      const doorGlow = createDoorGlow(RETURN_DOOR.x, RETURN_DOOR.y, DOOR_WIDTH, DOOR_HEIGHT);
      world.addChild(doorGlow);
      const portraitHitAreas = new Container({ label: "portrait-hit-areas" });
      const portraitProfiles: Record<PortraitKind, { role: string; bio: string; skills: [string, number][]; weakness: string }> = {
        bernardo: { role: "ESPLORATORE", bio: "Scheda in preparazione.", skills: [["VISIONE", 5], ["PRECISIONE", 4], ["CURIOSITA", 5]], weakness: "???" },
        guglielmo: { role: "IMMAGINATORE", bio: "Scheda in preparazione.", skills: [["ENERGIA", 5], ["FANTASIA", 5], ["ISTINTO", 4]], weakness: "???" },
        giulia: { role: "PROGRAMMATRICE", bio: "Programmatrice precisa e creativa: trasforma idee complesse in soluzioni semplici, mantiene la calma davanti ai problemi e trova sempre un modo elegante per far dialogare logica e immaginazione.", skills: [["ANALISI", 5], ["CALMA", 4], ["INTUITO", 5]], weakness: "PATATINE DOPO MEZZANOTTE" },
        antonio: { role: "ARTISTA VISIVO", bio: "Artista visivo, pittore, grafico, attento alla performance art. Impegnato nel collettivo a sviluppare ogni aspetto visivo.", skills: [["PITTURA", 5], ["GRAFICA", 5], ["PERFORMANCE", 4]], weakness: "LATTOSIO" },
        leonardo: { role: "RICERCATORE", bio: "Scheda in preparazione.", skills: [["RICERCA", 5], ["ASCOLTO", 4], ["MEMORIA", 5]], weakness: "???" },
        lorenzo: { role: "MENTORE", bio: "Scheda in preparazione.", skills: [["ESPERIENZA", 5], ["EQUILIBRIO", 5], ["GUIDA", 4]], weakness: "???" },
        giovanni: { role: "PIONIERE", bio: "Scheda in preparazione.", skills: [["AGILITA", 5], ["CORAGGIO", 4], ["SILENZIO", 5]], weakness: "???" },
      };
      const portraitImages: Record<PortraitKind, string> = {
        bernardo: "/assets/1790625614980_82d80014.png",
        guglielmo: "/assets/1790625607312_6e1e91af.png",
        giulia: "/assets/giulia-profile-portrait_94aa42ed.png",
        antonio: "/assets/1790625621360_051be67b.png",
        leonardo: "/assets/1790625600775_cb0d2bcc.png",
        lorenzo: "/assets/lorenzo-profile-portrait_6eb9a057.png",
        giovanni: "/assets/giovanni-profile-portrait_1811d7c7.png",
      };
      const portraitKinds: PortraitKind[] = ["bernardo", "guglielmo", "giulia", "antonio", "leonardo", "giovanni", "lorenzo"];
      const infoModal = new Container({ label: "portrait-info-modal" });
      const modalBackdrop = new Graphics({ label: "portrait-info-backdrop" });
      infoModal.addChild(modalBackdrop);
      const modalPanel = new Graphics({ label: "portrait-info-panel" });
      infoModal.addChild(modalPanel);
      const modalTitle = new Text({ text: "ANTONIO", style: new TextStyle({ fontFamily: "monospace", fontSize: 16, fill: 0x111111, letterSpacing: 2 }) });
      const modalRole = new Text({ text: "ARTISTA VISIVO", style: new TextStyle({ fontFamily: "monospace", fontSize: 10, fill: 0x555555, letterSpacing: 1 }) });
      const modalBody = new Text({ text: "", style: new TextStyle({ fontFamily: "monospace", fontSize: 15, fill: 0x111111, lineHeight: 23, wordWrap: true, wordWrapWidth: 480 }) });
      const modalSkills = new Text({ text: "SKILL", style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: 0x111111, lineHeight: 20, letterSpacing: 0.5 }) });
      const modalWeakness = new Text({ text: "PUNTO DEBOLE // ???", style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: 0x111111, letterSpacing: 0.5 }) });
      const modalPhoto = new Sprite(Texture.from(portraitImages.antonio));
      modalPhoto.label = "portrait-info-photo";
      modalPhoto.anchor.set(0.5);
      const modalPhotoFrame = new Graphics({ label: "portrait-info-photo-frame" });
      const modalPhotoLabel = new Text({ text: "PHOTO // PROFILE", style: new TextStyle({ fontFamily: "monospace", fontSize: 8, fill: 0xa6a6a6, letterSpacing: 1 }) });
      const modalClose = new Graphics({ label: "portrait-info-close" });
      modalClose.rect(-14, -14, 28, 28).fill({ color: 0x202020 });
      modalClose.moveTo(-6, -6).lineTo(6, 6).stroke({ color: 0xffffff, width: 2, pixelLine: true });
      modalClose.moveTo(6, -6).lineTo(-6, 6).stroke({ color: 0xffffff, width: 2, pixelLine: true });
      modalClose.eventMode = "static";
      modalClose.cursor = "pointer";
      modalClose.on("pointertap", () => { infoModal.visible = false; });
      infoModal.addChild(modalTitle, modalRole, modalBody, modalSkills, modalWeakness, modalPhotoFrame, modalPhoto, modalPhotoLabel, modalClose);
      infoModal.visible = false;
      app.stage.addChild(infoModal);
      const layoutModal = () => {
        const width = Math.min(760, Math.max(300, app.screen.width - 48));
        const panelHeight = width < 400 ? 400 : 340;
        const photoWidth = width < 480 ? 78 : 112;
        const photoHeight = Math.round(photoWidth / (704 / 1280));
        const textWidth = width - photoWidth - 72;
        const panelX = Math.round((app.screen.width - width) / 2);
        const panelY = Math.round((app.screen.height - panelHeight) / 2);
        modalBackdrop.clear();
        modalBackdrop.rect(0, 0, app.screen.width, app.screen.height).fill({ color: 0x000000, alpha: 0.52 });
        modalPanel.clear();
        modalPanel.rect(panelX, panelY, width, panelHeight).fill({ color: 0xd0d0d0 }).stroke({ color: 0xffffff, width: 3, pixelLine: true });
        modalPanel.rect(panelX + 10, panelY + 10, width - 20, panelHeight - 20).stroke({ color: 0x777777, width: 1, pixelLine: true });
        modalPanel.rect(panelX + 10, panelY + 10, width - 20, 4).fill({ color: 0x202020 });
        modalTitle.position.set(panelX + 24, panelY + 24);
        modalRole.position.set(panelX + 24, panelY + 52);
        modalBody.style = new TextStyle({ fontFamily: "monospace", fontSize: width < 400 ? 10 : 13, fill: 0x111111, lineHeight: width < 400 ? 16 : 20, wordWrap: true, wordWrapWidth: textWidth });
        modalBody.position.set(panelX + 24, panelY + 78);
        modalSkills.style = new TextStyle({ fontFamily: "monospace", fontSize: width < 400 ? 9 : 11, fill: 0x111111, lineHeight: width < 400 ? 17 : 20, letterSpacing: 0.5, wordWrap: true, wordWrapWidth: textWidth });
        modalSkills.position.set(panelX + 24, modalBody.position.y + modalBody.height + 16);
        modalWeakness.style = new TextStyle({ fontFamily: "monospace", fontSize: width < 400 ? 9 : 11, fill: 0x111111, letterSpacing: 0.5 });
        modalWeakness.position.set(panelX + 24, modalSkills.position.y + modalSkills.height + 14);
        const photoX = panelX + width - photoWidth - 34;
        const photoY = panelY + 68;
        modalPhotoFrame.clear();
        modalPhotoFrame.rect(photoX - 8, photoY - 8, photoWidth + 16, photoHeight + 16).fill({ color: 0x202020 }).stroke({ color: 0xffffff, width: 2, pixelLine: true });
        modalPhotoFrame.rect(photoX - 3, photoY - 3, photoWidth + 6, photoHeight + 6).stroke({ color: 0x777777, width: 1, pixelLine: true });
        modalPhoto.position.set(photoX + photoWidth / 2, photoY + photoHeight / 2);
        const modalRatio = modalPhoto.texture.width / modalPhoto.texture.height;
        modalPhoto.width = modalRatio >= photoWidth / photoHeight ? photoWidth : Math.round(photoHeight * modalRatio);
        modalPhoto.height = modalRatio >= photoWidth / photoHeight ? Math.round(photoWidth / modalRatio) : photoHeight;
        modalPhotoLabel.position.set(photoX, photoY + photoHeight + 16);
        modalClose.position.set(panelX + width - 22, panelY + 22);
      };
      const openPortraitInfo = (kind: PortraitKind) => {
        const profile = portraitProfiles[kind];
        modalTitle.text = kind.toUpperCase();
        modalRole.text = `// ${profile.role}`;
        modalBody.text = profile.bio;
        modalSkills.text = `SKILL\n${profile.skills.map(([name, value]) => `${name.padEnd(11, " ")} ${"█".repeat(value)}${"░".repeat(5 - value)}`).join("\n")}`;
        modalWeakness.text = `PUNTO DEBOLE // ${profile.weakness}`;
        modalPhoto.texture = Texture.from(portraitImages[kind]);
        layoutModal();
        infoModal.visible = true;
      };
      portraitKinds.forEach((kind, index) => {
        const hit = new Graphics({ label: `portrait-hit-${kind}` });
        hit.rect(0, 0, 99, 99).fill({ color: 0xffffff, alpha: 0.001 });
        hit.position.set(PORTRAIT_START_X + index * PORTRAIT_SPACING, PORTRAIT_Y);
        hit.eventMode = "static";
        hit.cursor = "pointer";
        hit.on("pointertap", () => openPortraitInfo(kind));
        portraitHitAreas.addChild(hit);
      });
      portraitHitAreas.eventMode = "static";
      portraitHitAreas.interactiveChildren = true;
      world.addChild(portraitHitAreas);
      const portraitCue = new Container({ label: "portrait-interaction-cue" });
      const cueFrame = new Graphics({ label: "portrait-cue-frame", roundPixels: true });
      cueFrame.rect(-53, -53, 106, 106).stroke({ color: 0xffffff, width: 2, pixelLine: true });
      cueFrame.rect(-49, -49, 98, 98).stroke({ color: 0xa6a6a6, width: 1, pixelLine: true });
      portraitCue.addChild(cueFrame);
      portraitCue.visible = false;
      world.addChild(portraitCue);
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

      const hud = new Container({ label: "room-hud" });
      const hudStyle = new TextStyle({ fontFamily: "monospace", fontSize: 13, fill: 0xf2f2f2, letterSpacing: 2 });
      const title = new Text({ text: "SALA RITRATTI  /  02", style: hudStyle });
      title.position.set(18, 18);
      hud.addChild(title);
      const hint = new Text({ text: "← → MOVE     SPACE JUMP     ↑ EXIT", style: new TextStyle({ ...hudStyle, fontSize: 11, fill: 0xa6a6a6, letterSpacing: 1 }) });
      hint.position.set(18, 42);
      hud.addChild(hint);
      app.stage.addChild(hud);
      const homeButton = addFixedHomeButton(app, navigate, homeTextures[HOME_BUTTON_OFF_ASSET], homeTextures[HOME_BUTTON_ON_ASSET]);

      const playerState = { x: ROOM_SPAWN_X, y: BASE_Y - PLAYER_HEIGHT, vx: 0, vy: 0, grounded: true, jumpLock: false };
      const returningToHub = sessionStorage.getItem("return-to-hub") === "1";
      sessionStorage.removeItem("return-to-hub");
      let cameraX = Math.max(0, Math.min(Math.max(0, WORLD_WIDTH - app.screen.width), ROOM_SPAWN_X - app.screen.width * 0.35));
      let cameraY = 0;
      let elapsed = 0;
      let facing: 1 | -1 = -1;
      let cuePortraitIndex = -1;
      let cueGlowTime = 0;
      const portraitCenters = Array.from({ length: 7 }, (_, index) => ({ x: PORTRAIT_START_X + index * PORTRAIT_SPACING + 49.5, y: PORTRAIT_Y + 49.5 }));
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
      const baseSurfaces: Surface[] = [{ x: 0, y: BASE_Y, w: HOLE.x, h: 80 }, { x: HOLE.x + HOLE.w, y: BASE_Y, w: WORLD_WIDTH - HOLE.x - HOLE.w, h: 80 }];

      const frame = (ticker: Ticker) => {
        const dt = Math.min(ticker.deltaMS / 1000, 0.033);
        homeButton.position();
        elapsed += dt;
        const direction = Number(input.right) - Number(input.left);
        playerState.vx += (direction * WALK_SPEED - playerState.vx) * Math.min(1, dt * 12);
        if (direction !== 0) facing = direction > 0 ? 1 : -1;
        const nearReturnDoor = Math.abs(playerState.x + PLAYER_WIDTH / 2 - (RETURN_DOOR.x + DOOR_WIDTH / 2)) < 52 && Math.abs(playerState.y - RETURN_DOOR.y) < 86;
        setDoorPromptVisible(doorPrompt, nearReturnDoor, elapsed);
        setDoorGlowVisible(doorGlow, nearReturnDoor, elapsed);
        if (input.jump && nearReturnDoor && playerState.grounded) {
          if (returningToHub) navigate("/hub");
          else {
            sessionStorage.setItem("return-from-portrait-room", "1");
            navigate("/");
          }
          return;
        }
        if (input.jump && playerState.grounded && !playerState.jumpLock) { playerState.vy = -JUMP_SPEED; playGameSound("jump"); playerState.grounded = false; playerState.jumpLock = true; }
        if (!input.jump) playerState.jumpLock = false;
        playerState.vy += GRAVITY * dt;
        const previousBottom = playerState.y + PLAYER_HEIGHT;
        playerState.x += playerState.vx * dt;
        playerState.x = Math.max(0, Math.min(WORLD_WIDTH - PLAYER_WIDTH, playerState.x));
        playerState.y += playerState.vy * dt;
        playerState.grounded = false;
        if (playerState.vy >= 0) {
          for (const surface of baseSurfaces) {
            if (previousBottom <= surface.y && playerState.x < surface.x + surface.w && playerState.x + PLAYER_WIDTH > surface.x && playerState.y < surface.y + surface.h && playerState.y + PLAYER_HEIGHT > surface.y) {
              playerState.y = surface.y - PLAYER_HEIGHT;
              playerState.vy = 0;
              playerState.grounded = true;
              break;
            }
          }
        }
        const currentBottom = playerState.y + PLAYER_HEIGHT;
        if (previousBottom <= BASE_Y && currentBottom > BASE_Y && playerState.vy > 0) playGameSound("fall");
        if (playerState.y > WORLD_HEIGHT + 120) {
          sessionStorage.removeItem("return-from-cura-anomala");
          sessionStorage.removeItem("return-from-portrait-room");
          sessionStorage.removeItem("home-return-side");
          navigate("/game");
          return;
        }
        const screenWidth = app.screen.width;
        const screenHeight = app.screen.height;
        cameraX += ((playerState.x - screenWidth * 0.35) - cameraX) * Math.min(1, dt * 5);
        cameraY += ((playerState.y - screenHeight * 0.5) - cameraY) * Math.min(1, dt * 5);
        cameraX = Math.max(0, Math.min(Math.max(0, WORLD_WIDTH - screenWidth), cameraX));
        cameraY = Math.max(0, Math.min(Math.max(0, WORLD_HEIGHT - screenHeight), cameraY));
        world.position.set(Math.round(-cameraX), Math.round(-cameraY));
        drawPlayer(Math.abs(playerState.vx) > 12 ? elapsed * 10 : 0, facing);
        player.position.set(Math.round(playerState.x), Math.round(playerState.y));
        title.alpha = 0.88 + Math.sin(elapsed * 2) * 0.08;
        let nearestPortrait = -1;
        let nearestDistance = Number.POSITIVE_INFINITY;
        portraitCenters.forEach((center, index) => {
          const dx = playerState.x + PLAYER_WIDTH / 2 - center.x;
          const dy = playerState.y + PLAYER_HEIGHT / 2 - center.y;
          const distance = Math.hypot(dx, dy);
          if (distance < nearestDistance) { nearestDistance = distance; nearestPortrait = index; }
        });
        const nearPortrait = nearestPortrait >= 0 && nearestDistance < 220;
        if (infoModal.visible) layoutModal();
        if (!nearPortrait) {
          cuePortraitIndex = -1;
          cueGlowTime = 0;
        } else if (nearestPortrait !== cuePortraitIndex) {
          cuePortraitIndex = nearestPortrait;
          cueGlowTime = 1.25;
        }
        cueGlowTime = Math.max(0, cueGlowTime - dt);
        const showPortraitCue = nearPortrait;
        portraitCue.visible = showPortraitCue;
        if (showPortraitCue) {
          const center = portraitCenters[nearestPortrait];
          portraitCue.position.set(center.x, center.y);
          const glowProgress = 1 - cueGlowTime / 1.25;
          const glowPulse = glowProgress < 0.42 ? Math.sin(glowProgress / 0.42 * Math.PI) : 0;
          cueFrame.alpha = 0.5 + glowPulse * 0.5;
        }
      };
      app.ticker.add(frame);
      return () => { app.ticker.remove(frame); resizeObserver.disconnect(); window.removeEventListener("keydown", keyDown); window.removeEventListener("keyup", keyUp); app.destroy(true, { children: true }); };
    };
    let cleanup: (() => void) | undefined;
    run().then((fn) => { cleanup = fn; });
    return () => { disposed = true; cleanup?.(); };
  }, [navigate]);

  const setButton = (key: keyof InputState, value: boolean) => (event: React.PointerEvent<HTMLButtonElement>) => { event.preventDefault(); inputRef.current[key] = value; event.currentTarget.setPointerCapture?.(event.pointerId); };
  return (
    <div ref={hostRef} className="game-shell">
      <div className="game-vignette" aria-hidden="true" />
      <div className="touch-controls" aria-label="Controlli touch">
        <button type="button" className="touch-button touch-left" onPointerDown={setButton("left", true)} onPointerUp={setButton("left", false)} onPointerCancel={setButton("left", false)} aria-label="Sinistra">←</button>
        <button type="button" className="touch-button touch-right" onPointerDown={setButton("right", true)} onPointerUp={setButton("right", false)} onPointerCancel={setButton("right", false)} aria-label="Destra">→</button>
        <button type="button" className="touch-button touch-jump" onPointerDown={setButton("jump", true)} onPointerUp={setButton("jump", false)} onPointerCancel={setButton("jump", false)} aria-label="Salta o esci">↑</button>
      </div>
      <div className="mobile-note">TOUCH MODE / HOLD TO MOVE</div>
    </div>
  );
}
