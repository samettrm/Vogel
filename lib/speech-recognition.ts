// Safe shim around @jamsch/expo-speech-recognition.
// Wraps the require() in try/catch so Expo Go (which can't load native modules
// that aren't bundled) doesn't crash. In a real device build the module loads
// normally and speech recognition is fully functional.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _mod: any = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _mod = require('@jamsch/expo-speech-recognition');
} catch {
  // Module not available (Expo Go or web) — all exports are no-ops.
}

export const speechRecognition = _mod?.ExpoSpeechRecognitionModule ?? null;

export function useSpeechRecognitionEvent(
  event: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (e: any) => void,
): void {
  if (_mod?.useSpeechRecognitionEvent) {
    _mod.useSpeechRecognitionEvent(event, handler);
  }
}

export function isSpeechRecognitionAvailable(): boolean {
  return !!speechRecognition;
}
