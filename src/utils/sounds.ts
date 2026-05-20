import { Audio } from 'expo-av';

// Ses sistemi — expo-av ile.
// Dört kısa efekt: correct / wrong / lessonComplete / unitComplete.
// İlk çalmada yüklenir, sonrasında cache'lenir.
// Hata olursa sessizce yutar — ses kritik bir özellik değil.

export type SoundKey =
  | 'correct'
  | 'wrong'
  | 'lessonComplete'
  | 'unitComplete'
  | 'comboUp';

// Asset referansları — Metro require ile çözer.
const SOUND_SOURCES: Record<SoundKey, number> = {
  correct: require('../../assets/sounds/correct.mp3'),
  wrong: require('../../assets/sounds/wrong.mp3'),
  lessonComplete: require('../../assets/sounds/lesson_complete.mp3'),
  unitComplete: require('../../assets/sounds/unit_complete.mp3'),
  comboUp: require('../../assets/sounds/combo_up.mp3'),
};

const soundCache: Partial<Record<SoundKey, Audio.Sound>> = {};
let audioModeConfigured = false;

async function ensureAudioMode(): Promise<void> {
  if (audioModeConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    });
    audioModeConfigured = true;
  } catch {
    // Yapılandırma başarısız olursa devam et — varsayılan mod yine de çalışır.
  }
}

export async function playSound(key: SoundKey): Promise<void> {
  try {
    await ensureAudioMode();

    let sound = soundCache[key];
    if (!sound) {
      const { sound: newSound } = await Audio.Sound.createAsync(
        SOUND_SOURCES[key],
        { shouldPlay: false, volume: 1.0 },
      );
      sound = newSound;
      soundCache[key] = sound;
    }

    // Önce sıfıra al, sonra oynat — arka arkaya çalmalarda çakışmasın.
    await sound.setPositionAsync(0);
    await sound.playAsync();
  } catch {
    // Yutma — sessizlik, ses sisteminin çökmesinden iyidir.
  }
}

// 🚀 PERF: Tüm sesleri uygulama açılışında pre-load et.
// İlk çalma anlamında mp3 yükleme gecikmesi olmaz — 'Kontrol et' anında ses gelir.
// app/_layout.tsx audio warmup useEffect içinde çağrılır.
export async function preloadAllSounds(): Promise<void> {
  try {
    await ensureAudioMode();
    // Paralel yükleme — hepsini aynı anda hazırla
    await Promise.all(
      (Object.keys(SOUND_SOURCES) as SoundKey[]).map(async (key) => {
        if (soundCache[key]) return;
        try {
          const { sound } = await Audio.Sound.createAsync(
            SOUND_SOURCES[key],
            { shouldPlay: false, volume: 1.0 },
          );
          soundCache[key] = sound;
        } catch {
          // Tek bir ses yüklenemese bile diğerleri devam etsin
        }
      }),
    );
  } catch {
    // Sessiz fail — preload kritik değil, ilk çalma yine çalışır
  }
}

// Uygulama kapatılırken ya da test sırasında belleği temizlemek için.
export async function unloadAllSounds(): Promise<void> {
  for (const key of Object.keys(soundCache) as SoundKey[]) {
    try {
      await soundCache[key]?.unloadAsync();
    } catch {
      // Sessizce devam
    }
    delete soundCache[key];
  }
}
