import { useEffect, useRef } from "react";
import { Application, Assets, Container, Graphics, HTMLText, Rectangle, Sprite, Text, TextStyle, Ticker, Texture, VideoSource } from "pixi.js";
import { useLocation } from "wouter";
import { playGameSound } from "@/lib/gameAudio";
import { addFixedHomeButton, HOME_BUTTON_OFF_ASSET, HOME_BUTTON_ON_ASSET } from "@/lib/homeButton";
import { createDoorGlow, DOOR_PROMPT_ASSET, setDoorGlowVisible, createDoorPrompt, setDoorPromptVisible } from "@/lib/doorPrompt";

type InputState = { left: boolean; right: boolean; jump: boolean };
type Surface = { x: number; y: number; w: number; h: number };

const WORLD_HEIGHT = 900;
const PLAYER_WIDTH = 24;
const PLAYER_HEIGHT = 48;
const DOOR_WIDTH = 48;
const DOOR_HEIGHT = 72;
const BASE_Y = 650;
const GRAVITY = 1500;
const WALK_SPEED = 250;
const JUMP_SPEED = 700;
const PANEL_Y = 200;
const PANEL_H = BASE_Y;
const PLAYER_FLOOR_Y = PANEL_Y + PANEL_H;
// In questa stanza la piattaforma base coincide con le coordinate dei piedi del personaggio,
// cioè con la quota del bordo inferiore delle foto.
const DOCUMENTATION_BASE_Y = PLAYER_FLOOR_Y;
const RETURN_DOOR = { x: 245, y: DOCUMENTATION_BASE_Y - DOOR_HEIGHT };
const ENTRANCE_TEXT_HEIGHT = 300;
const ENTRANCE_TEXT_WIDTH = 620;
const ENTRANCE_TEXT_PADDING_X = 40;
const ENTRANCE_TEXT_PADDING_TOP = 28;
const ENTRANCE_TEXT_TOP_IN_BACKGROUND = 156;
const ENTRANCE_TEXT_GAP = 2;
const ENTRANCE_TEXT_FOOTER_GAP = 16;
const ENTRANCE_TEXT_FOOTER_HEIGHT = 18;
const ENTRANCE_TEXT_Y = RETURN_DOOR.y
  - ENTRANCE_TEXT_GAP
  - ENTRANCE_TEXT_FOOTER_HEIGHT
  - ENTRANCE_TEXT_FOOTER_GAP
  - ENTRANCE_TEXT_HEIGHT
  - ENTRANCE_TEXT_TOP_IN_BACKGROUND;
const ROOM_SPAWN_X = RETURN_DOOR.x + DOOR_WIDTH + 18;
const PANEL_W = 600;
// Intro e outro sono stati rimossi: la sequenza parte direttamente dalla prima foto.
const PANEL_START_X = 1160;
const FIRST_COLUMN_X = PANEL_START_X - 20;
const DOOR_TO_PHOTO_MIDPOINT = RETURN_DOOR.x + DOOR_WIDTH / 2 + (PANEL_START_X - (RETURN_DOOR.x + DOOR_WIDTH / 2)) / 2;
const ENTRANCE_TEXT_X = DOOR_TO_PHOTO_MIDPOINT - 54 - ENTRANCE_TEXT_WIDTH / 2;
const DOCUMENTATION_PLATFORMS: Surface[] = [
  { x: 1320, y: 450, w: 260, h: 24 },
  { x: 1960, y: 550, w: 230, h: 24 },
  { x: 2590, y: 430, w: 250, h: 24 },
];
const PHOTO_ASSETS = [
  "/assets/1_5cbc0f45.webp",
  "/assets/2_7a79565a.webp",
  "/assets/3_e04b02e9.webp",
  "/assets/4_5cd747aa.webp",
];
const VIDEO_ASSET = "/assets/documentaz_5d4d6389.mp4";
const VIDEO_FALLBACK_ASSET = "/assets/documentaz-fallback_3c84a7c6.jpg";
const LAST_PHOTO_END_X = PANEL_START_X + (PHOTO_ASSETS.length + 1) * PANEL_W;
const DOCUMENTATION_HOLE = {
  x: LAST_PHOTO_END_X + 80,
  w: 300,
};
const WORLD_WIDTH = DOCUMENTATION_HOLE.x + DOCUMENTATION_HOLE.w + 180;

function getBaseSurfaces(): Surface[] {
  return [
    { x: 0, y: DOCUMENTATION_BASE_Y, w: DOCUMENTATION_HOLE.x, h: 80 },
    {
      x: DOCUMENTATION_HOLE.x + DOCUMENTATION_HOLE.w,
      y: DOCUMENTATION_BASE_Y,
      w: WORLD_WIDTH - (DOCUMENTATION_HOLE.x + DOCUMENTATION_HOLE.w),
      h: 80,
    },
  ];
}

function drawSurface(g: Graphics, surface: Surface) {
  g.rect(surface.x, surface.y, surface.w, surface.h).fill({ color: 0xf2f2f2 });
  g.rect(surface.x, surface.y, surface.w, 5).fill({ color: 0xffffff });
  g.rect(surface.x, surface.y + surface.h - 6, surface.w, 6).fill({ color: 0x8a8a8a });
  for (let x = surface.x + 12; x < surface.x + surface.w - 8; x += 28) {
    g.rect(x, surface.y + 13, 11, 4).fill({ color: 0xbcbcbc, alpha: 0.75 });
  }
}

function drawReturnGlow(g: Graphics) {
  g.rect(-16, -12, DOOR_WIDTH + 32, DOOR_HEIGHT + 24).fill({ color: 0xbfc7d0, alpha: 0.08 });
  g.rect(-9, -7, DOOR_WIDTH + 18, DOOR_HEIGHT + 14).fill({ color: 0xdde7ef, alpha: 0.14 });
  g.rect(-3, -2, DOOR_WIDTH + 6, DOOR_HEIGHT + 4).fill({ color: 0xf4f8fa, alpha: 0.72 });
  g.rect(5, 5, DOOR_WIDTH - 10, DOOR_HEIGHT - 10).fill({ color: 0x20252a, alpha: 0.94 });
  g.rect(8, 8, DOOR_WIDTH - 16, 3).fill({ color: 0xffffff, alpha: 0.9 });
}

function drawDocumentationHole(g: Graphics) {
  g.rect(DOCUMENTATION_HOLE.x, DOCUMENTATION_BASE_Y, DOCUMENTATION_HOLE.w, 80).fill({ color: 0x050505 });
  g.rect(DOCUMENTATION_HOLE.x, DOCUMENTATION_BASE_Y, 8, 80).fill({ color: 0x252525 });
  g.rect(DOCUMENTATION_HOLE.x + DOCUMENTATION_HOLE.w - 8, DOCUMENTATION_BASE_Y, 8, 80).fill({ color: 0x252525 });
}
function addEntranceText(world: Container, viewportWidth: number) {
  const isMobile = viewportWidth <= 700;
  const boxWidth = isMobile ? 300 : ENTRANCE_TEXT_WIDTH;
  const boxHeight = isMobile ? 390 : ENTRANCE_TEXT_HEIGHT;
  const boxX = isMobile ? 0 : 54;
  const boxY = isMobile ? 0 : 156;
  const paddingX = isMobile ? 18 : ENTRANCE_TEXT_PADDING_X;
  const paddingTop = isMobile ? 20 : ENTRANCE_TEXT_PADDING_TOP;
  const panel = new Container({ label: "documentation-entrance-text" });
  const panelBackground = new Graphics({ label: "documentation-entrance-text-background" });
  panelBackground.roundRect(boxX, boxY, boxWidth, boxHeight, 4).fill({ color: 0x111111, alpha: 0.94 });
  panelBackground.roundRect(boxX, boxY, boxWidth, boxHeight, 4).stroke({ color: 0x8f8f8f, alpha: 0.78, width: 2, pixelLine: true });
  panelBackground.rect(boxX + 16, boxY + 24, 5, boxHeight - 38).fill({ color: 0xd8d8d8, alpha: 0.9 });
  panel.addChild(panelBackground);
  const heading = new Text({
    text: "LA CURA ANOMALA, 2026",
    style: new TextStyle({
      fontFamily: "Press Start 2P, monospace",
      fontSize: isMobile ? 10 : 13,
      fill: 0xffffff,
      letterSpacing: 1,
    }),
  });
  heading.position.set(boxX + paddingX, boxY + paddingTop);
  panel.addChild(heading);
  const paragraph = new HTMLText({
    text: "Questo è il primo lavoro dell’OMA: si tratta di un ambiente composto da un’ installazione visiva site specific, musiche originali e un video interattivo. Girando una manovella posta sul lato di una scatola al centro dello spazio, lo spettatore apre una porta all’interno del video dalla quale esce un vampiro. Il materiale che abbiamo usato per il video proviene dal film di Friedrich Wilhelm Murnau “Nosferatu, eine Symphonie des Grauens” del 1922.",
    style: {
      fontFamily: "monospace",
      fontSize: isMobile ? 13 : 15,
      fill: 0xe5e5e5,
      letterSpacing: 1,
      lineHeight: isMobile ? 18 : 23,
      align: "justify",
      cssOverrides: ["text-align: justify;"],
      wordWrap: true,
      wordWrapWidth: boxWidth - paddingX * 2,
    },
  });
  paragraph.position.set(
    boxX + paddingX,
    boxY + paddingTop + heading.height + (isMobile ? 18 : 24),
  );
  panel.addChild(paragraph);
  const continuation = new Text({
    text: "CONTINUA A DESTRA -->",
    style: new TextStyle({
      fontFamily: "monospace",
      fontSize: isMobile ? 10 : 13,
      fill: 0xd8d8d8,
      letterSpacing: 1,
    }),
  });
  continuation.position.set(
    boxX + boxWidth - paddingX - continuation.width,
    boxY + boxHeight + ENTRANCE_TEXT_FOOTER_GAP,
  );
  panel.addChild(continuation);
  // Il testo guida resta sotto il pannello e appena sopra il bordo superiore della porta.
  panel.position.set(
    isMobile ? Math.max(10, (viewportWidth - boxWidth) / 2) : ENTRANCE_TEXT_X,
    isMobile ? 270 : ENTRANCE_TEXT_Y,
  );
  panel.alpha = 1;
  world.addChild(panel);
  return { panel, isMobile };
}
function makeWorld(viewportWidth: number) {
  const world = new Container({ label: "documentation-world" });
  const backdrop = new Graphics({ label: "documentation-backdrop" });
  backdrop.rect(0, 0, WORLD_WIDTH, WORLD_HEIGHT).fill({ color: 0x080808 });
  for (let x = 0; x < WORLD_WIDTH; x += 96) backdrop.rect(x, 0, 1, WORLD_HEIGHT).fill({ color: 0x191919 });
  for (let y = 0; y < WORLD_HEIGHT; y += 96) backdrop.rect(0, y, WORLD_WIDTH, 1).fill({ color: 0x151515 });
  world.addChild(backdrop);
  const entranceText = addEntranceText(world, viewportWidth);

  // La base viene prima delle immagini: resta dietro alla parete fotografica.
  const base = new Graphics({ label: "documentation-base", roundPixels: true });
  getBaseSurfaces().forEach((surface) => drawSurface(base, surface));
  world.addChild(base);
  drawDocumentationHole(base);

  const returnGlow = createDoorGlow(RETURN_DOOR.x, RETURN_DOOR.y, DOOR_WIDTH, DOOR_HEIGHT);
  world.addChild(returnGlow);
  return { world, returnGlow, entranceText };
}
function addFullWallPhotos(world: Container, textures: Record<string, Texture>) {
  PHOTO_ASSETS.forEach((asset, index) => {
    const mediaIndex = index < 2 ? index : index + 1;
    const panelX = PANEL_START_X + mediaIndex * PANEL_W;
    const panel = new Container({ label: `documentation-photo-${index + 1}` });
    const mask = new Graphics();
    mask.rect(0, 0, PANEL_W, PANEL_H).fill({ color: 0xffffff });
    panel.mask = mask;
    panel.addChild(mask);

    const image = new Sprite(textures[asset]);
    const scale = Math.max(PANEL_W / image.texture.width, PANEL_H / image.texture.height);
    image.scale.set(scale);
    image.position.set(
      (PANEL_W - image.width) / 2,
      (PANEL_H - image.height) / 2,
    );
    panel.addChild(image);
    panel.position.set(panelX, PANEL_Y);
    world.addChild(panel);
  });
}

function addVideoPanel(world: Container, video: HTMLVideoElement, fallbackTexture: Texture) {
  const panel = new Container({ label: "documentation-video-panel" });
  panel.sortableChildren = true;
  const media = new Container({ label: "documentation-video-media" });
  const mask = new Graphics();
  mask.rect(0, 0, PANEL_W, PANEL_H).fill({ color: 0xffffff });
  media.mask = mask;
  media.addChild(mask);
  panel.addChild(media);

  const fallback = new Sprite(fallbackTexture);
  const fallbackScale = Math.max(PANEL_W / fallback.texture.width, PANEL_H / fallback.texture.height);
  fallback.scale.set(fallbackScale);
  fallback.position.set((PANEL_W - fallback.width) / 2, (PANEL_H - fallback.height) / 2);
  fallback.label = "documentation-video-fallback";
  media.addChild(fallback);

  let image: Sprite | undefined;
  let videoTexture: Texture | undefined;
  let videoSource: VideoSource | undefined;
  let videoReady = video.videoWidth > 0 && video.videoHeight > 0;
  const ensureVideoSprite = () => {
    if (image || !video.videoWidth || !video.videoHeight) return;
    videoSource = new VideoSource({
      resource: video,
      autoLoad: false,
      autoPlay: false,
      updateFPS: 30,
      crossorigin: "anonymous",
      loop: true,
      muted: false,
      playsinline: true,
      preload: true,
    });
    videoSource.autoUpdate = true;
    void videoSource.load().catch(() => undefined);
    videoTexture = new Texture({ source: videoSource });
    image = new Sprite(videoTexture);
    const scale = Math.max(PANEL_W / video.videoWidth, PANEL_H / video.videoHeight);
    image.scale.set(scale);
    image.position.set((PANEL_W - image.width) / 2, (PANEL_H - image.height) / 2);
    image.alpha = 0;
    image.label = "documentation-video";
    media.addChild(image);
    // VideoSource mantiene l’aggiornamento della texture durante la riproduzione,
    // evitando che PixiJS resti bloccato sul primo fotogramma.
    videoReady = true;
  };
  ensureVideoSprite();

  const status = new Text({
    text: videoReady && video.readyState >= 3 ? "VIDEO PRONTO — AUDIO ON" : "CARICAMENTO VIDEO...",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: 0xffffff, letterSpacing: 1 }),
  });
  status.position.set(24, 24);
  panel.addChild(status);

  const controls = new Container({ label: "documentation-video-controls" });
  const controlsBackground = new Graphics();
  controlsBackground.roundRect(0, 0, 154, 34, 2).fill({ color: 0x090909, alpha: 0.92 }).stroke({ color: 0xe8e8e8, width: 2, pixelLine: true });
  controls.addChild(controlsBackground);
  const controlsLabel = new Text({
    text: "Ⅱ  PAUSA",
    style: new TextStyle({ fontFamily: "monospace", fontSize: 11, fill: 0xffffff, letterSpacing: 1 }),
  });
  controlsLabel.position.set(12, 10);
  controls.addChild(controlsLabel);
  // Il controllo resta dentro il quadro, sopra il video e allineato a destra.
  controls.position.set(PANEL_W - 154 - 16, PANEL_H - 34 - 16);
  controls.eventMode = "static";
  controls.cursor = "pointer";
  controls.hitArea = new Rectangle(0, 0, 154, 34);
  controls.zIndex = 4;
  controls.on("pointertap", () => {
    if (video.paused) {
      // Il gesto dell’utente autorizza l’audio se il browser aveva bloccato l’autoplay.
      video.muted = false;
      video.play().catch(() => {
        controlsLabel.text = "▶  RIPROVA";
        status.text = "PLAY BLOCCATO — RIPROVA";
      });
    } else {
      // Il video parte sempre da solo; il click durante la riproduzione mette
      // in pausa l’intero pannello, senza cambiare scena o usare il fallback.
      video.pause();
    }
  });
  panel.addChild(controls);

  const handlePlay = () => {
    ensureVideoSprite();
    fallback.alpha = 0;
    if (image) image.alpha = 1;
    status.alpha = 0;
    controlsLabel.text = "Ⅱ  PAUSA";
  };
  const handlePause = () => {
    controlsLabel.text = "▶  RIPRENDI";
  };
  const handleCanPlay = () => {
    ensureVideoSprite();
    if (video.paused) status.text = "VIDEO PRONTO — PREMI PLAY";
    else {
      fallback.alpha = 0;
      if (image) image.alpha = 1;
      status.alpha = 0;
    }
  };
  const handleError = () => {
    fallback.alpha = 1;
    if (image) image.alpha = 0;
    status.alpha = 1;
    status.text = "VIDEO NON DISPONIBILE";
  };
  video.addEventListener("loadedmetadata", ensureVideoSprite);
  video.addEventListener("loadeddata", ensureVideoSprite);
  video.addEventListener("play", handlePlay);
  video.addEventListener("pause", handlePause);
  video.addEventListener("canplay", handleCanPlay);
  video.addEventListener("error", handleError);
  panel.position.set(PANEL_START_X + 2 * PANEL_W, PANEL_Y);
  world.addChild(panel);
  return () => {
    controls.removeAllListeners();
    video.removeEventListener("loadedmetadata", ensureVideoSprite);
    video.removeEventListener("loadeddata", ensureVideoSprite);
    video.removeEventListener("play", handlePlay);
    video.removeEventListener("pause", handlePause);
    video.removeEventListener("canplay", handleCanPlay);
    video.removeEventListener("error", handleError);
    video.pause();
    videoTexture?.destroy(true);
  };
}

function addElevatedPlatforms(world: Container) {
  const platforms = new Graphics({ label: "documentation-elevated-platforms", roundPixels: true });
  DOCUMENTATION_PLATFORMS.forEach((platform) => drawSurface(platforms, platform));
  world.addChild(platforms);
}

function addColumns(world: Container) {
  const columns = new Graphics({ label: "documentation-columns", roundPixels: true });
  [FIRST_COLUMN_X, PANEL_START_X + PANEL_W - 20, PANEL_START_X + PANEL_W * 2 - 20, PANEL_START_X + PANEL_W * 3 - 20, PANEL_START_X + PANEL_W * 4 - 20].forEach((x) => {
    columns.rect(x, PANEL_Y, 40, PANEL_H).fill({ color: 0x5a5a5a });
    columns.rect(x + 5, PANEL_Y, 8, PANEL_H).fill({ color: 0xa4a4a4 });
    columns.rect(x + 28, PANEL_Y, 7, PANEL_H).fill({ color: 0x303030 });
    columns.rect(x - 7, PANEL_Y, 54, 8).fill({ color: 0xf0f0f0 });
    columns.rect(x - 7, PANEL_Y + PANEL_H - 8, 54, 8).fill({ color: 0xbcbcbc });
  });
  world.addChild(columns);
}

function addLabels(world: Container) {
  const title = new Text({ text: "STANZA DELLA DOCUMENTAZIONE", style: new TextStyle({ fontFamily: "Press Start 2P, monospace", fontSize: 14, fill: 0xffffff, letterSpacing: 1 }) });
  title.position.set(PANEL_START_X + 24, 24);
  world.addChild(title);
  const subtitle = new Text({ text: "ARCHIVIO VISIVO  /  01—04", style: new TextStyle({ fontFamily: "monospace", fontSize: 12, fill: 0xd0d0d0, letterSpacing: 2 }) });
  subtitle.position.set(PANEL_START_X + 26, 52);
  world.addChild(subtitle);
}

function drawPlayer(player: Graphics, walkPhase: number, facing: 1 | -1) {
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
}

function overlaps(a: { x: number; y: number; w: number; h: number }, b: Surface) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export default function DocumentationRoomCanvas() {
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
      app.canvas.setAttribute("aria-label", "Stanza della documentazione con quattro fotografie sceniche");
      const resizeObserver = new ResizeObserver(() => {
        const rect = host.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) app.renderer.resize(Math.floor(rect.width), Math.floor(rect.height));
      });
      resizeObserver.observe(host);
      app.resize();

      const loaded = await Assets.load([
        ...PHOTO_ASSETS,
        VIDEO_FALLBACK_ASSET,
        HOME_BUTTON_OFF_ASSET,
        HOME_BUTTON_ON_ASSET,
        DOOR_PROMPT_ASSET,
      ]) as Record<string, Texture>;
      const videoElement = document.createElement("video");
      // Il file viene servito da uno storage CDN diverso dall’origine della pagina.
      // crossOrigin deve essere impostato prima di src per evitare SecurityError in WebGL.
      videoElement.crossOrigin = "anonymous";
      videoElement.setAttribute("crossorigin", "anonymous");
      videoElement.src = VIDEO_ASSET;
      videoElement.loop = true;
      videoElement.muted = true;
      videoElement.autoplay = true;
      videoElement.playsInline = true;
      videoElement.preload = "auto";
      await new Promise<void>((resolve) => {
        if (videoElement.readyState >= 2) {
          resolve();
          return;
        }
        videoElement.addEventListener("loadedmetadata", () => resolve(), { once: true });
        videoElement.addEventListener("error", () => resolve(), { once: true });
        videoElement.load();
      });
      if (disposed) {
        videoElement.removeAttribute("src");
        videoElement.load();
        return;
      }
      const { world, returnGlow, entranceText } = makeWorld(app.screen.width);
      app.stage.addChild(world);
      const doorPrompt = createDoorPrompt(loaded[DOOR_PROMPT_ASSET], RETURN_DOOR.x, RETURN_DOOR.y, DOOR_WIDTH, DOOR_HEIGHT);
      world.addChild(doorPrompt);
      let removeVideoPanelListeners: () => void = () => undefined;
      // Le piattaforme sono nello strato scenografico dietro ai pannelli fotografici.
      addElevatedPlatforms(world);
      // Foto sopra la base, senza cornici.
      addFullWallPhotos(world, loaded);
      removeVideoPanelListeners = addVideoPanel(world, videoElement, loaded[VIDEO_FALLBACK_ASSET]);
      // Tentiamo subito l’autoplay con audio. Se il browser lo blocca, il video
      // parte comunque in silenzioso e il primo gesto dell’utente abilita l’audio.
      videoElement.muted = false;
      const startVideoWithAudio = () => {
        videoElement.muted = false;
        return videoElement.play().catch(() => {
          videoElement.muted = true;
          return videoElement.play().catch(() => undefined);
        });
      };
      const unlockVideoAudio = () => {
        videoElement.muted = false;
        void videoElement.play().catch(() => undefined);
        window.removeEventListener("pointerdown", unlockVideoAudio);
      };
      window.addEventListener("pointerdown", unlockVideoAudio, { passive: true });
      void startVideoWithAudio();
      addLabels(world);

      // Il personaggio viene dopo le foto, quindi passa davanti alle immagini.
      const player = new Graphics({ label: "player", roundPixels: true });
      drawPlayer(player, 0, 1);
      world.addChild(player);
      // Le colonne vengono dopo il personaggio, quindi lo coprono quando le attraversa.
      addColumns(world);

      const homeButton = addFixedHomeButton(app, navigate, loaded[HOME_BUTTON_OFF_ASSET], loaded[HOME_BUTTON_ON_ASSET]);

      const playerState = { x: ROOM_SPAWN_X, y: PLAYER_FLOOR_Y - PLAYER_HEIGHT, vx: 0, vy: 0, grounded: true, jumpLock: false };
      let cameraX = 0;
      let cameraY = 0;
      let elapsed = 0;
      let facing: 1 | -1 = 1;
      const surfaces: Surface[] = [...getBaseSurfaces(), ...DOCUMENTATION_PLATFORMS];
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
        const playerCenter = playerState.x + PLAYER_WIDTH / 2;
        const returnDoorCenter = RETURN_DOOR.x + DOOR_WIDTH / 2;
        const nearReturnDoor = Math.abs(playerCenter - returnDoorCenter) < 86
          && Math.abs(playerState.y - RETURN_DOOR.y) < 86;
        setDoorPromptVisible(doorPrompt, nearReturnDoor, elapsed);
        if (input.jump && nearReturnDoor && playerState.grounded && !playerState.jumpLock) {
          sessionStorage.setItem("return-from-documentation", "1");
          navigate("/stanza-intermedia");
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
        // La stanza è circolare: oltrepassare un margine riporta il personaggio
        // dal lato opposto senza interrompere il movimento.
        let wrappedToRight = false;
        let wrappedToLeft = false;
        if (playerState.x + PLAYER_WIDTH < 0) {
          // Ricompare completamente dentro il margine destro: così la hitbox
          // continua a sovrapporsi alla piattaforma già nel frame del wrap.
          playerState.x = WORLD_WIDTH - PLAYER_WIDTH;
          wrappedToRight = true;
        }
        if (playerState.x > WORLD_WIDTH) {
          // Ricompare completamente dentro il margine sinistro, evitando un
          // frame senza collisione con la base.
          playerState.x = 0;
          wrappedToLeft = true;
        }
        playerState.y += playerState.vy * dt;
        playerState.grounded = false;
        if (playerState.vy >= 0) {
          for (const surface of surfaces) {
            if (previousBottom <= surface.y && overlaps({ x: playerState.x, y: playerState.y, w: PLAYER_WIDTH, h: PLAYER_HEIGHT }, surface)) {
              playerState.y = surface.y - PLAYER_HEIGHT;
              playerState.vy = 0;
              playerState.grounded = true;
              break;
            }
          }
        }
        const currentBottom = playerState.y + PLAYER_HEIGHT;
        if (previousBottom <= PLAYER_FLOOR_Y && currentBottom > PLAYER_FLOOR_Y && playerState.vy > 0) playGameSound("fall");
        const insideDocumentationHole = playerState.x + PLAYER_WIDTH > DOCUMENTATION_HOLE.x
          && playerState.x < DOCUMENTATION_HOLE.x + DOCUMENTATION_HOLE.w;
        if (insideDocumentationHole && previousBottom <= PLAYER_FLOOR_Y && currentBottom > PLAYER_FLOOR_Y && playerState.vy > 0) {
          sessionStorage.setItem("return-from-documentation-right-hole", "1");
          navigate("/stanza-intermedia");
          return;
        }
        if (playerState.y > WORLD_HEIGHT + 120) {
          playerState.x = ROOM_SPAWN_X;
          playerState.y = PLAYER_FLOOR_Y - PLAYER_HEIGHT;
          playerState.vy = 0;
        }
        const screenWidth = app.screen.width;
        homeButton.position();
        if (entranceText.isMobile) {
          // Sul mobile il box segue la viewport, non la coordinata del mondo:
          // resta leggibile anche quando la camera avanza verso le foto.
          entranceText.panel.position.x = cameraX + Math.max(10, (screenWidth - entranceText.panel.width) / 2);
        }
        if (wrappedToRight) {
          cameraX = Math.max(0, WORLD_WIDTH - screenWidth);
        } else if (wrappedToLeft) {
          cameraX = 0;
        } else {
          cameraX += ((playerState.x - screenWidth * 0.35) - cameraX) * Math.min(1, dt * 5);
        }
        cameraX = Math.max(0, Math.min(WORLD_WIDTH - screenWidth, cameraX));
        world.x = Math.round(-cameraX);
        const screenHeight = app.screen.height;
        cameraY += ((playerState.y - screenHeight * 0.58) - cameraY) * Math.min(1, dt * 5);
        cameraY = Math.max(0, Math.min(Math.max(0, WORLD_HEIGHT - screenHeight), cameraY));
        world.y = Math.round(-cameraY);
        player.position.set(Math.round(playerState.x), Math.round(playerState.y));
        drawPlayer(player, Math.abs(playerState.vx) > 12 ? elapsed * 10 : 0, facing);
        setDoorGlowVisible(returnGlow, nearReturnDoor, elapsed);
      };
      app.ticker.add(frame);
      return () => {
        app.ticker.remove(frame);
        resizeObserver.disconnect();
        window.removeEventListener("keydown", keyDown);
        window.removeEventListener("keyup", keyUp);
        window.removeEventListener("pointerdown", unlockVideoAudio);
        removeVideoPanelListeners();
        videoElement.muted = true;
        videoElement.pause();
        videoElement.removeAttribute("src");
        videoElement.load();
        app.destroy(true, { children: true });
      };
    };
    let cleanup: (() => void) | undefined;
    run().then((fn) => { cleanup = fn; });
    return () => { disposed = true; cleanup?.(); };
  }, [navigate]);

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
