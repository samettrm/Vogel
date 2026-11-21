/**
 * Owner Control Center — panel ekranı (standart §9 · Emir Defteri A4, 21-11-2026). Canlı Döviz app/owner-panel.tsx uyarlaması;
 * veri server/analitik'ten gelir. Firestore tabanlı cihaz/premium/aile sayıları app/yonetim.tsx'te kalır.
 *
 * 🔴 GİZLİ DEĞİL, YETKİLİ. Bu ekrana giden bağlantı Profil'de yalnız owner'a
 * görünür; ama asıl koruma orada değil. Biri bu rotayı doğrudan açsa bile
 * sunucu 404 döner ve ekran veri gösteremez. Görünürlük kolaylıktır; güvenlik
 * sunucudadır.
 *
 * ⚠️ ÖLÜ UÇ YOK (Guideline 2.1): hata durumunda "Tekrar dene" düğmesi vardır.
 *
 * SAYILARIN DÜRÜSTLÜĞÜ — standardın en pahalı üç dersi burada görünür:
 *   1. Kaynağı kanıtlanamayan kullanıcı 'organic' DEĞİL, 'unattributed_production'.
 *   2. Gelir yalnız sunucu tarafı doğrulanmış PRODUCTION işlemden gelir; sandbox ayrı satırdır.
 *   3. Kayıp olay sayısı gizlenmez; Veri Sağlığı bölümünde durur.
 * Bütün oranlar sunucuda hesaplanır; payda sıfırsa "—" yazılır, yüzde uydurulmaz.
 */
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '../src/theme';
import {
  panelVerisi, VARSAYILAN_FILTRE, type Aralik, type PanelFiltre, type PanelVerisi, type Sinif,
} from '../src/services/ownerPanel';
import { kayipOlaySayisi } from '../src/services/olay';
import { countryLabel } from '../src/utils/countryNames';

const YOK = '—';

const ADIM_ADI: Record<string, string> = {
  'app.first_open': 'İlk açılış',
  'onboarding.completed': 'Onboarding tamam',
  'lesson.completed': 'Ders bitirdi',
  'value.activated': 'Aktivasyon (2. ders)',
  'paywall.viewed': 'Paywall görüldü',
  'purchase.started': 'Satın alma başladı',
  'purchase.completed': 'Satın alma tamam',
};
const OZELLIK_ADI: Record<string, string> = {
  'feature.review.used': 'Tekrar merkezi',
  'feature.flashcards.used': 'Kartlar',
  'feature.exam.started': 'Sınav',
  'feature.speaking.used': 'Konuşma (Sprechen)',
  'feature.leaderboard.viewed': 'Lider tablosu',
  'feature.family.opened': 'Aile planı',
};
const UC_ADI: Record<string, string> = {
  '/olay': 'Analitik olayı', '/webhook/revenuecat': 'RevenueCat (Firebase iletimi)', '/guncelleme/kayit': 'Güncelleme kaydı',
  '/guncelleme/tetik': 'Güncelleme tetiği', '/panel': 'Owner paneli', '/owner/durum': 'Owner durumu', diger: 'Diğer',
};
const SINIF_ADI: Record<string, string> = {
  organic: 'Organik', unattributed_production: 'Kaynağı belirsiz (production)', paid: 'Ücretli', referral: 'Yönlendirme',
  direct: 'Doğrudan', owner_test: 'Owner / test', testflight: 'TestFlight', sandbox: 'Sandbox', development: 'Geliştirme',
  simulator: 'Simülatör', app_review: 'Mağaza denetçisi',
};
const ARALIKLAR: { k: Aralik; ad: string }[] = [
  { k: 'bugun', ad: 'Bugün' }, { k: '24s', ad: '24 saat' }, { k: '7g', ad: '7 gün' },
  { k: '30g', ad: '30 gün' }, { k: '90g', ad: '90 gün' }, { k: 'tumu', ad: 'Tümü' },
];
const SINIFLAR: { k: Sinif; ad: string }[] = [
  { k: 'gercek', ad: 'Gerçek' }, { k: 'organic', ad: 'Organik' },
  { k: 'unattributed_production', ad: 'Kaynağı belirsiz' }, { k: 'dislanan', ad: 'Dışlanan' }, { k: 'tumu', ad: 'Tümü' },
];

const tl = (kurus: number | null | undefined) =>
  kurus === null || kurus === undefined ? YOK : `₺${(kurus / 100).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const yuzde = (x: number | null | undefined) => (x === null || x === undefined ? YOK : `%${x.toLocaleString('tr-TR')}`);
const zaman = (ts: number) => new Date(ts * 1000).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export default function OwnerPanelScreen() {
  const c = useThemeColors();
  const [filtre, setFiltre] = useState<PanelFiltre>(VARSAYILAN_FILTRE);
  const [veri, setVeri] = useState<PanelVerisi | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [acikUlke, setAcikUlke] = useState<string | null>(null);

  const yukle = useCallback(async (f: PanelFiltre) => {
    setHata(null);
    try {
      setVeri(await panelVerisi(f));
    } catch (e) {
      // ⚠️ Sessiz yutma YOK. Hata kullanıcıya söylenir ve tekrar denenebilir.
      setHata(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setYukleniyor(false);
    }
  }, []);

  useEffect(() => { void yukle(filtre); }, [yukle, filtre]);
  const degistir = (x: Partial<PanelFiltre>) => { setYukleniyor(true); setFiltre((f) => ({ ...f, ...x })); };

  const Kart = ({ baslik, deger, alt }: { baslik: string; deger: string; alt?: string }) => (
    <View style={[styles.kart, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Text style={[styles.kartBaslik, { color: c.textLow }]}>{baslik}</Text>
      <Text style={[styles.kartDeger, { color: c.textHigh }]}>{deger}</Text>
      {alt ? <Text style={[styles.kartAlt, { color: c.textLow }]}>{alt}</Text> : null}
    </View>
  );
  const Bolum = ({ baslik, children }: { baslik: string; children: ReactNode }) => (
    <View style={{ marginTop: 22 }}>
      <Text style={[styles.bolumBaslik, { color: c.textHigh }]}>{baslik}</Text>
      {children}
    </View>
  );
  const Satir = ({ etiket, deger, alt, sol }: { etiket?: string; deger: string; alt?: string; sol?: ReactNode }) => (
    <View style={[styles.satir, { borderColor: c.border }]}>
      <View style={{ flex: 1 }}>
        {sol ?? <Text style={[styles.satirAd, { color: c.textHigh }]}>{etiket}</Text>}
        {alt ? <Text style={[styles.satirAlt, { color: c.textLow }]}>{alt}</Text> : null}
      </View>
      <Text style={[styles.satirDeger, { color: c.textMed }]}>{deger}</Text>
    </View>
  );
  const Not = ({ children }: { children: ReactNode }) => (
    <Text style={[styles.not, { color: c.textLow }]}>{children}</Text>
  );
  const Cip = ({ ad, secili, onPress, cocuk }: { ad?: string; secili: boolean; onPress: () => void; cocuk?: ReactNode }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: secili }}
      style={({ pressed }) => [
        styles.cip,
        { borderColor: secili ? c.neon : c.border, backgroundColor: secili ? c.neon : 'transparent', opacity: pressed ? 0.8 : 1 },
      ]}
    >
      {cocuk ?? <Text style={[styles.cipYazi, { color: secili ? c.textOnNeon : c.textMed }]}>{ad}</Text>}
    </Pressable>
  );
  const CipSirasi = ({ children }: { children: ReactNode }) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cipSirasi}>{children}</ScrollView>
  );

  const Filtreler = () => (
    <View>
      <CipSirasi>
        {ARALIKLAR.map((a) => <Cip key={a.k} ad={a.ad} secili={filtre.aralik === a.k} onPress={() => degistir({ aralik: a.k })} />)}
      </CipSirasi>
      <CipSirasi>
        <Cip ad="Tüm platformlar" secili={!filtre.platform} onPress={() => degistir({ platform: null })} />
        <Cip ad="iOS" secili={filtre.platform === 'ios'} onPress={() => degistir({ platform: 'ios' })} />
        <Cip ad="Android" secili={filtre.platform === 'android'} onPress={() => degistir({ platform: 'android' })} />
        <View style={[styles.ayrac, { backgroundColor: c.border }]} />
        {SINIFLAR.map((s) => <Cip key={s.k} ad={s.ad} secili={filtre.sinif === s.k} onPress={() => degistir({ sinif: s.k })} />)}
      </CipSirasi>
      {veri ? (
        <>
          <CipSirasi>
            <Cip ad="Tüm ülkeler" secili={!filtre.ulke} onPress={() => degistir({ ulke: null })} />
            {veri.secenekler.ulkeler.map((u) => (
              <Cip key={u} secili={filtre.ulke === u} onPress={() => degistir({ ulke: u })}
                cocuk={<Text style={[styles.cipYazi, { color: filtre.ulke === u ? c.textOnNeon : c.textMed }]}>{countryLabel(u)}</Text>} />
            ))}
          </CipSirasi>
          <CipSirasi>
            <Cip ad="Tüm sürümler" secili={!filtre.surum} onPress={() => degistir({ surum: null })} />
            {veri.secenekler.surumler.map((s) => <Cip key={s} ad={s} secili={filtre.surum === s} onPress={() => degistir({ surum: s })} />)}
          </CipSirasi>
        </>
      ) : null}
    </View>
  );

  const govde = (v: PanelVerisi) => {
    const o = v.ozet;
    return (
      <>
        <Bolum baslik="Gerçek kullanıcılar">
          <View style={styles.izgara}>
            <Kart baslik="Gerçek kişi" deger={String(o.gercek_kisi)} alt={`organik ${o.organik}`} />
            <Kart baslik="Şu an çevrimiçi" deger={String(o.cevrimici)} alt="son 5 dakika" />
            <Kart baslik="DAU" deger={String(o.dau)} />
            <Kart baslik="WAU" deger={String(o.wau)} />
            <Kart baslik="MAU" deger={String(o.mau)} />
            <Kart baslik="Aralıkta görülen" deger={String(o.aralikta_gorulen)} />
            <Kart baslik="Yeni 24s / 7g / 30g" deger={`${o.yeni_24s} / ${o.yeni_7g} / ${o.yeni_30g}`} />
            <Kart baslik="Aktive olan" deger={String(o.aktive)} alt={yuzde(o.aktive_orani)} />
            <Kart baslik="Ödeyen" deger={String(o.odeyen)} alt={`dönüşüm ${yuzde(v.para.donusum)}`} />
          </View>
        </Bolum>

        <Bolum baslik="Tutundurma">
          <Not>İlk görülmesinden N gün sonra yeniden gelen kişi oranı (son 90 günün kohortu).</Not>
          <View style={styles.izgara}>
            {(['d1', 'd7', 'd30'] as const).map((k) => (
              <Kart key={k} baslik={k.toUpperCase()} deger={yuzde(v.tutundurma[k].oran)} alt={`${v.tutundurma[k].donen} / ${v.tutundurma[k].kohort} kişi`} />
            ))}
          </View>
        </Bolum>

        <Bolum baslik="Gelir">
          <Not>Yalnız sunucuda doğrulanmış production işlem. Sandbox ve elle verilen premium gelire girmez.</Not>
          <View style={styles.izgara}>
            <Kart baslik="Bugün" deger={tl(v.gelir.bugun_kurus)} />
            <Kart baslik="7 gün" deger={tl(v.gelir.g7_kurus)} />
            <Kart baslik="30 gün" deger={tl(v.gelir.g30_kurus)} />
            <Kart baslik="Seçili aralık" deger={tl(v.gelir.gelir_kurus)} alt={`${v.gelir.islem} işlem`} />
            <Kart baslik="MRR (yaklaşık)" deger={tl(v.gelir.mrr_yaklasik_kurus)} alt="son 365 gün yıllık gelir / 12" />
            <Kart baslik="İade" deger={String(v.gelir.iade)} alt={`sandbox işlem ${v.gelir.sandbox_islem}`} />
          </View>
          <Satir etiket="Paywall gören kişi" deger={String(v.para.paywall_kisi)} />
          <Satir etiket="Satın almayı deneyen kişi" deger={String(v.para.satin_alma_deneyen)} alt={`${v.para.satin_alma_denemesi} deneme · ${v.para.satin_alma_hatasi} hata`} />
        </Bolum>

        <Bolum baslik="Huni (tekil kişi)">
          {v.funnel.adimlar.map((a, i) => {
            const genislik = a.ilke_gore ?? 0;
            return (
              <View key={a.ad} style={[styles.satir, { borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.satirAd, { color: c.textHigh }]}>{ADIM_ADI[a.ad] || a.ad}</Text>
                  <Text style={[styles.satirAlt, { color: c.textLow }]}>
                    {i === 0 ? 'başlangıç' : `öncekine göre ${yuzde(a.onceye_gore)} · ilk adıma göre ${yuzde(a.ilke_gore)} · kayıp ${a.kayip}`}
                  </Text>
                </View>
                <View style={[styles.cubukZemin, { backgroundColor: c.border }]}>
                  <View style={[styles.cubuk, { width: `${Math.max(genislik, 1)}%`, backgroundColor: c.neon }]} />
                </View>
                <Text style={[styles.satirDeger, { color: c.textMed }]}>{a.tekil}</Text>
              </View>
            );
          })}
          <Not>
            {v.funnel.en_buyuk_dusus
              ? `En büyük düşüş: ${ADIM_ADI[v.funnel.en_buyuk_dusus.nereden] || v.funnel.en_buyuk_dusus.nereden} → ${ADIM_ADI[v.funnel.en_buyuk_dusus.nereye] || v.funnel.en_buyuk_dusus.nereye} (%${v.funnel.en_buyuk_dusus.oran}, ${v.funnel.en_buyuk_dusus.kayip} kişi)`
              : 'Henüz düşüş hesaplanacak veri yok.'}
          </Not>
        </Bolum>

        <Bolum baslik="Ülkeler (dokunun: ayrıntı)">
          {/* Kaynak: kisiler.ulke — CİHAZIN BÖLGE AYARI; mağaza (storefront) ülkesi değildir. */}
          <Not>Cihaz bölge ayarına göre. Mağaza (storefront) ülkesi değildir.</Not>
          {v.ulkeler.length === 0 ? <Satir etiket="Veri yok" deger={YOK} /> : v.ulkeler.map((u) => (
            <Pressable key={u.ulke} onPress={() => setAcikUlke(acikUlke === u.ulke ? null : u.ulke)} accessibilityRole="button">
              <Satir
                sol={<Text style={[styles.satirAd, { color: c.textHigh }]}>{countryLabel(u.ulke)}</Text>}
                deger={`${u.kisi} kişi`}
                alt={acikUlke === u.ulke
                  ? `yeni ${u.yeni} · DAU ${u.dau} · aktive ${u.aktive} · ödeyen ${u.odeyen} · satış ${u.satis} · gelir ${tl(u.gelir_kurus)} · iade ${u.iade} · dönüşüm ${yuzde(u.donusum)} · ARPU ${tl(u.arpu_kurus)} · ARPPU ${tl(u.arppu_kurus)}`
                  : `aktive ${u.aktive} · ${u.satis > 0 ? `${u.satis} satış · ${tl(u.gelir_kurus)}` : 'satış yok'}`}
              />
            </Pressable>
          ))}
        </Bolum>

        <Bolum baslik="Özellikler (tekil kişi · adet)">
          {v.ozellikler.length === 0 ? <Satir etiket="Veri yok" deger={YOK} /> : v.ozellikler.map((x) => (
            <Satir key={x.ad} etiket={OZELLIK_ADI[x.ad] || x.ad} deger={`${x.tekil} · ${x.adet}`} />
          ))}
        </Bolum>

        <Bolum baslik="Sürümler">
          {v.surumler.length === 0 ? <Satir etiket="Veri yok" deger={YOK} /> : v.surumler.map((x) => (
            <Satir key={`${x.platform}-${x.surum}`} etiket={`${x.platform} · ${x.surum}`} deger={`${x.kisi} kişi`} alt={`${x.kurulum} kurulum`} />
          ))}
        </Bolum>

        <Bolum baslik="Cihaz ve işletim sistemi">
          {v.cihazlar.map((x) => <Satir key={`c-${x.platform}-${x.cihaz}`} etiket={`${x.platform} · ${x.cihaz}`} deger={`${x.kisi} kişi`} />)}
          {v.isletim_sistemleri.map((x) => <Satir key={`o-${x.platform}-${x.os}`} etiket={`${x.platform} ${x.os}`} deger={`${x.kisi} kişi`} />)}
          {v.cihazlar.length + v.isletim_sistemleri.length === 0 ? <Satir etiket="Veri yok" deger={YOK} /> : null}
        </Bolum>


        <Bolum baslik="Mağaza puanı penceresi">
          <Not>Yalnız “istendi” sayılır. Pencerenin açılıp açılmadığını ve verilen puanı mağaza bildirmez.</Not>
          <Satir etiket="Uygun an" deger={String(v.puan.uygun)} />
          <Satir etiket="İstendi" deger={String(v.puan.istendi)} alt={`${v.puan.istenen_kisi} kişi`} />
        </Bolum>

        <Bolum baslik="Güncelleme bildirimi">
          {v.guncelleme.kayitli_cihaz.map((x) => <Satir key={x.platform} etiket={`Kayıtlı cihaz · ${x.platform}`} deger={String(x.cihaz)} />)}
          {v.guncelleme.gonderim.length === 0 ? <Satir etiket="Henüz gönderim yok" deger={YOK} /> : v.guncelleme.gonderim.map((g) => (
            <Satir key={`${g.anahtar}-${g.sonuc}`} etiket={g.anahtar} deger={`${g.adet}`} alt={`${g.sonuc === 'ok' ? 'gönderildi' : g.sonuc} · son ${zaman(Math.floor(g.son / 1000))}`} />
          ))}
          <Not>“Güncelledi” sayısı bildirimden uydurulmaz; Sürümler bölümündeki dağılımdan okunur.</Not>
        </Bolum>

        <Bolum baslik="Sunucu sağlığı (7 gün)">
          {v.api.length === 0 ? <Satir etiket="Veri yok" deger={YOK} /> : v.api.map((a) => (
            <Satir key={a.uc} etiket={UC_ADI[a.uc] ?? a.uc} deger={String(a.toplam)} alt={`2xx ${a['2xx']} · 4xx ${a['4xx']} · 5xx ${a['5xx']} · hata ${yuzde(a.hata_orani)}`} />
          ))}
        </Bolum>

        <Bolum baslik="Çökme">
          {v.cokme.satirlar.length === 0 ? <Satir etiket="Seçili aralıkta çökme yok" deger="0" /> : v.cokme.satirlar.map((x, i) => (
            <Satir key={`${x.kaynak}-${x.surum}-${x.platform}-${i}`} etiket={`${x.platform} · ${x.surum} · ${x.kaynak === 'olumcul' ? 'ölümcül' : 'hata sınırı'}`} deger={String(x.adet)} alt={`${x.kisi} kişi`} />
          ))}
          <Not>{v.cokme.kapsam}</Not>
        </Bolum>

        <Bolum baslik="Dışlanan trafik (veri silinmez)">
          {v.dislanan_trafik.length === 0 ? <Satir etiket="Dışlanan yok" deger="0" /> : v.dislanan_trafik.map((d, i) => (
            <Satir key={`${d.trafik_sinifi}-${i}`} etiket={SINIF_ADI[d.trafik_sinifi ?? ''] || d.trafik_sinifi || 'Sınıflandırılmamış'} deger={String(d.kisi)} alt={d.sebep ?? undefined} />
          ))}
        </Bolum>

        <Bolum baslik="Denetim kütüğü">
          {v.denetim_kutugu.length === 0 ? <Satir etiket="Kayıt yok" deger={YOK} /> : v.denetim_kutugu.map((d, i) => (
            <Satir key={`${d.ts}-${i}`} etiket={d.eylem} deger={zaman(d.ts)} alt={[d.aktor, d.hedef, d.sebep, d.guven && `güven ${d.guven}`].filter(Boolean).join(' · ') || undefined} />
          ))}
        </Bolum>

        <Bolum baslik="Owner erişim kütüğü (7 gün)">
          {v.owner_erisim.ozet.map((x) => <Satir key={`${x.sonuc}-${x.saglayici}`} etiket={`${x.sonuc} · ${x.saglayici}`} deger={String(x.adet)} />)}
          {v.owner_erisim.son.slice(0, 10).map((x, i) => (
            <Satir key={`${x.ts}-${i}`} etiket={`${x.sonuc} · ${x.saglayici}`} deger={zaman(x.ts)} alt={[x.yol, x.sebep].filter(Boolean).join(' · ') || undefined} />
          ))}
          {v.owner_erisim.ozet.length === 0 ? <Satir etiket="Kayıt yok" deger={YOK} /> : null}
        </Bolum>

        <Bolum baslik="Veri sağlığı">
          <View style={styles.izgara}>
            <Kart baslik="Kurulum" deger={String(o.kurulum)} />
            <Kart baslik="Toplam olay" deger={String(o.olay)} />
            <Kart baslik="Bu cihazda kayıp olay" deger={String(kayipOlaySayisi())} alt="ağ / kuyruk taşması" />
          </View>
          <Not>Ölçüm: {new Date(v.olcum_ts * 1000).toLocaleString('tr-TR')}</Not>
        </Bolum>
      </>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      <View style={styles.ust}>
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Geri" style={styles.geri}>
          <Ionicons name="chevron-back" size={22} color={c.textHigh} />
        </Pressable>
        <Text style={[styles.ustBaslik, { color: c.textHigh }]}>Owner Control Center</Text>
        <View style={styles.geri} />
      </View>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={() => void yukle(filtre)} tintColor={c.neon} />}
      >
        <Filtreler />
        {yukleniyor ? (
          <View style={styles.orta}><ActivityIndicator color={c.neon} /></View>
        ) : hata ? (
          <View style={styles.orta}>
            <Ionicons name="alert-circle-outline" size={34} color={c.textLow} />
            <Text style={[styles.hata, { color: c.textHigh }]}>{hata}</Text>
            <Pressable
              onPress={() => { setYukleniyor(true); void yukle(filtre); }}
              style={({ pressed }) => [styles.btn, { backgroundColor: c.neon, opacity: pressed ? 0.85 : 1 }]}
            >
              <Text style={[styles.btnText, { color: c.textOnNeon }]}>Tekrar Dene</Text>
            </Pressable>
          </View>
        ) : veri ? govde(veri) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ust: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8 },
  geri: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  ustBaslik: { fontSize: 17, fontWeight: '800' },
  orta: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48, gap: 12 },
  hata: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  btn: { height: 44, paddingHorizontal: 22, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontWeight: '800', fontSize: 14 },
  cipSirasi: { gap: 8, paddingVertical: 4, alignItems: 'center' },
  cip: { minHeight: 32, paddingHorizontal: 12, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  cipYazi: { fontSize: 12.5, fontWeight: '600' },
  ayrac: { width: StyleSheet.hairlineWidth, height: 20, marginHorizontal: 4 },
  izgara: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  kart: { flexGrow: 1, minWidth: 105, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, padding: 12 },
  kartBaslik: { fontSize: 11, fontWeight: '700' },
  kartDeger: { fontSize: 22, fontWeight: '800', marginTop: 4, fontVariant: ['tabular-nums'] },
  kartAlt: { fontSize: 10.5, marginTop: 3 },
  bolumBaslik: { fontSize: 17, fontWeight: '800' },
  satir: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  satirAd: { fontSize: 13, fontWeight: '600' },
  satirAlt: { fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  satirDeger: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  cubukZemin: { width: 72, height: 6, borderRadius: 3, overflow: 'hidden' },
  cubuk: { height: 6, borderRadius: 3 },
  not: { fontSize: 11.5, lineHeight: 17, marginTop: 8 },
});
