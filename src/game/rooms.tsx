import type { Rect } from "./utils_graphics";
import { Player, PLAYER_HEIGHT, PLAYER_SPAWN_X } from "./Player";
import type { Container } from "pixi.js";
import { creditsSign, HERO_DESKTOP, HERO_MOBILE, offerButton, openingHero } from "./decor/intro";
import { pit, portraitWall } from "./decor/portraits";
import { TEAM } from "./team";

export interface DoorConfig {
  platformIndex: number;
  target: string;
  kind?: "platform" | "exit";
  x?: number;
  label?: string;
}

export interface RoomConfig {
    id: string;
    worldWidth: number;
    worldHeight: number;
    spawn: { x: number; y: number };
    groundY?: number;
    platforms: Rect[];
    doors: DoorConfig[];
    assets?: string[];
    fallTarget?: string;                       // se cadi fuori dal mondo vai qui (altrimenti respawn)
    decor?: (ctx: DecorContext) => Decor[];
}

export interface ViewInfo {
  w: number; h: number; zoom: number;
  screenW: number; screenH: number;
}

export interface DecorContext {
  player: Player;
  emit(name: string, payload?: unknown): void;   // verso React
  navigate(target: string): void;
}

export interface Decor {
  view: Container;
  layer?: "back" | "front";   // back: dietro le piattaforme (default). front: sopra tutto
  layout?(view: ViewInfo): void;
  update?(time: number, dt: number): void;
}

const HUB_PLATFORMS: Rect[] = [
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
  ]

export const HUB: RoomConfig = {
    id: "hub",
    worldWidth: 4000,
    worldHeight: 900,
    spawn: { x: PLAYER_SPAWN_X, y: 650 - PLAYER_HEIGHT },
    groundY: 650,
    platforms: HUB_PLATFORMS,
    doors: [
        { platformIndex: 5, target: "/cosa-facciamo", label: "Cosa facciamo" },
        { platformIndex: 6, target: "/chi-siamo", label: "Chi siamo" },
        { platformIndex: 7, target: "/corsi", label: "Corsi" },
        { platformIndex: 9, target: "/collabs", label: "Collabs" },
    ],
    assets: [HERO_DESKTOP, HERO_MOBILE],
    decor: (ctx) => [
        openingHero(HUB_PLATFORMS[0]),
        offerButton(HUB_PLATFORMS[0], () => ctx.navigate("/offerta-formativa")),
        creditsSign("Realizzato da:\nGiulia Rappo, Antonio Russo", HUB_PLATFORMS[4]),
    ],
};

export const COSA_FACCIAMO: RoomConfig = {
    id: "cosa-facciamo",
    worldWidth: 1000,
    worldHeight: 900,
    spawn: { x: PLAYER_SPAWN_X, y: 650 - PLAYER_HEIGHT },
    groundY: 650,
    platforms: [{ x: 0, y: 650, w: 1000, h: 80 }],
    doors: [
        { platformIndex: 0, target: "/game", kind: "exit" },
        { platformIndex: 0, target: "/progetti/la-cura-anomala", x: 450 },
        { platformIndex: 0, target: "/progetti/due", x: 700 },
    ],
};

export const SALA_RITRATTI: RoomConfig = {
    id: "sala-ritratti",
    worldWidth: 2200,
    worldHeight: 900,
    spawn: { x: 1550, y: 650 - PLAYER_HEIGHT },
    groundY: 650,
    platforms: [
        { x: 0, y: 650, w: 110, h: 80 },
        { x: 270, y: 650, w: 1930, h: 80 },   // in mezzo il buco (110 → 270)
    ],
    doors: [{ platformIndex: 1, target: "/game", kind: "exit", x: 1490 }],
    fallTarget: "/game",                    // cadere nel buco riporta all'hub, come prima
    assets: TEAM.map((m) => m.thumb),
    decor: (ctx) => [
        pit(110, 650, 160),
        portraitWall(TEAM, { x: 520, y: 470, spacing: 210 }, ctx),
    ],
};