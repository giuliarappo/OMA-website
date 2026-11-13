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
    fallback: "/assets/SUONO_PORTA.mp3"
  }
  
} as const;

type SoundName = keyof typeof SOUND_URLS;
const audioCache = new Map<SoundName, HTMLAudioElement>();

let backgroundMusic: HTMLAudioElement | null = null;
let backgroundMusicStarted = false;
let walkAudio: HTMLAudioElement | null = null;

function getWalkAudio() {
  if (!walkAudio) {
    walkAudio = new Audio("/assets/PASSI_NUOVO.mp3");
    walkAudio.loop = true;
    walkAudio.preload = "auto";
    walkAudio.volume = 0.4;
  }
  return walkAudio;
}

// Da chiamare all'avvio: scarica il file prima che serva
export function preloadWalkSound() {
  if (typeof window === "undefined") return;
  getWalkAudio().load();
}


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
    // qua si puo' regolare l'audio
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
  void audio.play().catch((err) => {
    console.error(err);
  });
  
}

export function playGameSoundThen(name: SoundName, callback: () => void, maxMs = 600) {
  if (typeof window === "undefined") return;
  const audio = getAudio(name);

  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    audio.removeEventListener("ended", finish);
    callback()
  }
  audio.addEventListener("ended", finish);
  window.setTimeout(finish, maxMs);   // se il suono è più lungo o bloccato, non aspetta all'infinito
  audio.currentTime = 0;
  void audio.play().catch(finish);
  
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

export function startWalkSound() {
  if (typeof window === "undefined") return;

  if (!walkAudio) {
    walkAudio = new Audio("assets/PASSI_NUOVO.mp3");
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