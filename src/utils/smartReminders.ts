import { getT } from '../i18n';
import { useUserStore } from '../store/useUserStore';
import { getPersonalizedReminderKey } from '../services/personalization';
import {
  cancelAllSmartReminders,
  scheduleNotificationAtDate,
  SMART_REMINDER_PREFIX,
} from './notifications';

// ════════════════════════════════════════════════════════════════
// SMART REMINDER ENGINE — Kişiselleştirilmiş
//
// Strateji:
//   - 7 gün ileri schedule yap (bugün dahil)
//   - Her gün için 2 bildirim: sabah (9-12 random) + akşam (18-22 random)
//   - Mesaj seçimi PERSONALIZATION SERVICE üzerinden:
//     %50 motivasyon-spesifik + %50 genel
//   - Saat de random → bunaltmaz, tahmin edilemez
//
// Her app açılışında refreshSmartReminders() çağrılır → eski schedule
// silinir, yeni mesajlar/saatlerle 7 günlük plan kurulur.
//
// KİŞİSELLEŞTİRME:
//   - Kullanıcı 'travel' seçtiyse → "Berlin'de kahvaltı sipariş et ☕" gibi
//   - Kullanıcı 'work' seçtiyse → "İşe gitmeden önce bir ders 💼" gibi
//   - Motivasyon yoksa → genel 16 mesajdan random
// ════════════════════════════════════════════════════════════════

// Sabah ve akşam pencere saatleri
const MORNING_HOUR_MIN = 9;
const MORNING_HOUR_MAX = 12;
const EVENING_HOUR_MIN = 18;
const EVENING_HOUR_MAX = 22;

// Kaç gün ileri schedule yapacağız
const SCHEDULE_DAYS_AHEAD = 7;

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function buildReminderDate(
  dayOffset: number,
  hourMin: number,
  hourMax: number,
): Date {
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(randomInt(hourMin, hourMax - 1), randomInt(0, 59), 0, 0);
  return date;
}

// ───────────────────────────────────────────────────────────────
// Ana fonksiyon: tüm smart reminder'ları yenile
// Kullanıcının motivasyonlarına göre kişiselleştirilmiş mesajlar seçer.
// ───────────────────────────────────────────────────────────────
export async function refreshSmartReminders(): Promise<number> {
  await cancelAllSmartReminders();

  // Kullanıcının motivasyonlarını oku (store'dan)
  const userMotivations = useUserStore.getState().learningMotivations ?? [];

  let scheduledCount = 0;

  for (let dayOffset = 0; dayOffset <= SCHEDULE_DAYS_AHEAD; dayOffset++) {
    // Sabah bildirimi
    const morningDate = buildReminderDate(
      dayOffset, MORNING_HOUR_MIN, MORNING_HOUR_MAX,
    );
    const morningKey = getPersonalizedReminderKey('morning', userMotivations);
    const morningBody = getT(morningKey);
    const morningId = `${SMART_REMINDER_PREFIX}d${dayOffset}-am`;

    if (await scheduleNotificationAtDate(morningId, morningDate, morningBody)) {
      scheduledCount++;
    }

    // Akşam bildirimi
    const eveningDate = buildReminderDate(
      dayOffset, EVENING_HOUR_MIN, EVENING_HOUR_MAX,
    );
    const eveningKey = getPersonalizedReminderKey('evening', userMotivations);
    const eveningBody = getT(eveningKey);
    const eveningId = `${SMART_REMINDER_PREFIX}d${dayOffset}-pm`;

    if (await scheduleNotificationAtDate(eveningId, eveningDate, eveningBody)) {
      scheduledCount++;
    }
  }

  return scheduledCount;
}

// ───────────────────────────────────────────────────────────────
// Tüm smart reminder'ları iptal et (switch kapatıldığında)
// ───────────────────────────────────────────────────────────────
export async function disableSmartReminders(): Promise<void> {
  await cancelAllSmartReminders();
}
