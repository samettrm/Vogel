import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ════════════════════════════════════════════════════════════════
// NOTIFICATIONS — Yerel bildirim altyapısı
//
// Smart reminder motoru (src/utils/smartReminders.ts) bu modülü kullanır.
// Low-level: izin al, belirli tarihte schedule et, iptal et, test bildirimi.
//
// Önemli:
//   - Paket Expo Go'da da yüklenir, push registration hatası sessizce yutulur
//   - Yerel scheduled bildirimler Expo Go'da hala çalışıyor
//   - Production APK'da tam destek
// ════════════════════════════════════════════════════════════════

const CHANNEL_ID = 'vogel-reminders';
// Smart reminder identifier prefix — bu prefix ile başlayan tüm
// scheduled bildirimleri toplu iptal etmek için
export const SMART_REMINDER_PREFIX = 'vogel-smart-';

// Expo Go tespiti — UI'da kullanıcıya bilgi vermek için
const isExpoGo = Constants.appOwnership === 'expo';

let Notifications: any = null;
let notificationsLoadAttempted = false;
let initializationPromise: Promise<void> | null = null;

// LAZY LOAD
// ÖNEMLİ: expo-notifications modülü import edildiği an, içindeki
// DevicePushTokenAutoRegistration.fx.js otomatik olarak push token register
// etmeye çalışır ve Expo Go SDK 53+ uyumsuzluğu nedeniyle dev console'a
// ERROR atar. Bunu önlemek için modülü sadece gerçekten ihtiyaç olunca
// yüklüyoruz (kullanıcı bildirim açmaya çalıştığında).
// Statik require kağılda dahi olsa _layout.tsx import zincirinden
// hiç tetiklenmesin diye GET'i function'a çekiyoruz.
function getNotifications(): any {
  if (notificationsLoadAttempted) return Notifications;
  notificationsLoadAttempted = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch {
    Notifications = null;
  }
  return Notifications;
}

// ───────────────────────────────────────────────────────────────
// Modül başlatma — handler + Android channel
// İlk kullanımda lazy başlatılır, sadece bir kez çalışır
// ───────────────────────────────────────────────────────────────
async function ensureInitialized(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    try {
      N.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
      });

      if (Platform.OS === 'android') {
        await N.setNotificationChannelAsync(CHANNEL_ID, {
          name: 'Vogel Hatırlatmalar',
          importance: N.AndroidImportance?.MAX ?? 5,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#39FF14',
          sound: 'default',
        });
      }
    } catch {
      // Sessizce yut
    }
  })();

  return initializationPromise;
}

// ───────────────────────────────────────────────────────────────
// Bildirim iznini iste
// ───────────────────────────────────────────────────────────────
export async function requestNotificationPermission(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  await ensureInitialized();

  try {
    const { status: existingStatus } = await N.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await N.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// Belirli bir tarih/saatte tek seferlik bildirim planla
// Smart reminder motoru bunu kullanır — her bildirim ayrı identifier
// ───────────────────────────────────────────────────────────────
export async function scheduleNotificationAtDate(
  identifier: string,
  date: Date,
  body: string,
  title?: string,
): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  await ensureInitialized();

  if (date.getTime() <= Date.now()) return false;

  // Mesaj formatı: 'TITLE|BODY' veya sadece 'BODY'
  // Pipe separator varsa solu title (kalın+büyük gösterilir), sağı body
  let actualTitle = title ?? 'Vogel';
  let actualBody = body;
  if (!title && body.includes('|')) {
    const pipeIdx = body.indexOf('|');
    actualTitle = body.slice(0, pipeIdx).trim();
    actualBody = body.slice(pipeIdx + 1).trim();
  }

  try {
    const trigger = N.SchedulableTriggerInputTypes?.DATE !== undefined
      ? { type: N.SchedulableTriggerInputTypes.DATE, date }
      : { date };

    await N.scheduleNotificationAsync({
      identifier,
      content: {
        title: actualTitle,
        body: actualBody,
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger,
    });
    return true;
  } catch (err) {
    if (__DEV__) console.warn('scheduleNotificationAtDate failed:', err);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// Tek seferlik test bildirimi (5 saniye sonra)
// ───────────────────────────────────────────────────────────────
export async function sendTestNotification(): Promise<boolean> {
  const N = getNotifications();
  if (!N) return false;
  await ensureInitialized();

  try {
    const trigger = N.SchedulableTriggerInputTypes?.TIME_INTERVAL !== undefined
      ? { type: N.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 5 }
      : { seconds: 5 };

    await N.scheduleNotificationAsync({
      content: {
        title: '🐦 Vogel — Test',
        body: 'Bildirimler çalışıyor! Her gün böyle hatırlatma alacaksın.',
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
      },
      trigger,
    });
    return true;
  } catch (err) {
    if (__DEV__) console.warn('sendTestNotification failed:', err);
    return false;
  }
}

// ───────────────────────────────────────────────────────────────
// Tüm smart reminder'ları iptal et
// (vogel-smart- prefix'ine sahip olanlar)
// ───────────────────────────────────────────────────────────────
export async function cancelAllSmartReminders(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try {
    const scheduled = await N.getAllScheduledNotificationsAsync();
    for (const item of scheduled) {
      const id = item?.identifier ?? '';
      if (typeof id === 'string' && id.startsWith(SMART_REMINDER_PREFIX)) {
        await N.cancelScheduledNotificationAsync(id);
      }
    }
  } catch {
    // Sessizce geç
  }
}

// ───────────────────────────────────────────────────────────────
// Tüm zamanlanmış bildirimleri iptal et (debug için)
// ───────────────────────────────────────────────────────────────
export async function cancelAllNotifications(): Promise<void> {
  const N = getNotifications();
  if (!N) return;
  try {
    await N.cancelAllScheduledNotificationsAsync();
  } catch {
    // Sessizce geç
  }
}

// ───────────────────────────────────────────────────────────────
// Yardımcı getter'lar
// ───────────────────────────────────────────────────────────────
export function isNotificationsAvailable(): boolean {
  return getNotifications() !== null;
}

export function isRunningInExpoGo(): boolean {
  return isExpoGo;
}
