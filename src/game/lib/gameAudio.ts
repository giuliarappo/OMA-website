const SOUND_URLS = {
  jump: {
    primary: "/assets/SALTO_NUOVO.mp3",
    fallback: "/assets/SALTO_NUOVO.mp3",
  },
  fall: {
    primary: "/assets/CADUTA_NUOVA.mp3",
    fallback: "/assets/CADUTA_NUOVA.mp3",
  },
  passi: {
    primary: "/assets/PASSI_NUOVO.mp3",
    fallback: "/assets/PASSI_NUOVO.mp3",
  },
  impatto: {
    primary: "/assets/IMPATTO2.mp3",
    fallback: "/assets/IMPATTO2.mp3",
  },
  door: {
    primary: "/assets/PORTA2.mp3",
    fallback: "/assets/PORTA2.mp3",
  },
  nearDoor: {
    primary: "/assets/SUONO_PORTA.mp3",
    fallback: "/assets/SUONO_PORTA.mp3",
  },
} as const;

type SoundName = keyof typeof SOUND_URLS;

// ---------------------------------------------------------------------------
// Web Audio engine
// Safari è molto lento con <audio> + currentTime = 0 + play() (e al primo play
// deve anche scaricare e decodificare l'mp3): da qui i lag a ogni salto.
// Qui i suoni vengono scaricati e decodificati UNA volta in AudioBuffer e poi
// riprodotti con BufferSource, che parte in modo praticamente istantaneo.
// ---------------------------------------------------------------------------

type AudioContextCtor = typeof AudioContext;

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
const buffers = new Map<SoundName, AudioBuffer>();
const loading = new Map<SoundName, Promise<void>>();
let unlockBound = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ||
    (window as Window & { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  return ctx;
}

// Safari crea il contesto "suspended": va ripreso dentro un gesto dell'utente.
function bindUnlock() {
  if (unlockBound || typeof window === "undefined") return;
  unlockBound = true;
  const events = ["pointerdown", "touchstart", "keydown"] as const;
  const unlock = () => {
    const c = getContext();
    if (c && c.state !== "running") void c.resume().catch(() => {});
    if (c && c.state === "running") {
      events.forEach((e) => window.removeEventListener(e, unlock));
      unlockBound = false;
    }
  };
  events.forEach((e) => window.addEventListener(e, unlock, { passive: true }));
}

function decode(c: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  // Safari vecchio supporta solo la versione con callback
  return new Promise((resolve, reject) => {
    const maybe = c.decodeAudioData(data, resolve, reject);
    if (maybe && typeof maybe.then === "function") maybe.then(resolve, reject);
  });
}

function loadSound(name: SoundName): Promise<void> {
  const existing = loading.get(name);
  if (existing) return existing;
  const c = getContext();
  if (!c) return Promise.resolve();

  const promise = (async () => {
    try {
      const res = await fetch(SOUND_URLS[name].primary);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = await decode(c, await res.arrayBuffer());
      buffers.set(name, buf);
    } catch (err) {
      console.warn(`[audio] impossibile caricare "${name}":`, err);
      loading.delete(name); // permette un nuovo tentativo
    }
  })();
  loading.set(name, promise);
  return promise;
}

export function preloadGameSounds() {
  if (typeof window === "undefined") return;
  bindUnlock();
  (Object.keys(SOUND_URLS) as SoundName[]).forEach((name) => void loadSound(name));
}

// Compatibilità: il suono dei passi è già incluso in preloadGameSounds(),
// ma Game.tsx la chiama esplicitamente (loadSound evita i caricamenti doppi).
export function preloadWalkSound() {
  if (typeof window === "undefined") return;
  bindUnlock();
  void loadSound("passi");
}

// Avvia un suono già decodificato. Ritorna la sorgente, o null se non è pronto.
function startSource(name: SoundName, volume = 1): AudioBufferSourceNode | null {
  const c = getContext();
  if (!c || !masterGain) return null;
  bindUnlock();
  if (c.state === "suspended") void c.resume().catch(() => {});

  const buffer = buffers.get(name);
  if (!buffer) {
    void loadSound(name); // non ancora pronto: lo carico per le prossime volte
    return null;
  }

  const source = c.createBufferSource();
  source.buffer = buffer;
  if (volume !== 1) {
    const g = c.createGain();
    g.gain.value = volume;
    source.connect(g).connect(masterGain);
  } else {
    source.connect(masterGain);
  }
  source.start(0);
  return source;
}

export function playGameSound(name: SoundName, volume = 1) {
  startSource(name, volume);
}

// Riproduce un suono e chiama callback quando finisce.
// Se il suono non è pronto, o dura più di maxMs, non aspetta all'infinito.
export function playGameSoundThen(name: SoundName, callback: () => void, maxMs = 600) {
  if (typeof window === "undefined") return;

  let done = false;
  let timer = 0;
  const finish = () => {
    if (done) return;
    done = true;
    window.clearTimeout(timer);
    callback();
  };

  const source = startSource(name);
  if (!source) {
    finish(); // niente audio disponibile: non bloccare la navigazione
    return;
  }
  source.onended = finish;
  timer = window.setTimeout(finish, maxMs);
}

// ---------------------------------------------------------------------------
// Musica di sottofondo (resta su <audio>: è un file lungo in loop)
// ---------------------------------------------------------------------------

let backgroundMusic: HTMLAudioElement | null = null;
let backgroundMusicStarted = false;

export function startBackgroundMusic() {
  if (typeof window === "undefined") return;

  if (!backgroundMusic) {
    backgroundMusic = new Audio("/assets/audio_bg.mp3");
    backgroundMusic.loop = true;
    backgroundMusic.preload = "auto";
    backgroundMusic.volume = 0.28;
  }

  if (backgroundMusicStarted && !backgroundMusic.paused) {
    return;
  }

  backgroundMusicStarted = true;

  void backgroundMusic.play().catch(() => {
    // Il browser può bloccare l'audio finché l'utente
    // non compie un gesto, come un click o un tap.
    backgroundMusicStarted = false;
  });
}

export function stopBackgroundMusic() {
  if (!backgroundMusic) return;

  backgroundMusic.pause();
  backgroundMusic.currentTime = 0;
  backgroundMusicStarted = false;
}

export function setBackgroundMusicVolume(volume: number) {
  if (!backgroundMusic) return;

  backgroundMusic.volume = Math.max(0, Math.min(1, volume));
}

export function playDoorActivationSound() {
  if (typeof window === "undefined") return;
  const AudioContextConstructor = window.AudioContext
    || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;

  const context = new AudioContextConstructor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const start = context.currentTime;
  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(740, start);
  oscillator.frequency.exponentialRampToValueAtTime(1040, start + 0.09);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.055, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.13);
  oscillator.connect(gain);
  gain.connect(context.destination);
  void context.resume().then(() => {
    oscillator.start(start);
    oscillator.stop(start + 0.14);
    window.setTimeout(() => void context.close(), 220);
  }).catch(() => void context.close());
}

// ---------------------------------------------------------------------------
// Passi (loop con BufferSource)
// ---------------------------------------------------------------------------

let walkSource: AudioBufferSourceNode | null = null;
let walkGain: GainNode | null = null;
const WALK_VOLUME = 0.4;

export function startWalkSound() {
  if (walkSource) return;
  const c = getContext();
  if (!c || !masterGain) return;
  const buffer = buffers.get("passi");
  if (!buffer) {
    void loadSound("passi");
    return;
  }
  if (c.state === "suspended") void c.resume().catch(() => {});

  walkGain = c.createGain();
  walkGain.gain.value = WALK_VOLUME;
  walkGain.connect(masterGain);

  const source = c.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  source.connect(walkGain);
  source.start(0);
  walkSource = source;
}

export function stopWalkSound() {
  if (!walkSource) return;
  try {
    walkSource.stop();
  } catch {
    // già fermato
  }
  walkSource.disconnect();
  walkGain?.disconnect();
  walkSource = null;
  walkGain = null;
}
