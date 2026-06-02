import { Platform } from 'react-native';
import { openExternalUrl } from './openExternalUrl';

// ════════════════════════════════════════════════════════════════
// MANAGE SUBSCRIPTIONS — Platform-specific deep link
//
// Apple Guideline 3.1.2(b): Aboneliği app içinden iptal/yönetme YOLU
// olmak zorunda. iOS'ta Apple'ın native abonelik yönetim ekranını,
// Android'de Google Play abonelik ekranını açar.
//
// Kullanım:
//   import { openManageSubscriptions } from '@/src/utils/manageSubscriptions';
//   <Pressable onPress={openManageSubscriptions}>Aboneliği Yönet</Pressable>
// ════════════════════════════════════════════════════════════════

const IOS_URL = 'https://apps.apple.com/account/subscriptions';
const ANDROID_URL = 'https://play.google.com/store/account/subscriptions';

export async function openManageSubscriptions(): Promise<void> {
  const url = Platform.OS === 'ios' ? IOS_URL : ANDROID_URL;
  // Güvenli aç — başarısızsa URL Alert ile gösterilir (sessiz yutma yok).
  await openExternalUrl(url, 'Aboneliği Yönet');
}
