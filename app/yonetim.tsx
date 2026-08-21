import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { radius, spacing, textStyles, useThemeColors } from '../src/theme';
import { useT } from '../src/i18n';
import { useAuthStore } from '../src/store/useAuthStore';
import { isAdminUser } from '../src/config/admin';
import { countryFlag, countryName } from '../src/utils/countryNames';
import {
  fetchAdminStats,
  type AdminCountEntry,
  type AdminStats,
} from '../src/services/admin';

// ════════════════════════════════════════════════════════════════
// YÖNETİM PANELİ — SALT OKUNUR, HAM OPERASYONEL VERİ
//
// Uygulama içi ilerleme (XP, seri, ders) BİLİNÇLİ olarak yok. Panel
// "kaç kişi, nereden, hangi cihazla, kaçı ödüyor" sorusuna cevap verir.
// Düzen: Kalorimetre panelinin sayı-kutucuğu yapısı, Vogel temasıyla.
//
// 🔴 GİZLİLİK DEĞİL, YETKİ: buradaki kontrol yalnızca menüyü gizler.
//    Gerçek koruma sunucuda — getAdminStats callable'ı assertAdmin() ile
//    korunur; adres bilinse bile veri gelmez ('permission-denied').
// ════════════════════════════════════════════════════════════════

export default function YonetimScreen() {
  const c = useThemeColors();
  const t = useT();
  const user = useAuthStore((s) => s.user);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<{ message: string; denied: boolean } | null>(null);

  const styles = useMemo(() => makeStyles(c), [c]);
  const allowed = isAdminUser(user);

  useEffect(() => {
    if (!user) router.replace('/login');
  }, [user]);

  const load = useCallback(async () => {
    const res = await fetchAdminStats();
    if (res.ok) {
      setStats(res.stats);
      setError(null);
    } else {
      setError({ message: res.error, denied: res.denied });
    }
  }, []);

  useEffect(() => {
    if (!allowed) {
      setLoading(false);
      setError({ message: '', denied: true });
      return;
    }
    let alive = true;
    (async () => {
      await load();
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [allowed, load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const updatedAt = stats
    ? new Date(stats.generatedAt).toLocaleTimeString('tr-TR', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
      })
    : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
        >
          <Ionicons name="chevron-back" size={22} color={c.textHigh} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{t('admin.title')}</Text>
          {stats ? (
            <Text style={styles.headerSub}>{t('admin.updatedAt', { time: updatedAt })}</Text>
          ) : null}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          allowed ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.neon} />
          ) : undefined
        }
      >
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={c.neon} />
            <Text style={styles.muted}>{t('admin.loading')}</Text>
          </View>
        ) : error ? (
          <Animated.View entering={FadeInDown.duration(320)} style={styles.errorCard}>
            <Ionicons
              name={error.denied ? 'lock-closed' : 'alert-circle'}
              size={28}
              color={error.denied ? c.gold : c.red}
            />
            <Text style={styles.errorTitle}>
              {error.denied ? t('admin.deniedTitle') : t('admin.errorTitle')}
            </Text>
            <Text style={styles.errorBody}>
              {error.denied ? t('admin.deniedBody') : error.message}
            </Text>
            {!error.denied ? (
              <Pressable
                onPress={async () => { setLoading(true); await load(); setLoading(false); }}
                style={styles.retryBtn}
                accessibilityRole="button"
              >
                <Text style={styles.retryText}>{t('admin.retry')}</Text>
              </Pressable>
            ) : null}
          </Animated.View>
        ) : stats ? (
          <>
            {stats.reach.capped ? (
              <View style={styles.cappedBox}>
                <Ionicons name="warning" size={16} color={c.gold} />
                <Text style={styles.cappedText}>{t('admin.cappedWarning')}</Text>
              </View>
            ) : null}

            {/* ŞU AN */}
            <Section c={c} title={t('admin.secNow')} index={0}>
              <Row>
                <Tile c={c} value={stats.live.onlineNow} label={t('admin.online')} highlight />
                <Tile c={c} value={stats.live.lastHour} label={t('admin.lastHour')} />
              </Row>
            </Section>

            {/* AKTİF KULLANAN KİŞİ */}
            <Section c={c} title={t('admin.secActive')} index={1}>
              <Row>
                <Tile c={c} value={stats.live.active24h} label={t('admin.d1')} />
                <Tile c={c} value={stats.live.active7d} label={t('admin.d7')} />
                <Tile c={c} value={stats.live.active30d} label={t('admin.d30')} />
              </Row>
            </Section>

            {/* KİŞİ VE CİHAZ */}
            <Section c={c} title={t('admin.secReach')} index={2}>
              <Row>
                <Tile c={c} value={stats.reach.people} label={t('admin.people')} highlight wide />
                <Tile c={c} value={stats.reach.installs} label={t('admin.installs')} wide />
              </Row>
              <Row>
                <Tile c={c} value={stats.reach.accounts} label={t('admin.accounts')} full />
              </Row>
              <Text style={styles.note}>{t('admin.reachNote')}</Text>
              <Row>
                <Tile c={c} value={stats.reach.newAccounts7d} label={t('admin.newAccounts7d')} wide />
                <Tile c={c} value={stats.reach.newAccounts30d} label={t('admin.newAccounts30d')} wide />
              </Row>
            </Section>

            {/* PREMIUM */}
            <Section c={c} title={t('admin.secPremium')} index={3}>
              <Row>
                <Tile c={c} value={stats.premium.premiumPeople} label={t('admin.premiumPeople')} highlight />
                <Tile c={c} value={stats.premium.familyMembers} label={t('admin.familyMembers')} />
                <Tile c={c} value={stats.premium.lifetime} label={t('admin.lifetime')} />
              </Row>
              <Text style={styles.note}>{t('admin.premiumNote')}</Text>
            </Section>

            {/* SATIN ALMALAR */}
            <Section c={c} title={t('admin.secPurchases')} index={4}>
              {stats.purchases.empty ? (
                <Text style={styles.note}>{t('admin.purchasesEmpty')}</Text>
              ) : (
                <>
                  <Row>
                    <Tile c={c} value={stats.purchases.buyers} label={t('admin.buyers')} highlight />
                    <Tile c={c} value={stats.purchases.initialPurchases} label={t('admin.firstPurchases')} />
                    <Tile c={c} value={stats.purchases.renewals} label={t('admin.renewals')} />
                  </Row>
                  <Row>
                    <Tile c={c} value={stats.purchases.last30d} label={t('admin.purchasesLast30d')} wide />
                    <Tile c={c} value={stats.purchases.churn} label={t('admin.churn')} wide />
                  </Row>
                  {stats.purchases.sandboxEvents > 0 ? (
                    <Row>
                      <Tile c={c} value={stats.purchases.sandboxEvents} label={t('admin.sandbox')} full />
                    </Row>
                  ) : null}
                  {stats.purchases.byCountry.length > 0 ? (
                    <ListBlock
                      c={c}
                      rows={stats.purchases.byCountry.map((e) => ({
                        key: e.key,
                        left: `${countryFlag(e.key)}  ${countryName(e.key)}`,
                        right: fmt(e.count),
                      }))}
                    />
                  ) : null}
                </>
              )}
            </Section>

            {/* CİHAZ TÜRÜ */}
            <Section c={c} title={t('admin.secDeviceType')} index={5}>
              {stats.deviceTypes.length === 0 ? (
                <Text style={styles.note}>{t('admin.noData')}</Text>
              ) : (
                <ListBlock
                  c={c}
                  rows={stats.deviceTypes.map((e) => ({
                    key: e.key,
                    left: deviceTypeLabel(e.key),
                    right: fmt(e.count),
                  }))}
                />
              )}
            </Section>

            {/* ÜLKELER */}
            <Section c={c} title={t('admin.secCountries')} index={6}>
              {stats.countries.length === 0 ? (
                <Text style={styles.note}>{t('admin.noData')}</Text>
              ) : (
                <ListBlock
                  c={c}
                  rows={stats.countries.map((e) => ({
                    key: e.code,
                    left: `${countryFlag(e.code)}  ${countryName(e.code)}`,
                    sub: t('admin.countryLine', {
                      online: e.onlineNow,
                      today: e.today,
                      devices: e.devices,
                    }),
                    right: fmt(e.people),
                  }))}
                />
              )}
            </Section>

            {/* MODELLER */}
            <Section c={c} title={t('admin.secModels')} index={7}>
              {stats.models.length === 0 ? (
                <Text style={styles.note}>{t('admin.noData')}</Text>
              ) : (
                <ListBlock
                  c={c}
                  rows={stats.models.map((e) => ({
                    key: e.key, left: e.key, right: fmt(e.count),
                  }))}
                />
              )}
            </Section>

            {/* GİRİŞ YÖNTEMİ */}
            <Section c={c} title={t('admin.secProviders')} index={8}>
              <ListBlock
                c={c}
                rows={stats.providers.map((e: AdminCountEntry) => ({
                  key: e.key, left: providerLabel(e.key), right: fmt(e.count),
                }))}
              />
            </Section>

            {/* İNDİRMELER */}
            <Section c={c} title={t('admin.secDownloads')} index={9}>
              <Text style={styles.note}>{t('admin.downloadsPending')}</Text>
            </Section>

            {/* OTURUM */}
            <Section c={c} title={t('admin.secSession')} index={10}>
              <Text selectable style={styles.uidValue}>{stats.caller.uid}</Text>
              {stats.caller.email ? (
                <Text style={styles.uidEmail}>{stats.caller.email}</Text>
              ) : null}
            </Section>

            <View style={styles.footerNote}>
              <Ionicons name="eye-outline" size={14} color={c.textLow} />
              <Text style={styles.footerText}>{t('admin.readOnlyNote')}</Text>
            </View>
            <View style={{ height: spacing.xxl }} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ──────────────────────────────────────────────────────────────────
// Yardımcılar
// ──────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString('tr-TR');
}

/** "ios·phone" → "iOS · Telefon" */
function deviceTypeLabel(key: string): string {
  const [os, type] = key.split('·');
  const osLabel = os === 'ios' ? 'iOS' : os === 'android' ? 'Android' : os;
  const typeLabel =
    type === 'phone' ? 'Telefon'
      : type === 'tablet' ? 'Tablet'
      : type === 'desktop' ? 'Masaüstü'
      : type === 'tv' ? 'TV'
      : 'Bilinmiyor';
  return `${osLabel} · ${typeLabel}`;
}

function providerLabel(id: string): string {
  if (id === 'password') return 'E-posta / şifre';
  if (id === 'google.com') return 'Google';
  if (id === 'apple.com') return 'Apple';
  return id;
}

// ──────────────────────────────────────────────────────────────────
// Bileşenler
// ──────────────────────────────────────────────────────────────────

function Section({
  c, title, index, children,
}: {
  c: ReturnType<typeof useThemeColors>;
  title: string;
  index: number;
  children: React.ReactNode;
}) {
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <Animated.View
      entering={FadeInDown.delay(40 + index * 35).duration(340).springify().damping(14)}
      style={styles.section}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </Animated.View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={rowStyle.row}>{children}</View>;
}

function Tile({
  c, value, label, highlight, wide, full,
}: {
  c: ReturnType<typeof useThemeColors>;
  value: number;
  label: string;
  highlight?: boolean;
  wide?: boolean;
  full?: boolean;
}) {
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View
      style={[
        styles.tile,
        wide && styles.tileWide,
        full && styles.tileFull,
        highlight && styles.tileHighlight,
      ]}
    >
      <Text style={[styles.tileValue, highlight && styles.tileValueHighlight]}>
        {fmt(value)}
      </Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

function ListBlock({
  c, rows,
}: {
  c: ReturnType<typeof useThemeColors>;
  rows: { key: string; left: string; sub?: string; right: string }[];
}) {
  const styles = useMemo(() => makeStyles(c), [c]);
  return (
    <View style={styles.listBlock}>
      {rows.map((r, i) => (
        <View key={r.key} style={[styles.listRow, i === rows.length - 1 && styles.listRowLast]}>
          <View style={styles.listLeft}>
            <Text style={styles.listLabel} numberOfLines={1}>{r.left}</Text>
            {r.sub ? <Text style={styles.listSub}>{r.sub}</Text> : null}
          </View>
          <Text style={styles.listValue}>{r.right}</Text>
        </View>
      ))}
    </View>
  );
}

const rowStyle = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10, marginBottom: 10 },
});

// ──────────────────────────────────────────────────────────────────
// Stiller
// ──────────────────────────────────────────────────────────────────

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.bg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    },
    backBtn: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: c.glassBg, borderWidth: 1, borderColor: c.glassBorderStrong,
      alignItems: 'center', justifyContent: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center' },
    headerTitle: { ...textStyles.subheading, color: c.textHigh },
    headerSub: { ...textStyles.body, color: c.textLow, fontSize: 12, marginTop: 1 },
    headerSpacer: { width: 40 },

    content: { padding: spacing.base, paddingBottom: spacing.xxl },

    section: { marginBottom: spacing.lg },
    sectionTitle: {
      ...textStyles.label, color: c.textLow, fontSize: 11,
      letterSpacing: 1.2, marginBottom: spacing.sm,
    },

    tile: {
      flex: 1, minWidth: 0,
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg,
      paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    },
    tileWide: { flex: 1 },
    tileFull: { flex: 1 },
    tileHighlight: { backgroundColor: c.neonBg, borderColor: c.neon },
    tileValue: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 30, lineHeight: 36 },
    tileValueHighlight: { color: c.neon },
    tileLabel: { ...textStyles.body, color: c.textLow, fontSize: 12, marginTop: 2 },

    note: {
      ...textStyles.body, color: c.textLow, fontSize: 12,
      lineHeight: 18, marginBottom: 10,
    },

    listBlock: {
      backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorder,
      borderRadius: radius.lg, paddingHorizontal: spacing.base,
    },
    listRow: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
      paddingVertical: 11,
      borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.divider,
    },
    listRowLast: { borderBottomWidth: 0 },
    listLeft: { flex: 1, minWidth: 0 },
    listLabel: { ...textStyles.body, color: c.textHigh, fontSize: 15 },
    listSub: { ...textStyles.body, color: c.textLow, fontSize: 11, marginTop: 1 },
    listValue: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 17 },

    centerBox: {
      alignItems: 'center', justifyContent: 'center',
      gap: spacing.sm, paddingTop: spacing.xxl,
    },
    muted: { ...textStyles.body, color: c.textLow, fontSize: 13 },

    cappedBox: {
      flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
      padding: spacing.sm, borderRadius: radius.md,
      backgroundColor: c.goldBg, borderWidth: 1, borderColor: c.gold,
      marginBottom: spacing.md,
    },
    cappedText: { ...textStyles.body, color: c.textMed, fontSize: 12, flex: 1 },

    uidValue: { ...textStyles.bodyBold, color: c.textHigh, fontSize: 13 },
    uidEmail: { ...textStyles.body, color: c.textMed, fontSize: 12, marginTop: 2 },

    errorCard: {
      alignItems: 'center', gap: spacing.sm, padding: spacing.lg,
      borderRadius: radius.lg, backgroundColor: c.glassBg,
      borderWidth: 1, borderColor: c.glassBorder, marginTop: spacing.lg,
    },
    errorTitle: { ...textStyles.subheading, color: c.textHigh, fontSize: 17, textAlign: 'center' },
    errorBody: { ...textStyles.body, color: c.textMed, fontSize: 13, lineHeight: 19, textAlign: 'center' },
    retryBtn: {
      marginTop: spacing.xs, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
      borderRadius: radius.pill, backgroundColor: c.neonBg,
      borderWidth: 1, borderColor: c.neon,
    },
    retryText: { ...textStyles.bodyBold, color: c.neon, fontSize: 14 },

    footerNote: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: spacing.xs, paddingTop: spacing.xs,
    },
    footerText: { ...textStyles.body, color: c.textLow, fontSize: 11 },
  });
}
