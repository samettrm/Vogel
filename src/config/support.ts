/**
 * MERKEZİ DESTEK YAPILANDIRMASI — BUSATER standardı (04 Eyl 2026).
 *
 * 🔴 privacy-policy.tsx'teki e-posta HUKUKİ iletişim (gizlilik sorusu) → DOKUNULMADI.
 * Kullanıcı DESTEĞİ için ayrı alias burada; ikisi ayrı yaşar.
 * Metadata expo-application'dan. 🔴 Mağaza satırı yazılmaz (platform ≠ kanal). Kişisel veri yok.
 */
import { Platform, Linking, Alert } from 'react-native';
import * as Application from 'expo-application';

export const SUPPORT = { appName: 'Vogel', supportEmail: 'bsdigitalapp+vogel@gmail.com' } as const;

function platformLabel(): string {
  return Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : Platform.OS;
}
function osLabel(): string {
  const rel = (Platform as unknown as { constants?: { Release?: string } }).constants?.Release;
  if (Platform.OS === 'android' && rel) return `Android ${rel}`;
  return `${platformLabel()} ${String(Platform.Version)}`;
}
export function supportSubject(): string {
  return `[${SUPPORT.appName}][${platformLabel()}] Destek Talebi`;
}
export function supportBody(): string {
  const s: string[] = [`Uygulama: ${SUPPORT.appName}`, `Platform: ${platformLabel()}`];
  const v = Application.nativeApplicationVersion; if (v) s.push(`Sürüm: ${v}`);
  const b = Application.nativeBuildVersion; if (b) s.push(`Build / Version Code: ${b}`);
  s.push(`İşletim Sistemi: ${osLabel()}`);
  return `\n\n\n--------------------\n${s.join('\n')}\n--------------------\n`;
}
export function openSupportMail(): void {
  const url = `mailto:${SUPPORT.supportEmail}?subject=${encodeURIComponent(supportSubject())}&body=${encodeURIComponent(supportBody())}`;
  Linking.openURL(url).catch((e) => {
    console.warn('[support] mail açılamadı:', (e as Error)?.message);
    Alert.alert('Destek', `E-posta: ${SUPPORT.supportEmail}`);
  });
}
