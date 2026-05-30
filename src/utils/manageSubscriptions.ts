import { Linking, Platform } from 'react-native';

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
  try {
    await Linking.openURL(url);
  } catch (e) {
    if (__DEV__) console.warn('[ManageSubscriptions] openURL failed:', e);
  }
}
