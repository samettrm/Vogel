// ════════════════════════════════════════════════════════════════
// Ülke kodu → Türkçe ad + bayrak
//
// Neden elle liste: Intl.DisplayNames Hermes'te güvenilir değil (bazı
// sürümlerde hiç yok), o yüzden gösterim koda düşerdi. Liste, Vogel'in
// gerçek kullanıcı dağılımını kapsayacak şekilde tutuldu; eksik kod
// gelirse kodun kendisi gösterilir, çökmez.
// ════════════════════════════════════════════════════════════════

const NAMES: Record<string, string> = {
  TR: 'Türkiye', DE: 'Almanya', AT: 'Avusturya', CH: 'İsviçre', NL: 'Hollanda',
  BE: 'Belçika', FR: 'Fransa', GB: 'Birleşik Krallık', IE: 'İrlanda', US: 'Amerika Birleşik Devletleri',
  CA: 'Kanada', AZ: 'Azerbaycan', RU: 'Rusya', UA: 'Ukrayna', DZ: 'Cezayir',
  MA: 'Fas', TN: 'Tunus', EG: 'Mısır', SA: 'Suudi Arabistan', AE: 'Birleşik Arap Emirlikleri',
  QA: 'Katar', KW: 'Kuveyt', IQ: 'Irak', IR: 'İran', JO: 'Ürdün',
  SY: 'Suriye', LB: 'Lübnan', IL: 'İsrail', PK: 'Pakistan', IN: 'Hindistan',
  BD: 'Bangladeş', ID: 'Endonezya', MY: 'Malezya', PH: 'Filipinler', TH: 'Tayland',
  VN: 'Vietnam', CN: 'Çin', JP: 'Japonya', KR: 'Güney Kore', AU: 'Avustralya',
  NZ: 'Yeni Zelanda', IT: 'İtalya', ES: 'İspanya', PT: 'Portekiz', GR: 'Yunanistan',
  BG: 'Bulgaristan', RO: 'Romanya', RS: 'Sırbistan', HR: 'Hırvatistan', BA: 'Bosna-Hersek',
  MK: 'Kuzey Makedonya', AL: 'Arnavutluk', XK: 'Kosova', ME: 'Karadağ', SI: 'Slovenya',
  HU: 'Macaristan', CZ: 'Çekya', SK: 'Slovakya', PL: 'Polonya', SE: 'İsveç',
  NO: 'Norveç', DK: 'Danimarka', FI: 'Finlandiya', EE: 'Estonya', LV: 'Letonya',
  LT: 'Litvanya', BY: 'Belarus', GE: 'Gürcistan', AM: 'Ermenistan', KZ: 'Kazakistan',
  UZ: 'Özbekistan', KG: 'Kırgızistan', TM: 'Türkmenistan', TJ: 'Tacikistan', MD: 'Moldova',
  CY: 'Kıbrıs', MT: 'Malta', LU: 'Lüksemburg', IS: 'İzlanda', BR: 'Brezilya',
  AR: 'Arjantin', MX: 'Meksika', CL: 'Şili', CO: 'Kolombiya', PE: 'Peru',
  ZA: 'Güney Afrika', NG: 'Nijerya', KE: 'Kenya', ET: 'Etiyopya', GH: 'Gana',
  LY: 'Libya', SD: 'Sudan', SO: 'Somali', AF: 'Afganistan', NP: 'Nepal',
  LK: 'Sri Lanka', MM: 'Myanmar', SG: 'Singapur', HK: 'Hong Kong', TW: 'Tayvan',
};

/** "TR" → "Türkiye". Bilinmeyen kodda kodun kendisi döner. */
export function countryName(code: string): string {
  if (!code || code === '??') return 'Bilinmiyor';
  return NAMES[code.toUpperCase()] ?? code.toUpperCase();
}

/** "TR" → "🇹🇷". Geçersiz kodda boş string. */
export function countryFlag(code: string): string {
  const c = (code ?? '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) return '🏳️';
  return String.fromCodePoint(...c.split('').map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}
