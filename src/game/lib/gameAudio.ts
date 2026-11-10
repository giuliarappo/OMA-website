const SOUND_URLS = {
  jump: {
    primary: "/assets/SALTO_NUOVO.mp3",
    fallback: "/assets/SALTO_NUOVO.mp3",
  },
  fall: {
    primary: "/assets/CADUTA2.mp3",
    fallback: "/assets/CADUTA2.mp3",
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
  }
  
} as const;

type SoundName = keyof typeof SOUND_URLS;
const audioCache = new Map<SoundName, HTMLAudioElement>();

let backgroundMusic: HTMLAudioElement | null = null;
let backgroundMusicStarted = false;
let landContext: AudioContext | null = null;
let walkAudio: HTMLAudioElement | null = null;


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


function getAudio(name: SoundName) {
  let audio = audioCache.get(name);
  if (!audio) {
    audio = new Audio(SOUND_URLS[name].primary);
    audio.preload = "auto";
    audio.volume = name === "fall" ? 0.78 : 0.62;
    audio.addEventListener("error", () => {
      if (audio && audio.src.endsWith(SOUND_URLS[name].primary)) {
        audio.src = SOUND_URLS[name].fallback;
        audio.load();
      }
    });
    audioCache.set(name, audio);
  }
  return audio;
}

export function preloadGameSounds() {
  if (typeof window === "undefined") return;
  (Object.keys(SOUND_URLS) as SoundName[]).forEach((name) => {
    const audio = getAudio(name);
    audio.load();
  });
}

export function playGameSound(name: SoundName) {
  if (typeof window === "undefined") return;
  const audio = getAudio(name);
  audio.currentTime = 0;
  void audio.play().catch(() => {
    // L'audio può essere bloccato dal browser finché non arriva un gesto dell'utente.
  });
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


export function playLandSound(impact = 700) {
  if (typeof window === "undefined") return;
  const AudioContextConstructor = window.AudioContext
    || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextConstructor) return;

  landContext ??= new AudioContextConstructor();   // uno solo, riusato
  const context = landContext;
  void context.resume();

  const t = context.currentTime;
  const strength = Math.max(0.35, Math.min(1, impact / 1000));
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "triangle";                    // "square" per un suono più 8-bit
  oscillator.frequency.setValueAtTime(150, t);
  oscillator.frequency.exponentialRampToValueAtTime(45, t + 0.1);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(0.16 * strength, t + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);

  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(t);
  oscillator.stop(t + 0.13);
}

export function startWalkSound() {
  if (typeof window === "undefined") return;

  if (!walkAudio) {
    walkAudio = new Audio("assets/PASSI.mp3");
    walkAudio.loop = true;
    walkAudio.preload = "auto"
    walkAudio.volume = 0.4;
  }
  if (!walkAudio.paused) return;

  void walkAudio.play().catch((err) => console.error(err)) 
}

export function stopWalkSound() {
  if (!walkAudio || walkAudio.paused) return;
  walkAudio.pause();
  walkAudio.currentTime = 0;
}