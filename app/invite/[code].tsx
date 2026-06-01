import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useThemePalette, type ThemePalette } from '../../src/theme/useThemePalette';
import { useT } from '../../src/i18n';
import { useAuthStore } from '../../src/store/useAuthStore';
import { AcceptInviteScreen } from '../../src/components/family/AcceptInviteScreen';

// ════════════════════════════════════════════════════════════════
// /invite/[code] — deep link landing.
//
// Flow:
//   1. URL'den kod parse et
//   2. Auth yok ise → /login?return=/invite/<code> redirect
//   3. Auth varsa → AcceptInviteScreen render
//
// Deep link örnek: vogel://invite/AB3XJK
// Universal link (Phase 2): https://vogel-app.com/invite/AB3XJK
// ════════════════════════════════════════════════════════════════

export default function InviteCodeScreen() {
  const c = useThemePalette();
  const styles = makeStyles(c);
  const t = useT();
  const params = useLocalSearchParams<{ code: string }>();
  const user = useAuthStore((s) => s.user);
  const isAuthLoading = useAuthStore((s) => s.isAuthLoading);

  const code = (params.code || '').toUpperCase();

  useEffect(() => {
    if (isAuthLoading) return;
    if (!user) {
      // Login'e yönlendir, login sonrası geri dönsün (Phase 2'de query param + AuthGuard)
      router.replace('/login');
    }
  }, [user, isAuthLoading]);

  if (isAuthLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: t('family.title') }} />
        <ActivityIndicator size="large" color={c.neon} />
      </View>
    );
  }

  if (!code || code.length < 4) {
    return (
      <View style={styles.loadingContainer}>
        <Stack.Screen options={{ title: t('family.title') }} />
        <ActivityIndicator size="large" color={c.red} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: t('family.title') }} />
      <AcceptInviteScreen code={code} />
    </>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
