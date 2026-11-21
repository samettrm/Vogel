import React, { useCallback, useEffect, useState } from 'react';
import { Alert, AppState, Image, Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '../theme';
import { useT } from '../i18n';
import { ertelendiMi, magazayaGitmeli, seritKarari, type PlayDurumu } from '../services/guncellemeKural';
import { playGuncellemeDurumu, playIleGuncelle } from '../services/playGuncelleme';

/**
 * "YENİ SÜRÜM HAZIR" ŞERİDİ — Emir Defteri A20 (Samet, 08-11-2026).
 * Standart: ~/.claude/standards/guncelleme-bildirimi.md (şerit bölümü); referans
 * Canlı Döviz `components/GuncellemeSeridi.tsx` (Vogel uyarlaması) ← Kalorimetre `GuncellemeSeridi.tsx` (sabit kopya: standards/guncelleme-seridi/).
 *
 * Yalnız eski sürümdekiler görür; güncelleyince kendiliğinden kaybolur. iPhone'da App
 * Store açılır; Android'de Google Play'in güncelleme ekranı uygulamanın içinde açılır,
 * olmazsa Play sayfası. × aynı sürüm için 24 saat gizler. Bilinmeyen her durumda şerit
 * AÇILMAZ (yanlış uyarı, uyarı vermemekten pahalıdır). İçeriği aşağı itmez: kök
 * düzendeki üst katmanda durur.
 */
const APP_STORE_URL = 'https://apps.apple.com/app/id6771534635';
const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.busater.vogel';
const MAGAZA_URL = Platform.OS === 'ios' ? APP_STORE_URL : PLAY_URL;
const SORGU_URL = 'https://itunes.apple.com/lookup?bundleId=com.yenipc002.Vogel';
const ERTELEME_ANAHTARI = 'vogel.guncelleme.ertelendi';
const DENETIM_MS = 15 * 60_000;
const SIMGE = require('../../assets/images/icon.png');

async function appStoreSurumu(): Promise<{ surum: string | null; notlar: string | null }> {
  if (Platform.OS !== 'ios') return { surum: null, notlar: null };
  try {
    const yanit = await fetch(`${SORGU_URL}&t=${Date.now()}`);
    if (!yanit.ok) return { surum: null, notlar: null };
    const kayit = (await yanit.json())?.results?.[0];
    return { surum: kayit?.version ?? null, notlar: kayit?.releaseNotes ?? null };
  } catch (e) {
    console.debug('[guncelleme] lookup:', String(e).slice(0, 120));
    return { surum: null, notlar: null };
  }
}

async function guncelle() {
  if (Platform.OS === 'android' && !magazayaGitmeli(await playIleGuncelle())) return;
  Linking.openURL(MAGAZA_URL).catch((e) => console.warn('[guncelleme] mağaza:', String(e).slice(0, 120)));
}

export function GuncellemeSeridi() {
  const t = useT();
  const c = useThemeColors();
  const insets = useSafeAreaInsets();
  const [appStore, setAppStore] = useState<{ surum: string | null; notlar: string | null }>({ surum: null, notlar: null });
  const [play, setPlay] = useState<PlayDurumu | null>(null);
  const [ertelendi, setErtelendi] = useState(true);

  useEffect(() => {
    let canli = true;
    const yukle = () => {
      void appStoreSurumu().then((d) => {
        if (canli) setAppStore(d);
      });
      void playGuncellemeDurumu().then((d) => {
        if (!canli) return;
        setPlay(d);
        if (d?.suruyor) void playIleGuncelle(); // yarıda kalan Play güncellemesi dönüşte sürdürülür
      });
    };
    yukle();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') yukle();
    });
    const saat = setInterval(() => {
      if (AppState.currentState === 'active') yukle();
    }, DENETIM_MS);
    return () => {
      canli = false;
      sub.remove();
      clearInterval(saat);
    };
  }, []);

  const karar = seritKarari(
    { surum: Application.nativeApplicationVersion, build: Application.nativeBuildVersion },
    appStore.surum,
    play,
  );

  useEffect(() => {
    let canli = true;
    if (!karar.anahtar) {
      setErtelendi(true);
      return;
    }
    AsyncStorage.getItem(ERTELEME_ANAHTARI)
      .then((ham) => {
        if (canli) setErtelendi(ertelendiMi(ham ? JSON.parse(ham) : null, karar.anahtar!, Date.now()));
      })
      .catch((e) => {
        console.debug('[guncelleme] erteleme okunamadı:', String(e).slice(0, 120));
        if (canli) setErtelendi(false);
      });
    return () => {
      canli = false;
    };
  }, [karar.anahtar]);

  const kapat = useCallback(() => {
    setErtelendi(true);
    if (!karar.anahtar) return;
    AsyncStorage.setItem(ERTELEME_ANAHTARI, JSON.stringify({ surum: karar.anahtar, zaman: Date.now() })).catch((e) =>
      console.debug('[guncelleme] erteleme:', String(e).slice(0, 120)),
    );
  }, [karar.anahtar]);

  if (!karar.gorunur || ertelendi) return null;

  const baslik = karar.surum ? `Vogel ${karar.surum}` : 'Vogel';
  const dokunus = () => {
    Haptics.selectionAsync().catch((e) => console.debug('[guncelleme] titreşim:', String(e).slice(0, 80)));
  };
  const yenilikler = () => {
    dokunus();
    Alert.alert(baslik, appStore.notlar || t('guncelleme.magazadaHazir'), [
      { text: t('guncelleme.dahaSonra'), style: 'cancel' },
      { text: t('guncelleme.guncelle'), onPress: () => void guncelle() },
    ]);
  };

  return (
    <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 12 }} pointerEvents="box-none">
      <Pressable
        onPress={yenilikler}
        accessibilityRole="button"
        accessibilityLabel={`${t('guncelleme.yeniSurumHazir')}: ${baslik}`}
        style={[styles.serit, { backgroundColor: c.surfaceElevated, borderColor: c.border }]}
      >
        <Image source={SIMGE} style={styles.simge} accessibilityIgnoresInvertColors />
        <View style={{ flex: 1 }}>
          <Text style={[styles.baslik, { color: c.textHigh }]} numberOfLines={1}>
            {t('guncelleme.yeniSurumHazir')}
          </Text>
          <Text style={[styles.alt, { color: c.textMed }]} numberOfLines={1}>
            {baslik}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            dokunus();
            void guncelle();
          }}
          accessibilityRole="button"
          style={[styles.dugme, { backgroundColor: c.neon }]}
        >
          <Text style={[styles.dugmeYazi, { color: c.textOnNeon }]}>{t('guncelleme.guncelle')}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            dokunus();
            kapat();
          }}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={t('guncelleme.dahaSonra')}
          style={styles.kapat}
        >
          <Ionicons name="close" size={18} color={c.textLow} />
        </Pressable>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  serit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  simge: { width: 32, height: 32, borderRadius: 8 },
  baslik: { fontSize: 13, fontWeight: '600' },
  alt: { fontSize: 12 },
  dugme: { paddingHorizontal: 14, minHeight: 34, justifyContent: 'center', borderRadius: 17 },
  dugmeYazi: { fontSize: 13, fontWeight: '600' },
  kapat: { minWidth: 28, minHeight: 34, alignItems: 'center', justifyContent: 'center' },
});
