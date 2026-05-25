// German TTS helper — selects the best available device voice and exposes
// a simple fire-and-forget `speakGerman()` function.
import * as Speech from 'expo-speech';

let cachedVoice: Speech.Voice | null | undefined = undefined; // undefined = not yet fetched

async function getBestGermanVoice(): Promise<Speech.Voice | null> {
  if (cachedVoice !== undefined) return cachedVoice;
  try {
    const voices = await Speech.getAvailableVoicesAsync();
    const german = voices.filter(
      (v) => v.language?.startsWith('de') || v.identifier?.includes('de-'),
    );
    if (german.length === 0) {
      cachedVoice = null;
      return null;
    }
    // iOS: prefer Enhanced (higher quality offline neural voice)
    const enhanced = german.find((v) => /enhanced/i.test(v.identifier ?? ''));
    if (enhanced) { cachedVoice = enhanced; return enhanced; }
    // Android: prefer network/wavenet/neural voices (better quality)
    const premium = german.find((v) =>
      /network|wavenet|neural|premium|natural/i.test(v.identifier ?? ''),
    );
    cachedVoice = premium ?? german[0] ?? null;
    return cachedVoice;
  } catch {
    cachedVoice = null;
    return null;
  }
}

export async function speakGerman(text: string, options: { rate?: number; pitch?: number } = {}): Promise<void> {
  Speech.stop();
  const voice = await getBestGermanVoice();
  Speech.speak(text, {
    language: 'de-DE',
    rate: options.rate ?? 1.0,
    pitch: options.pitch ?? 1.0,
    voice: voice?.identifier,
  });
}

export async function preloadGermanVoice(): Promise<void> {
  await getBestGermanVoice();
}
