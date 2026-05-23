import * as RNHaptics from 'expo-haptics';
import { useUserStore } from '../store/useUserStore';

// Haptic wrapper — ayarlar ekranındaki titreşim toggle'ını dikkate alır.
// Tüm uygulama boyunca expo-haptics yerine bu modül kullanılır.

function isEnabled(): boolean {
  return useUserStore.getState().hapticEnabled;
}

export function selectionAsync(): Promise<void> {
  if (!isEnabled()) return Promise.resolve();
  return RNHaptics.selectionAsync().catch(() => {});
}

export function notificationAsync(
  type: RNHaptics.NotificationFeedbackType,
): Promise<void> {
  if (!isEnabled()) return Promise.resolve();
  return RNHaptics.notificationAsync(type).catch(() => {});
}

export function impactAsync(
  style?: RNHaptics.ImpactFeedbackStyle,
): Promise<void> {
  if (!isEnabled()) return Promise.resolve();
  return RNHaptics.impactAsync(style).catch(() => {});
}

// Sabit re-export — import * as Haptics from '...' kullanımları için
export const NotificationFeedbackType = RNHaptics.NotificationFeedbackType;
export const ImpactFeedbackStyle = RNHaptics.ImpactFeedbackStyle;
