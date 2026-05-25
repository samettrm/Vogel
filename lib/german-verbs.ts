// German verb conjugation. Regular (weak) verbs are generated; common
// irregular (strong/mixed) verbs come from a hand-checked table. Covers
// Präsens, Präteritum and Perfekt — see word-service for wiring.
import type { ConjugationTense, VerbConjugation } from '@/services/api/types';
import type { CuratedWord } from '@/lib/mock-data';

const PRONOUNS = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'];

function tense(nameTr: string, nameDe: string, forms: string[]): ConjugationTense {
  return { nameTr, nameDe, forms: forms.map((form, i) => ({ pronoun: PRONOUNS[i], form })) };
}

function build(regular: boolean, praesens: string[], praeteritum: string[], perfekt: string[]): VerbConjugation {
  return {
    regular,
    conjugations: [
      tense('Şimdiki Zaman', 'Präsens', praesens),
      tense('Geçmiş Zaman', 'Präteritum', praeteritum),
      tense('Birleşik Geçmiş', 'Perfekt', perfekt),
    ],
  };
}

function verbStem(infinitive: string): string {
  if (infinitive.endsWith('en')) return infinitive.slice(0, -2);
  if (infinitive.endsWith('n')) return infinitive.slice(0, -1);
  return infinitive;
}

// Stems ending in d/t (and consonant + m/n) take an epenthetic "e".
function needsE(stem: string): boolean {
  return /[dt]$/.test(stem) || /[^aeiouäöü][mn]$/.test(stem);
}

const NO_GE = /^(be|ge|er|ver|zer|ent|emp|miss)/;

function auxForms(aux: 'haben' | 'sein'): string[] {
  return aux === 'sein'
    ? ['bin', 'bist', 'ist', 'sind', 'seid', 'sind']
    : ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'];
}

// ─── Regular (weak) verb generator ───────────────────────────────────────────
function regularConjugation(infinitive: string): VerbConjugation {
  const inf = infinitive.toLowerCase();
  const stem = verbStem(inf);
  const e = needsE(stem) ? 'e' : '';
  const du = `${stem}${e}${/[sßxz]$/.test(stem) ? 't' : 'st'}`;
  const ihr = `${stem}${e}t`;

  const praesens = [`${stem}e`, du, `${stem}${e}t`, inf, ihr, inf];

  const pStem = `${stem}${e}te`;
  const praeteritum = [pStem, `${pStem}st`, pStem, `${pStem}n`, `${pStem}t`, `${pStem}n`];

  const partizip =
    NO_GE.test(inf) || inf.endsWith('ieren') ? `${stem}${e}t` : `ge${stem}${e}t`;
  const perfekt = auxForms('haben').map((a) => `${a} ${partizip}`);

  return build(true, praesens, praeteritum, perfekt);
}

// ─── Irregular (strong/mixed) verb builder ───────────────────────────────────
// `duEr` = the (vowel-changed) du/er stem, or null for no present change.
function irregular(
  infinitive: string,
  duEr: string | null,
  praet: string,
  partizip: string,
  aux: 'haben' | 'sein',
): VerbConjugation {
  const inf = infinitive.toLowerCase();
  const stem = verbStem(inf);
  const ihr = `${stem}${needsE(stem) ? 'e' : ''}t`;

  let du: string;
  let er: string;
  if (duEr) {
    du = `${duEr}${/[sßxz]$/.test(duEr) ? 't' : 'st'}`;
    er = /[td]$/.test(duEr) ? duEr : `${duEr}t`;
  } else {
    const e = needsE(stem) ? 'e' : '';
    du = `${stem}${e}${/[sßxz]$/.test(stem) ? 't' : 'st'}`;
    er = `${stem}${e}t`;
  }
  const praesens = [`${stem}e`, du, er, inf, ihr, inf];

  const pe = /[dt]$/.test(praet) ? 'e' : '';
  const praeteritum = [praet, `${praet}${pe}st`, praet, `${praet}en`, `${praet}${pe}t`, `${praet}en`];

  const perfekt = auxForms(aux).map((a) => `${a} ${partizip}`);
  return build(false, praesens, praeteritum, perfekt);
}

// Common irregular German verbs (hand-checked).
const IRREGULAR: Record<string, VerbConjugation> = {
  sein: build(
    false,
    ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
    ['war', 'warst', 'war', 'waren', 'wart', 'waren'],
    ['bin gewesen', 'bist gewesen', 'ist gewesen', 'sind gewesen', 'seid gewesen', 'sind gewesen'],
  ),
  haben: build(
    false,
    ['habe', 'hast', 'hat', 'haben', 'habt', 'haben'],
    ['hatte', 'hattest', 'hatte', 'hatten', 'hattet', 'hatten'],
    ['habe gehabt', 'hast gehabt', 'hat gehabt', 'haben gehabt', 'habt gehabt', 'haben gehabt'],
  ),
  werden: build(
    false,
    ['werde', 'wirst', 'wird', 'werden', 'werdet', 'werden'],
    ['wurde', 'wurdest', 'wurde', 'wurden', 'wurdet', 'wurden'],
    ['bin geworden', 'bist geworden', 'ist geworden', 'sind geworden', 'seid geworden', 'sind geworden'],
  ),
  wissen: build(
    false,
    ['weiß', 'weißt', 'weiß', 'wissen', 'wisst', 'wissen'],
    ['wusste', 'wusstest', 'wusste', 'wussten', 'wusstet', 'wussten'],
    ['habe gewusst', 'hast gewusst', 'hat gewusst', 'haben gewusst', 'habt gewusst', 'haben gewusst'],
  ),
  gehen: irregular('gehen', null, 'ging', 'gegangen', 'sein'),
  kommen: irregular('kommen', null, 'kam', 'gekommen', 'sein'),
  sehen: irregular('sehen', 'sieh', 'sah', 'gesehen', 'haben'),
  geben: irregular('geben', 'gib', 'gab', 'gegeben', 'haben'),
  nehmen: irregular('nehmen', 'nimm', 'nahm', 'genommen', 'haben'),
  finden: irregular('finden', null, 'fand', 'gefunden', 'haben'),
  stehen: irregular('stehen', null, 'stand', 'gestanden', 'haben'),
  sprechen: irregular('sprechen', 'sprich', 'sprach', 'gesprochen', 'haben'),
  lesen: irregular('lesen', 'lies', 'las', 'gelesen', 'haben'),
  schreiben: irregular('schreiben', null, 'schrieb', 'geschrieben', 'haben'),
  fahren: irregular('fahren', 'fähr', 'fuhr', 'gefahren', 'sein'),
  essen: irregular('essen', 'iss', 'aß', 'gegessen', 'haben'),
  trinken: irregular('trinken', null, 'trank', 'getrunken', 'haben'),
  schlafen: irregular('schlafen', 'schläf', 'schlief', 'geschlafen', 'haben'),
  laufen: irregular('laufen', 'läuf', 'lief', 'gelaufen', 'sein'),
  helfen: irregular('helfen', 'hilf', 'half', 'geholfen', 'haben'),
  treffen: irregular('treffen', 'triff', 'traf', 'getroffen', 'haben'),
  denken: irregular('denken', null, 'dachte', 'gedacht', 'haben'),
  bringen: irregular('bringen', null, 'brachte', 'gebracht', 'haben'),
  fliegen: irregular('fliegen', null, 'flog', 'geflogen', 'sein'),
  singen: irregular('singen', null, 'sang', 'gesungen', 'haben'),
  bleiben: irregular('bleiben', null, 'blieb', 'geblieben', 'sein'),
  heißen: irregular('heißen', null, 'hieß', 'geheißen', 'haben'),
  verstehen: irregular('verstehen', null, 'verstand', 'verstanden', 'haben'),
  vergessen: irregular('vergessen', 'vergiss', 'vergaß', 'vergessen', 'haben'),
  tragen: irregular('tragen', 'träg', 'trug', 'getragen', 'haben'),
  fallen: irregular('fallen', 'fäll', 'fiel', 'gefallen', 'sein'),
  lassen: irregular('lassen', 'läss', 'ließ', 'gelassen', 'haben'),
  halten: irregular('halten', 'hält', 'hielt', 'gehalten', 'haben'),
  gewinnen: irregular('gewinnen', null, 'gewann', 'gewonnen', 'haben'),
  beginnen: irregular('beginnen', null, 'begann', 'begonnen', 'haben'),
  schwimmen: irregular('schwimmen', null, 'schwamm', 'geschwommen', 'sein'),
  waschen: irregular('waschen', 'wäsch', 'wusch', 'gewaschen', 'haben'),
  schließen: irregular('schließen', null, 'schloss', 'geschlossen', 'haben'),
  verlieren: irregular('verlieren', null, 'verlor', 'verloren', 'haben'),
  ziehen: irregular('ziehen', null, 'zog', 'gezogen', 'haben'),
  rufen: irregular('rufen', null, 'rief', 'gerufen', 'haben'),
};

// Returns the conjugation for any German verb: table for known irregulars,
// generated weak conjugation otherwise.
export function getGermanConjugation(infinitive: string): VerbConjugation {
  const key = infinitive.toLowerCase().trim();
  return IRREGULAR[key] ?? regularConjugation(key);
}

// ─── German verb vocabulary — hand-checked Turkish meanings ───────────────────
// Translation APIs mangle common verbs ("haben" → "ediyorum"), so the everyday
// verbs are curated with correct Turkish meanings and example sentences.
function v(word: string, tr: string, en: string, exDe: string, exTr: string): CuratedWord {
  return {
    id: word,
    word,
    language: 'de',
    type: 'verb',
    shortDef: { tr, en },
    example: { text: exDe, translation: exTr },
  };
}

// Verb without a curated example — conjugation still provides per-tense examples.
function vn(word: string, tr: string, en: string): CuratedWord {
  return { id: word, word, language: 'de', type: 'verb', shortDef: { tr, en } };
}

export const GERMAN_VERBS: CuratedWord[] = [
  v('haben', 'sahip olmak; -si olmak', 'to have', 'Ich habe ein Auto.', 'Bir arabam var.'),
  v('sein', 'olmak (bir durumda olmak)', 'to be', 'Ich bin müde.', 'Yorgunum.'),
  v('werden', 'olmak, (bir hâle) gelmek', 'to become', 'Es wird kalt.', 'Hava soğuyor.'),
  v('machen', 'yapmak', 'to do, to make', 'Was machst du?', 'Ne yapıyorsun?'),
  v('sagen', 'söylemek', 'to say', 'Sag die Wahrheit.', 'Gerçeği söyle.'),
  v('kommen', 'gelmek', 'to come', 'Komm her!', 'Buraya gel!'),
  v('sehen', 'görmek', 'to see', 'Ich sehe dich.', 'Seni görüyorum.'),
  v('geben', 'vermek', 'to give', 'Gib mir das Buch.', 'Bana kitabı ver.'),
  v('nehmen', 'almak', 'to take', 'Ich nehme den Bus.', 'Otobüse biniyorum.'),
  v('finden', 'bulmak', 'to find', 'Ich finde meinen Schlüssel nicht.', 'Anahtarımı bulamıyorum.'),
  v('denken', 'düşünmek', 'to think', 'Ich denke an dich.', 'Seni düşünüyorum.'),
  v('wissen', 'bilmek', 'to know', 'Ich weiß es nicht.', 'Bilmiyorum.'),
  v('glauben', 'inanmak, sanmak', 'to believe', 'Ich glaube dir.', 'Sana inanıyorum.'),
  v('fragen', 'sormak', 'to ask', 'Darf ich etwas fragen?', 'Bir şey sorabilir miyim?'),
  v('antworten', 'cevap vermek', 'to answer', 'Bitte antworte mir.', 'Lütfen bana cevap ver.'),
  v('spielen', 'oynamak', 'to play', 'Die Kinder spielen im Park.', 'Çocuklar parkta oynuyor.'),
  v('kaufen', 'satın almak', 'to buy', 'Ich kaufe Brot.', 'Ekmek alıyorum.'),
  v('wohnen', 'oturmak, ikamet etmek', 'to live, to reside', 'Ich wohne in Berlin.', 'Berlin\'de oturuyorum.'),
  v('arbeiten', 'çalışmak', 'to work', 'Sie arbeitet im Büro.', 'O ofiste çalışıyor.'),
  v('lieben', 'sevmek', 'to love', 'Ich liebe dich.', 'Seni seviyorum.'),
  v('brauchen', 'ihtiyacı olmak', 'to need', 'Ich brauche Hilfe.', 'Yardıma ihtiyacım var.'),
  v('suchen', 'aramak', 'to search', 'Ich suche meine Brille.', 'Gözlüğümü arıyorum.'),
  v('hören', 'duymak, dinlemek', 'to hear, to listen', 'Ich höre Musik.', 'Müzik dinliyorum.'),
  v('kochen', 'yemek pişirmek', 'to cook', 'Meine Mutter kocht gern.', 'Annem yemek yapmayı sever.'),
  v('essen', 'yemek (yemek yemek)', 'to eat', 'Wir essen zu Mittag.', 'Öğle yemeği yiyoruz.'),
  v('trinken', 'içmek', 'to drink', 'Ich trinke Tee.', 'Çay içiyorum.'),
  v('fahren', 'sürmek, (araçla) gitmek', 'to drive, to go', 'Wir fahren nach Hause.', 'Eve gidiyoruz.'),
  v('laufen', 'koşmak, yürümek', 'to run, to walk', 'Er läuft schnell.', 'O hızlı koşar.'),
  v('fliegen', 'uçmak', 'to fly', 'Wir fliegen nach Istanbul.', 'İstanbul\'a uçuyoruz.'),
  v('schlafen', 'uyumak', 'to sleep', 'Das Baby schläft.', 'Bebek uyuyor.'),
  v('helfen', 'yardım etmek', 'to help', 'Kannst du mir helfen?', 'Bana yardım edebilir misin?'),
  v('bringen', 'getirmek', 'to bring', 'Bring mir Wasser.', 'Bana su getir.'),
  v('treffen', 'buluşmak, rastlamak', 'to meet', 'Wir treffen uns morgen.', 'Yarın buluşuyoruz.'),
  v('bleiben', 'kalmak', 'to stay', 'Ich bleibe zu Hause.', 'Evde kalıyorum.'),
  v('singen', 'şarkı söylemek', 'to sing', 'Sie singt schön.', 'O güzel şarkı söyler.'),
  v('tanzen', 'dans etmek', 'to dance', 'Wir tanzen gern.', 'Dans etmeyi severiz.'),
  v('öffnen', 'açmak', 'to open', 'Öffne die Tür.', 'Kapıyı aç.'),
  v('schließen', 'kapatmak', 'to close', 'Schließ das Fenster.', 'Pencereyi kapat.'),
  v('warten', 'beklemek', 'to wait', 'Ich warte auf dich.', 'Seni bekliyorum.'),
  v('leben', 'yaşamak', 'to live', 'Sie leben glücklich.', 'Mutlu yaşıyorlar.'),
  v('lachen', 'gülmek', 'to laugh', 'Die Kinder lachen.', 'Çocuklar gülüyor.'),
  v('heißen', 'adı … olmak; anlamına gelmek', 'to be called; to mean', 'Ich heiße Ali.', 'Adım Ali.'),
  v('tragen', 'taşımak; (giysi) giymek', 'to carry, to wear', 'Sie trägt eine Jacke.', 'Ceket giyiyor.'),
  v('fallen', 'düşmek', 'to fall', 'Der Apfel fällt vom Baum.', 'Elma ağaçtan düşüyor.'),
  v('halten', 'tutmak', 'to hold', 'Halt meine Hand.', 'Elimi tut.'),
  v('lassen', 'bırakmak; -dirtmek (yaptırmak)', 'to let, to leave; to have sth done', 'Lass mich in Ruhe.', 'Beni rahat bırak.'),
  v('gewinnen', 'kazanmak', 'to win', 'Wir gewinnen das Spiel.', 'Maçı kazanıyoruz.'),
  v('verlieren', 'kaybetmek', 'to lose', 'Ich verliere nie.', 'Asla kaybetmem.'),
  vn('zeigen', 'göstermek', 'to show'),
  vn('stellen', 'koymak, yerleştirmek', 'to put, to place'),
  vn('legen', 'koymak, yatırmak', 'to lay, to put'),
  vn('setzen', 'oturtmak, koymak', 'to set, to seat'),
  vn('holen', 'getirmek, alıp getirmek', 'to fetch'),
  vn('schicken', 'göndermek', 'to send'),
  vn('kosten', 'fiyatı olmak', 'to cost'),
  vn('dauern', 'sürmek', 'to last, to take (time)'),
  vn('besuchen', 'ziyaret etmek', 'to visit'),
  vn('benutzen', 'kullanmak', 'to use'),
  vn('wünschen', 'dilemek', 'to wish'),
  vn('hoffen', 'ummak', 'to hope'),
  vn('danken', 'teşekkür etmek', 'to thank'),
  vn('üben', 'alıştırma yapmak', 'to practise'),
  vn('feiern', 'kutlamak', 'to celebrate'),
  vn('erklären', 'açıklamak', 'to explain'),
  vn('erzählen', 'anlatmak', 'to tell'),
  vn('putzen', 'temizlemek', 'to clean'),
  vn('studieren', 'üniversitede okumak', 'to study'),
  vn('funktionieren', 'çalışmak, işlemek', 'to function'),
  vn('telefonieren', 'telefonla konuşmak', 'to call, to phone'),
  vn('fotografieren', 'fotoğraf çekmek', 'to photograph'),
  vn('reservieren', 'rezervasyon yapmak', 'to reserve'),
  vn('organisieren', 'düzenlemek, organize etmek', 'to organise'),
  vn('diskutieren', 'tartışmak', 'to discuss'),
  vn('informieren', 'bilgilendirmek', 'to inform'),
  vn('probieren', 'denemek, tatmak', 'to try, to taste'),
  v(
    'passieren',
    'olmak, meydana gelmek; başına gelmek',
    'to happen, to occur',
    'Was ist passiert?',
    'Ne oldu?',
  ),
];

