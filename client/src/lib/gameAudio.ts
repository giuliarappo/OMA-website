const SOUND_URLS = {
  jump: {
    primary: "/assets/jumpshort_4bbeef7c.mp3",
    fallback: "/assets/jump_40afdd38.mp3",
  },
  fall: {
    primary: "/assets/urlocaduta_eco_9f9f912a.mp3",
    fallback: "/assets/urlocaduta_bb3a42eb.mp3",
  },
} as const;

type SoundName = keyof typeof SOUND_URLS;
const audioCache = new Map<SoundName, HTMLAudioElement>();

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
