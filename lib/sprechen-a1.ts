// ─────────────────────────────────────────────────────────────────────────────
// Goethe & telc A1 Sprechen (Speaking) exam simulator — content pool.
//
// Three parts, matching the official A1 oral-exam format:
//   Teil 1: Sich vorstellen     — 7 personal-info categories + Buchstabieren
//                                  + Zahlen sagen (telephone / postal code).
//   Teil 2: Themen & Wort       — five everyday themes, three words each, with
//                                  a model question and a model A1 answer.
//   Teil 3: Bitten formulieren  — five picture cards; the candidate phrases a
//                                  polite request and the partner replies.
//
// Every line of German here is strictly A1 grade (Präsens, simple Akkusativ,
// no complex subordination). Turkish glosses are provided so the UI can show
// what the prompt means and explain mistakes in the learner's native tongue.
// ─────────────────────────────────────────────────────────────────────────────

export type SprechenPart = 'teil1' | 'teil2' | 'teil3';

export interface BilingualText {
  /** German text — shown to the learner and spoken aloud via TTS. */
  de: string;
  /** Turkish translation — shown as a subtitle / hint. */
  tr: string;
}

// ── Teil 1: Sich vorstellen ──────────────────────────────────────────────────
export interface SprechenTeil1Prompt {
  id: string;
  category:
    | 'name'
    | 'alter'
    | 'land'
    | 'wohnort'
    | 'sprachen'
    | 'beruf'
    | 'hobby'
    | 'buchstabieren'
    | 'zahlen'
    | 'familie';
  /** What the AI examiner asks. */
  question: BilingualText;
  /** Model A1 answer — used for hints and for grading the learner's reply. */
  modelAnswer: BilingualText;
  /** Keywords any acceptable answer should contain (lowercased). */
  acceptKeywords: string[];
  /** Optional tip shown after a wrong/empty answer. */
  hint?: BilingualText;
}

export const TEIL1_PROMPTS: SprechenTeil1Prompt[] = [
  {
    id: 'name',
    category: 'name',
    question: { de: 'Wie heißen Sie?', tr: 'Adınız nedir?' },
    modelAnswer: { de: 'Ich heiße …', tr: 'Adım …' },
    acceptKeywords: ['ich heiße', 'mein name'],
    hint: {
      de: 'Antworten Sie mit „Ich heiße …" oder „Mein Name ist …".',
      tr: '"Ich heiße …" veya "Mein Name ist …" ile başla.',
    },
  },
  {
    id: 'alter',
    category: 'alter',
    question: { de: 'Wie alt sind Sie?', tr: 'Kaç yaşındasınız?' },
    modelAnswer: { de: 'Ich bin … Jahre alt.', tr: '… yaşındayım.' },
    acceptKeywords: ['ich bin', 'jahre alt', 'jahre'],
    hint: {
      de: 'Sagen Sie „Ich bin (Zahl) Jahre alt.".',
      tr: '"Ich bin (sayı) Jahre alt." kalıbını kullan.',
    },
  },
  {
    id: 'land',
    category: 'land',
    question: { de: 'Woher kommen Sie?', tr: 'Nereden geliyorsunuz?' },
    modelAnswer: {
      de: 'Ich komme aus der Türkei.',
      tr: 'Türkiye’den geliyorum.',
    },
    acceptKeywords: ['ich komme aus', 'aus der', 'aus'],
    hint: {
      de: 'Antworten Sie mit „Ich komme aus …".',
      tr: '"Ich komme aus …" kalıbını kullan; ülke adından önce "der/die" gerekebilir.',
    },
  },
  {
    id: 'wohnort',
    category: 'wohnort',
    question: { de: 'Wo wohnen Sie?', tr: 'Nerede yaşıyorsunuz?' },
    modelAnswer: { de: 'Ich wohne in Istanbul.', tr: 'İstanbul’da yaşıyorum.' },
    acceptKeywords: ['ich wohne in', 'wohne'],
    hint: {
      de: 'Sagen Sie „Ich wohne in (Stadt).".',
      tr: '"Ich wohne in (şehir)." şeklinde söyle.',
    },
  },
  {
    id: 'sprachen',
    category: 'sprachen',
    question: {
      de: 'Welche Sprachen sprechen Sie?',
      tr: 'Hangi dilleri konuşuyorsunuz?',
    },
    modelAnswer: {
      de: 'Ich spreche Türkisch und ein bisschen Deutsch.',
      tr: 'Türkçe ve biraz Almanca konuşuyorum.',
    },
    acceptKeywords: ['ich spreche', 'türkisch', 'deutsch', 'englisch'],
    hint: {
      de: 'Beginnen Sie mit „Ich spreche …".',
      tr: '"Ich spreche …" ile başla, dilleri "und" ile bağla.',
    },
  },
  {
    id: 'beruf',
    category: 'beruf',
    question: { de: 'Was sind Sie von Beruf?', tr: 'Mesleğiniz ne?' },
    modelAnswer: {
      de: 'Ich bin Student. / Ich bin Lehrer.',
      tr: 'Öğrenciyim. / Öğretmenim.',
    },
    acceptKeywords: ['ich bin', 'student', 'lehrer', 'arzt', 'ingenieur'],
    hint: {
      de: 'Sagen Sie „Ich bin (Beruf).".',
      tr: '"Ich bin (meslek)." şeklinde söyle; artikel kullanma.',
    },
  },
  {
    id: 'hobby',
    category: 'hobby',
    question: { de: 'Was sind Ihre Hobbys?', tr: 'Hobileriniz neler?' },
    modelAnswer: {
      de: 'Ich spiele Fußball und höre Musik.',
      tr: 'Futbol oynarım ve müzik dinlerim.',
    },
    acceptKeywords: ['ich spiele', 'ich höre', 'ich lese', 'hobby'],
    hint: {
      de: 'Sagen Sie „Ich spiele …" oder „Ich höre gern Musik.".',
      tr: '"Ich spiele …" ya da "Ich höre gern …" ile başla.',
    },
  },
  {
    id: 'buchstabieren',
    category: 'buchstabieren',
    question: {
      de: 'Buchstabieren Sie bitte Ihren Familiennamen.',
      tr: 'Lütfen soyadınızı heceleyin.',
    },
    modelAnswer: {
      de: 'T - E - R - M - E',
      tr: 'Harfleri tek tek söyle: T - E - R - M - E',
    },
    acceptKeywords: ['-'],
    hint: {
      de: 'Sagen Sie die Buchstaben einzeln: „A, B, C …".',
      tr: 'Harfleri teker teker söyle: "Be – E – Er …". Tireler arasına boşluk koyarak yaz.',
    },
  },
  {
    id: 'zahlen',
    category: 'zahlen',
    question: { de: 'Wie ist Ihre Telefonnummer?', tr: 'Telefon numaranız nedir?' },
    modelAnswer: {
      de: 'Null fünf drei zwei …',
      tr: 'Rakamları teker teker söyle (null, eins, zwei …).',
    },
    acceptKeywords: ['null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun'],
    hint: {
      de: 'Sagen Sie jede Ziffer einzeln: „null, fünf, drei …".',
      tr: 'Her rakamı ayrı söyle: "null, fünf, drei …".',
    },
  },
  // ── More variety so repeat sessions feel fresh ─────────────────────────────
  {
    id: 'geburtstag',
    category: 'alter',
    question: { de: 'Wann haben Sie Geburtstag?', tr: 'Doğum gününüz ne zaman?' },
    modelAnswer: { de: 'Mein Geburtstag ist am fünfzehnten Mai.', tr: 'Doğum günüm 15 Mayıs.' },
    acceptKeywords: ['geburtstag', 'am', 'januar', 'februar', 'mai', 'juni', 'juli'],
    hint: {
      de: 'Form: „Mein Geburtstag ist am … (Tag + Monat)".',
      tr: 'Kalıp: "Mein Geburtstag ist am … (gün + ay)".',
    },
  },
  {
    id: 'familie-geschwister',
    category: 'familie',
    question: { de: 'Haben Sie Geschwister?', tr: 'Kardeşiniz var mı?' },
    modelAnswer: {
      de: 'Ja, ich habe einen Bruder und eine Schwester.',
      tr: 'Evet, bir erkek kardeşim ve bir kız kardeşim var.',
    },
    acceptKeywords: ['ich habe', 'bruder', 'schwester', 'geschwister', 'keine'],
    hint: {
      de: 'Sagen Sie „Ich habe …" + Bruder/Schwester/keine.',
      tr: '"Ich habe …" + erkek/kız kardeş ya da yok.',
    },
  },
  {
    id: 'hobby-frage',
    category: 'hobby',
    question: { de: 'Was machen Sie in Ihrer Freizeit?', tr: 'Boş zamanınızda ne yaparsınız?' },
    modelAnswer: {
      de: 'In meiner Freizeit lese ich Bücher und höre Musik.',
      tr: 'Boş zamanımda kitap okurum ve müzik dinlerim.',
    },
    acceptKeywords: ['freizeit', 'ich lese', 'spiele', 'höre', 'mache'],
    hint: {
      de: 'Beginnen Sie mit „In meiner Freizeit …".',
      tr: '"In meiner Freizeit …" ile başla.',
    },
  },
  {
    id: 'beruf-arbeit',
    category: 'beruf',
    question: { de: 'Wo arbeiten Sie?', tr: 'Nerede çalışıyorsunuz?' },
    modelAnswer: {
      de: 'Ich arbeite in einer Schule.',
      tr: 'Bir okulda çalışıyorum.',
    },
    acceptKeywords: ['ich arbeite', 'schule', 'firma', 'büro', 'studiere'],
    hint: {
      de: 'Sagen Sie „Ich arbeite in/bei …" (Ort + Dativ).',
      tr: '"Ich arbeite in/bei …" + iş yeri.',
    },
  },
  {
    id: 'sprachen-extra',
    category: 'sprachen',
    question: { de: 'Sprechen Sie Englisch?', tr: 'İngilizce konuşur musunuz?' },
    modelAnswer: {
      de: 'Ja, ich spreche ein bisschen Englisch.',
      tr: 'Evet, biraz İngilizce konuşurum.',
    },
    acceptKeywords: ['ja', 'nein', 'ich spreche', 'englisch'],
    hint: {
      de: 'Ja/Nein + „Ich spreche …" (varsa miktarı ekle: ein bisschen, gut).',
      tr: 'Ja/Nein + "Ich spreche …" (varsa miktar: ein bisschen, gut).',
    },
  },
  {
    id: 'land-herkunft',
    category: 'land',
    question: { de: 'Aus welchem Land kommen Sie?', tr: 'Hangi ülkeden geliyorsunuz?' },
    modelAnswer: { de: 'Ich komme aus der Türkei.', tr: 'Türkiye’den geliyorum.' },
    acceptKeywords: ['ich komme', 'aus', 'türkei'],
    hint: { de: 'Form: „Ich komme aus …".', tr: 'Kalıp: "Ich komme aus …".' },
  },
  {
    id: 'wohnort-extra',
    category: 'wohnort',
    question: { de: 'In welcher Stadt wohnen Sie?', tr: 'Hangi şehirde yaşıyorsunuz?' },
    modelAnswer: { de: 'Ich wohne in Istanbul.', tr: 'İstanbul’da yaşıyorum.' },
    acceptKeywords: ['ich wohne', 'in', 'stadt'],
    hint: { de: 'Form: „Ich wohne in (Stadt).".', tr: '"Ich wohne in …" (şehir).' },
  },
  {
    id: 'farbe-favorit',
    category: 'hobby',
    question: { de: 'Was ist Ihre Lieblingsfarbe?', tr: 'En sevdiğiniz renk ne?' },
    modelAnswer: { de: 'Meine Lieblingsfarbe ist blau.', tr: 'En sevdiğim renk mavi.' },
    acceptKeywords: ['lieblingsfarbe', 'blau', 'rot', 'grün', 'schwarz', 'weiß', 'gelb'],
    hint: {
      de: 'Form: „Meine Lieblingsfarbe ist …".',
      tr: '"Meine Lieblingsfarbe ist …" + renk.',
    },
  },
  {
    id: 'adresse',
    category: 'wohnort',
    question: { de: 'Wie ist Ihre Adresse?', tr: 'Adresiniz nedir?' },
    modelAnswer: {
      de: 'Meine Adresse ist Goethestraße 10.',
      tr: 'Adresim Goethestraße 10.',
    },
    acceptKeywords: ['meine adresse', 'straße', 'platz', 'weg'],
    hint: {
      de: 'Form: „Meine Adresse ist … (Straße + Nummer)".',
      tr: '"Meine Adresse ist …" + sokak + numara.',
    },
  },
];

// ── Teil 2: Themen & Wort ────────────────────────────────────────────────────
export interface SprechenTeil2Card {
  word: string;
  /** Turkish gloss for the word. */
  wordTr: string;
  /** Model question the candidate can ask using this word. */
  modelQuestion: BilingualText;
  /** Model answer the partner could give — used when the AI takes the asking turn. */
  modelAnswer: BilingualText;
  /** Keywords any acceptable user question should contain. */
  acceptKeywords: string[];
}

export interface SprechenTeil2Theme {
  id: string;
  theme: BilingualText;
  cards: SprechenTeil2Card[];
}

export const TEIL2_THEMES: SprechenTeil2Theme[] = [
  {
    id: 'essen-trinken',
    theme: { de: 'Essen und Trinken', tr: 'Yemek ve İçecek' },
    cards: [
      {
        word: 'Frühstück',
        wordTr: 'kahvaltı',
        modelQuestion: {
          de: 'Was isst du zum Frühstück?',
          tr: 'Kahvaltıda ne yersin?',
        },
        modelAnswer: {
          de: 'Ich esse Brot mit Käse und trinke Kaffee.',
          tr: 'Peynirli ekmek yerim ve kahve içerim.',
        },
        acceptKeywords: ['frühstück', 'isst', 'essen'],
      },
      {
        word: 'Bier',
        wordTr: 'bira',
        modelQuestion: { de: 'Trinkst du gern Bier?', tr: 'Bira içmeyi sever misin?' },
        modelAnswer: {
          de: 'Ja, am Wochenende trinke ich gern ein Bier.',
          tr: 'Evet, hafta sonu bir bira içmeyi severim.',
        },
        acceptKeywords: ['bier', 'trinkst', 'trinken'],
      },
      {
        word: 'Restaurant',
        wordTr: 'restoran',
        modelQuestion: {
          de: 'Gehst du oft ins Restaurant?',
          tr: 'Sık sık restorana gider misin?',
        },
        modelAnswer: {
          de: 'Nein, nicht oft. Vielleicht einmal pro Woche.',
          tr: 'Hayır, sık değil. Belki haftada bir.',
        },
        acceptKeywords: ['restaurant', 'gehst', 'gehen'],
      },
    ],
  },
  {
    id: 'wohnen',
    theme: { de: 'Wohnen', tr: 'Yaşam alanı / Ev' },
    cards: [
      {
        word: 'Wohnung',
        wordTr: 'daire',
        modelQuestion: {
          de: 'Wie groß ist deine Wohnung?',
          tr: 'Dairen ne kadar büyük?',
        },
        modelAnswer: {
          de: 'Meine Wohnung hat zwei Zimmer.',
          tr: 'Dairem iki odalı.',
        },
        acceptKeywords: ['wohnung', 'wie groß', 'wie viele'],
      },
      {
        word: 'Küche',
        wordTr: 'mutfak',
        modelQuestion: {
          de: 'Was kochst du in der Küche?',
          tr: 'Mutfakta ne pişirirsin?',
        },
        modelAnswer: {
          de: 'Ich koche oft Suppe und Nudeln.',
          tr: 'Çoğu zaman çorba ve makarna pişiririm.',
        },
        acceptKeywords: ['küche', 'kochst', 'kochen'],
      },
      {
        word: 'Garten',
        wordTr: 'bahçe',
        modelQuestion: { de: 'Hast du einen Garten?', tr: 'Bahçen var mı?' },
        modelAnswer: {
          de: 'Nein, ich habe nur einen Balkon.',
          tr: 'Hayır, sadece bir balkonum var.',
        },
        acceptKeywords: ['garten', 'hast du', 'haben'],
      },
    ],
  },
  {
    id: 'einkaufen',
    theme: { de: 'Einkaufen', tr: 'Alışveriş' },
    cards: [
      {
        word: 'Supermarkt',
        wordTr: 'süpermarket',
        modelQuestion: {
          de: 'Wo kaufst du Lebensmittel?',
          tr: 'Gıdaları nereden alırsın?',
        },
        modelAnswer: {
          de: 'Ich kaufe im Supermarkt ein.',
          tr: 'Süpermarketten alışveriş yaparım.',
        },
        acceptKeywords: ['supermarkt', 'kaufst', 'kaufen', 'wo'],
      },
      {
        word: 'Brot',
        wordTr: 'ekmek',
        modelQuestion: {
          de: 'Wie viel kostet das Brot?',
          tr: 'Ekmek ne kadar?',
        },
        modelAnswer: { de: 'Das Brot kostet zwei Euro.', tr: 'Ekmek iki Euro.' },
        acceptKeywords: ['brot', 'wie viel', 'kostet'],
      },
      {
        word: 'Geld',
        wordTr: 'para',
        modelQuestion: {
          de: 'Bezahlst du mit Karte oder mit Geld?',
          tr: 'Kartla mı yoksa nakit mi ödersin?',
        },
        modelAnswer: {
          de: 'Ich bezahle meistens mit Karte.',
          tr: 'Çoğunlukla kartla öderim.',
        },
        acceptKeywords: ['geld', 'karte', 'bezahlst', 'bezahlen'],
      },
    ],
  },
  {
    id: 'freizeit',
    theme: { de: 'Freizeit', tr: 'Boş zaman / Hobi' },
    cards: [
      {
        word: 'Wochenende',
        wordTr: 'hafta sonu',
        modelQuestion: {
          de: 'Was machst du am Wochenende?',
          tr: 'Hafta sonu ne yaparsın?',
        },
        modelAnswer: {
          de: 'Am Wochenende treffe ich Freunde.',
          tr: 'Hafta sonu arkadaşlarımla buluşurum.',
        },
        acceptKeywords: ['wochenende', 'machst', 'machen'],
      },
      {
        word: 'Sport',
        wordTr: 'spor',
        modelQuestion: {
          de: 'Welchen Sport machst du?',
          tr: 'Hangi sporu yaparsın?',
        },
        modelAnswer: { de: 'Ich spiele gern Fußball.', tr: 'Futbol oynamayı severim.' },
        acceptKeywords: ['sport', 'machst', 'spielst', 'fußball'],
      },
      {
        word: 'Musik',
        wordTr: 'müzik',
        modelQuestion: { de: 'Hörst du gern Musik?', tr: 'Müzik dinlemeyi sever misin?' },
        modelAnswer: { de: 'Ja, ich höre jeden Tag Musik.', tr: 'Evet, her gün müzik dinlerim.' },
        acceptKeywords: ['musik', 'hörst', 'hören'],
      },
      {
        word: 'Buch',
        wordTr: 'kitap',
        modelQuestion: { de: 'Liest du gern Bücher?', tr: 'Kitap okumayı sever misin?' },
        modelAnswer: {
          de: 'Ja, ich lese gern Bücher am Abend.',
          tr: 'Evet, akşamları kitap okumayı severim.',
        },
        acceptKeywords: ['buch', 'bücher', 'liest', 'lesen'],
      },
    ],
  },
  {
    id: 'familie',
    theme: { de: 'Familie', tr: 'Aile' },
    cards: [
      {
        word: 'Bruder',
        wordTr: 'erkek kardeş',
        modelQuestion: { de: 'Hast du Geschwister?', tr: 'Kardeşin var mı?' },
        modelAnswer: { de: 'Ja, ich habe einen Bruder.', tr: 'Evet, bir erkek kardeşim var.' },
        acceptKeywords: ['bruder', 'geschwister', 'hast du'],
      },
      {
        word: 'Eltern',
        wordTr: 'anne-baba',
        modelQuestion: { de: 'Wo wohnen deine Eltern?', tr: 'Annen-baban nerede yaşıyor?' },
        modelAnswer: { de: 'Meine Eltern wohnen in Ankara.', tr: 'Annem-babam Ankara’da yaşıyor.' },
        acceptKeywords: ['eltern', 'wohnen', 'wo'],
      },
      {
        word: 'Kinder',
        wordTr: 'çocuklar',
        modelQuestion: { de: 'Hast du Kinder?', tr: 'Çocuğun var mı?' },
        modelAnswer: { de: 'Nein, ich habe keine Kinder.', tr: 'Hayır, çocuğum yok.' },
        acceptKeywords: ['kinder', 'hast du'],
      },
    ],
  },
  // ── More themes so back-to-back sessions feel fresh ─────────────────────────
  {
    id: 'tagesablauf',
    theme: { de: 'Tagesablauf', tr: 'Günlük Rutin' },
    cards: [
      {
        word: 'aufstehen',
        wordTr: 'kalkmak',
        modelQuestion: { de: 'Wann stehst du auf?', tr: 'Kaçta kalkıyorsun?' },
        modelAnswer: { de: 'Ich stehe um sieben Uhr auf.', tr: 'Yediye doğru kalkarım.' },
        acceptKeywords: ['stehe auf', 'wann', 'uhr'],
      },
      {
        word: 'Frühstück',
        wordTr: 'kahvaltı',
        modelQuestion: {
          de: 'Was isst du zum Frühstück?',
          tr: 'Kahvaltıda ne yersin?',
        },
        modelAnswer: { de: 'Ich esse Brot und Käse.', tr: 'Ekmek ve peynir yerim.' },
        acceptKeywords: ['frühstück', 'isst', 'esse'],
      },
      {
        word: 'schlafen',
        wordTr: 'uyumak',
        modelQuestion: {
          de: 'Wann gehst du ins Bett?',
          tr: 'Kaçta yatağa gidiyorsun?',
        },
        modelAnswer: { de: 'Ich gehe um elf Uhr ins Bett.', tr: 'Saat onbirde yatağa giderim.' },
        acceptKeywords: ['ins bett', 'schlafen', 'gehe', 'uhr'],
      },
    ],
  },
  {
    id: 'wetter',
    theme: { de: 'Wetter', tr: 'Hava Durumu' },
    cards: [
      {
        word: 'Sonne',
        wordTr: 'güneş',
        modelQuestion: { de: 'Magst du Sonne?', tr: 'Güneşi sever misin?' },
        modelAnswer: { de: 'Ja, ich mag Sonne sehr gern.', tr: 'Evet, güneşi çok severim.' },
        acceptKeywords: ['sonne', 'magst', 'mag'],
      },
      {
        word: 'Regen',
        wordTr: 'yağmur',
        modelQuestion: { de: 'Regnet es oft in deiner Stadt?', tr: 'Şehrinde sık yağmur yağar mı?' },
        modelAnswer: { de: 'Ja, im Winter regnet es oft.', tr: 'Evet, kışın sık yağmur yağar.' },
        acceptKeywords: ['regen', 'regnet', 'oft'],
      },
      {
        word: 'kalt',
        wordTr: 'soğuk',
        modelQuestion: { de: 'Magst du kaltes Wetter?', tr: 'Soğuk havayı sever misin?' },
        modelAnswer: { de: 'Nein, ich mag warmes Wetter lieber.', tr: 'Hayır, sıcağı tercih ederim.' },
        acceptKeywords: ['kalt', 'warm', 'wetter', 'mag'],
      },
    ],
  },
  {
    id: 'reisen',
    theme: { de: 'Reisen', tr: 'Seyahat' },
    cards: [
      {
        word: 'Urlaub',
        wordTr: 'tatil',
        modelQuestion: { de: 'Wohin fährst du in den Urlaub?', tr: 'Tatile nereye gidersin?' },
        modelAnswer: {
          de: 'Ich fahre im Sommer ans Meer.',
          tr: 'Yazın denize giderim.',
        },
        acceptKeywords: ['urlaub', 'fahre', 'ans meer', 'sommer'],
      },
      {
        word: 'Strand',
        wordTr: 'plaj',
        modelQuestion: { de: 'Magst du den Strand?', tr: 'Plajı sever misin?' },
        modelAnswer: { de: 'Ja, ich gehe gern an den Strand.', tr: 'Evet, plaja gitmeyi severim.' },
        acceptKeywords: ['strand', 'gehe', 'gern'],
      },
      {
        word: 'Hotel',
        wordTr: 'otel',
        modelQuestion: { de: 'Wo schläfst du im Urlaub?', tr: 'Tatilde nerede uyursun?' },
        modelAnswer: { de: 'Im Urlaub schlafe ich im Hotel.', tr: 'Tatilde otelde kalırım.' },
        acceptKeywords: ['hotel', 'schlafe', 'pension'],
      },
    ],
  },
  {
    id: 'sprachkurs',
    theme: { de: 'Sprachkurs', tr: 'Dil Kursu' },
    cards: [
      {
        word: 'lernen',
        wordTr: 'öğrenmek',
        modelQuestion: { de: 'Warum lernst du Deutsch?', tr: 'Niçin Almanca öğreniyorsun?' },
        modelAnswer: {
          de: 'Ich lerne Deutsch für meine Arbeit.',
          tr: 'Almancayı işim için öğreniyorum.',
        },
        acceptKeywords: ['lerne', 'lernst', 'deutsch', 'warum'],
      },
      {
        word: 'Lehrer',
        wordTr: 'öğretmen',
        modelQuestion: { de: 'Wer ist dein Deutschlehrer?', tr: 'Almanca öğretmenin kim?' },
        modelAnswer: { de: 'Mein Deutschlehrer heißt Herr Schmidt.', tr: 'Almanca öğretmenim Bay Schmidt.' },
        acceptKeywords: ['lehrer', 'heißt', 'frau', 'herr'],
      },
      {
        word: 'Wörterbuch',
        wordTr: 'sözlük',
        modelQuestion: { de: 'Benutzt du ein Wörterbuch?', tr: 'Sözlük kullanır mısın?' },
        modelAnswer: {
          de: 'Ja, ich benutze oft mein Handy als Wörterbuch.',
          tr: 'Evet, çoğu zaman telefonumu sözlük olarak kullanırım.',
        },
        acceptKeywords: ['wörterbuch', 'benutze', 'handy', 'app'],
      },
    ],
  },
];

// ── Teil 3: Bitten formulieren (Picture cards) ───────────────────────────────
export interface SprechenTeil3Card {
  id: string;
  /** Emoji used as a lightweight visual placeholder until real artwork ships. */
  emoji: string;
  topic: BilingualText;
  /** Scenario context — shown as a location pill. */
  scene: BilingualText;
  /** Up to two model phrasings of the request. */
  modelRequests: BilingualText[];
  /** Model partner replies — first one is positive, second one negative. */
  modelReplies: BilingualText[];
  /** Keywords that signal a well-formed request. */
  acceptKeywords: string[];
}

export const TEIL3_CARDS: SprechenTeil3Card[] = [
  {
    id: 'wasser',
    emoji: '💧',
    scene: {
      de: 'Im Restaurant — bitten Sie den Kellner um Wasser.',
      tr: 'Restoranda garsondan iste.',
    },
    topic: { de: 'Wasser', tr: 'Su' },
    modelRequests: [
      {
        de: 'Können Sie mir bitte ein Glas Wasser geben?',
        tr: 'Bir bardak su rica ediyorum.',
      },
      { de: 'Ich hätte gern ein Wasser, bitte.', tr: 'Bir su alabilir miyim?' },
    ],
    modelReplies: [
      { de: 'Ja, sehr gerne. Hier ist es.', tr: 'Tabii ki, buyrun.' },
      { de: 'Es tut mir leid, das Wasser ist alle.', tr: 'Üzgünüm, su bitti.' },
    ],
    acceptKeywords: ['wasser', 'können sie', 'bitte', 'hätte gern'],
  },
  {
    id: 'fenster',
    emoji: '🪟',
    scene: {
      de: 'Im Bus — bitten Sie den Fahrgast neben Ihnen.',
      tr: 'Otobüste yanındaki yolcudan rica et.',
    },
    topic: { de: 'Fenster', tr: 'Pencere' },
    modelRequests: [
      { de: 'Können Sie bitte das Fenster öffnen?', tr: 'Pencereyi açar mısınız?' },
      {
        de: 'Machen Sie bitte das Fenster zu, mir ist kalt.',
        tr: 'Pencereyi kapatır mısınız, üşüdüm.',
      },
    ],
    modelReplies: [
      { de: 'Ja, kein Problem.', tr: 'Tabii, sorun değil.' },
      { de: 'Tut mir leid, mir ist zu warm.', tr: 'Üzgünüm, bana çok sıcak.' },
    ],
    acceptKeywords: ['fenster', 'öffnen', 'zumachen', 'bitte', 'können sie'],
  },
  {
    id: 'stift',
    emoji: '🖊️',
    scene: {
      de: 'Im Unterricht — bitten Sie Ihren Mitschüler um einen Stift.',
      tr: 'Sınıfta arkadaşından iste.',
    },
    topic: { de: 'Kugelschreiber', tr: 'Kalem' },
    modelRequests: [
      {
        de: 'Können Sie mir bitte einen Stift geben?',
        tr: 'Bana bir kalem verir misiniz?',
      },
      {
        de: 'Haben Sie einen Kugelschreiber für mich?',
        tr: 'Bana verebileceğiniz bir tükenmez kalem var mı?',
      },
    ],
    modelReplies: [
      { de: 'Ja, hier bitte.', tr: 'Evet, buyrun.' },
      { de: 'Nein, ich habe leider keinen.', tr: 'Hayır, maalesef yok.' },
    ],
    acceptKeywords: ['stift', 'kugelschreiber', 'bitte', 'haben sie', 'können sie'],
  },
  {
    id: 'uhrzeit',
    emoji: '🕐',
    scene: {
      de: 'Auf der Straße — fragen Sie jemanden nach der Uhrzeit.',
      tr: 'Yoldan geçen birinden saati öğrenmek istiyorsun.',
    },
    topic: { de: 'Uhrzeit', tr: 'Saat' },
    modelRequests: [
      {
        de: 'Können Sie mir bitte die Uhrzeit sagen?',
        tr: 'Saati söyler misiniz lütfen?',
      },
      { de: 'Wie spät ist es, bitte?', tr: 'Saat kaç, lütfen?' },
    ],
    modelReplies: [
      { de: 'Es ist halb drei.', tr: 'Saat üç buçuk değil — yarım üç (02:30).' },
      { de: 'Es ist zehn nach zwei.', tr: 'İkiyi on geçiyor.' },
    ],
    acceptKeywords: ['uhrzeit', 'wie spät', 'uhr', 'bitte'],
  },
  {
    id: 'salz',
    emoji: '🧂',
    scene: {
      de: 'Beim Abendessen — bitten Sie am Nachbartisch um das Salz.',
      tr: 'Akşam yemeğinde yan masadan iste.',
    },
    topic: { de: 'Salz', tr: 'Tuz' },
    modelRequests: [
      { de: 'Können Sie mir bitte das Salz geben?', tr: 'Tuzu uzatır mısınız?' },
      { de: 'Reichen Sie mir bitte das Salz.', tr: 'Lütfen tuzu uzatın.' },
    ],
    modelReplies: [
      { de: 'Hier, bitte.', tr: 'Buyrun.' },
      { de: 'Ja, gerne.', tr: 'Tabii, memnuniyetle.' },
    ],
    acceptKeywords: ['salz', 'bitte', 'können sie', 'reichen'],
  },
  {
    // Goethe's most classic A1 Bildkarte: a "no smoking" sign asking the
    // candidate to politely tell someone to stop or to confirm the rule.
    id: 'rauchen-verboten',
    emoji: '🚭',
    scene: {
      de: 'Im Café — weisen Sie den Raucher höflich darauf hin.',
      tr: 'Kafede sigara içen birini kibarca uyar.',
    },
    topic: { de: 'Rauchen verboten', tr: 'Sigara içmek yasak' },
    modelRequests: [
      {
        de: 'Bitte rauchen Sie hier nicht.',
        tr: 'Lütfen burada sigara içmeyin.',
      },
      {
        de: 'Können Sie bitte draußen rauchen?',
        tr: 'Dışarıda içer misiniz lütfen?',
      },
    ],
    modelReplies: [
      { de: 'Oh, das tut mir leid. Ich gehe nach draußen.', tr: 'Pardon, dışarı çıkıyorum.' },
      { de: 'Entschuldigung, ich wusste das nicht.', tr: 'Üzgünüm, bilmiyordum.' },
    ],
    acceptKeywords: ['rauchen', 'nicht', 'bitte', 'draußen', 'verboten'],
  },
  // ── More Bildkarten so re-runs don't repeat ──────────────────────────────
  {
    id: 'brot',
    emoji: '🍞',
    scene: {
      de: 'Beim Familienessen — bitten Sie jemanden, das Brot zu reichen.',
      tr: 'Aile yemeğinde uzatılmasını iste.',
    },
    topic: { de: 'Brot', tr: 'Ekmek' },
    modelRequests: [
      { de: 'Können Sie mir bitte das Brot geben?', tr: 'Ekmeği uzatır mısınız?' },
      { de: 'Ich hätte gern ein Stück Brot, bitte.', tr: 'Bir parça ekmek alabilir miyim?' },
    ],
    modelReplies: [
      { de: 'Ja, hier ist es. Bitte schön.', tr: 'Tabii, buyrun.' },
      { de: 'Tut mir leid, das Brot ist alle.', tr: 'Üzgünüm, ekmek bitti.' },
    ],
    acceptKeywords: ['brot', 'bitte', 'können sie', 'hätte gern'],
  },
  {
    id: 'telefon',
    emoji: '📱',
    scene: {
      de: 'Akku ist leer — bitten Sie jemanden, Ihr Handy kurz zu leihen.',
      tr: 'Şarjı bitmiş, birinden ödünç iste.',
    },
    topic: { de: 'Telefon', tr: 'Telefon' },
    modelRequests: [
      {
        de: 'Können Sie mir bitte Ihr Telefon leihen?',
        tr: 'Telefonunuzu ödünç alabilir miyim?',
      },
      {
        de: 'Darf ich kurz Ihr Handy benutzen?',
        tr: 'Telefonunuzu kısa süre kullanabilir miyim?',
      },
    ],
    modelReplies: [
      { de: 'Ja, natürlich. Hier bitte.', tr: 'Tabii, buyrun.' },
      { de: 'Tut mir leid, mein Akku ist leer.', tr: 'Üzgünüm, pilim bitti.' },
    ],
    acceptKeywords: ['telefon', 'handy', 'leihen', 'benutzen', 'bitte'],
  },
  {
    id: 'stuhl',
    emoji: '🪑',
    scene: {
      de: 'Im Café — Sie suchen einen freien Stuhl.',
      tr: 'Kafede oturacak yer ararken iste.',
    },
    topic: { de: 'Stuhl', tr: 'Sandalye' },
    modelRequests: [
      { de: 'Können Sie mir bitte einen Stuhl bringen?', tr: 'Bir sandalye getirir misiniz?' },
      { de: 'Ist dieser Stuhl frei?', tr: 'Bu sandalye boş mu?' },
    ],
    modelReplies: [
      { de: 'Ja, einen Moment bitte.', tr: 'Tabii, bir saniye.' },
      { de: 'Ja, der ist frei. Setzen Sie sich.', tr: 'Evet, boş. Oturun.' },
    ],
    acceptKeywords: ['stuhl', 'bringen', 'frei', 'bitte'],
  },
  {
    id: 'kaffee',
    emoji: '☕',
    scene: {
      de: 'Im Café — bestellen Sie beim Kellner einen Kaffee.',
      tr: 'Kafede garsondan sipariş ver.',
    },
    topic: { de: 'Tasse Kaffee', tr: 'Bir fincan kahve' },
    modelRequests: [
      { de: 'Ich hätte gern einen Kaffee, bitte.', tr: 'Bir kahve alabilir miyim lütfen?' },
      { de: 'Können Sie mir einen Kaffee bringen?', tr: 'Bana kahve getirir misiniz?' },
    ],
    modelReplies: [
      { de: 'Gern. Mit Milch und Zucker?', tr: 'Tabii. Sütlü şekerli mi?' },
      { de: 'Sofort, einen Moment bitte.', tr: 'Hemen, bir saniye.' },
    ],
    acceptKeywords: ['kaffee', 'bitte', 'hätte gern', 'bringen'],
  },
  {
    id: 'tuer',
    emoji: '🚪',
    scene: {
      de: 'Zugluft im Zimmer — bitten Sie jemanden, die Tür zu schließen.',
      tr: 'Esinti olan odada birinden rica et.',
    },
    topic: { de: 'Tür', tr: 'Kapı' },
    modelRequests: [
      { de: 'Können Sie bitte die Tür schließen?', tr: 'Kapıyı kapatır mısınız?' },
      { de: 'Machen Sie bitte die Tür auf.', tr: 'Lütfen kapıyı açın.' },
    ],
    modelReplies: [
      { de: 'Ja, gern.', tr: 'Tabii, memnuniyetle.' },
      { de: 'Ja, kein Problem.', tr: 'Olur, sorun değil.' },
    ],
    acceptKeywords: ['tür', 'schließen', 'aufmachen', 'bitte', 'können sie'],
  },
  {
    id: 'schluessel',
    emoji: '🔑',
    scene: {
      de: 'An der Hotelrezeption — fragen Sie nach dem Schlüssel für Ihr Zimmer.',
      tr: 'Otel resepsiyonunda odanın anahtarını iste.',
    },
    topic: { de: 'Schlüssel', tr: 'Anahtar' },
    modelRequests: [
      {
        de: 'Können Sie mir bitte den Schlüssel geben?',
        tr: 'Anahtarı verir misiniz?',
      },
      {
        de: 'Ich brauche bitte den Schlüssel für Zimmer zehn.',
        tr: 'Lütfen 10 numaralı odanın anahtarını istiyorum.',
      },
    ],
    modelReplies: [
      { de: 'Natürlich, hier ist er.', tr: 'Tabii, buyrun.' },
      { de: 'Einen Moment, ich suche ihn.', tr: 'Bir dakika, bakayım.' },
    ],
    acceptKeywords: ['schlüssel', 'bitte', 'können sie', 'zimmer'],
  },
];

// ─── Grading helpers — deterministic, offline, no LLM required. ───────────────
// "Pretty good" if the learner's text contains at least one accept-keyword
// AND looks like a real sentence (>= 2 words). Strict enough to catch empty
// "ok" replies, loose enough to accept anything that's basically on-topic.
function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?¡¿"'„“”«»()—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface GradingResult {
  /** True when the response matches at least one accept-keyword. */
  ok: boolean;
  /** Which keywords (if any) matched — useful for showing positive feedback. */
  matched: string[];
  /** Word count of the cleaned response. */
  words: number;
}

export function gradeResponse(input: string, accept: string[]): GradingResult {
  const text = normalise(input);
  const words = text.length === 0 ? 0 : text.split(' ').length;
  const matched = accept
    .map((k) => normalise(k))
    .filter((k) => k.length > 0 && text.includes(k));
  return { ok: matched.length > 0 && words >= 2, matched, words };
}

// ─── Quick-draw helpers used by the screen ───────────────────────────────────
export function pickN<T>(arr: readonly T[], n: number): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

// Default simulator setup — feel free to tweak per session.
// We deliberately pick a *subset* from a larger pool so repeat sessions feel
// fresh: every run shuffles 5 of 18 Teil 1 prompts, 3 of 9 themes (each with
// 2 of 3-4 cards), and 5 of 12 Bildkarten — combinatorially huge variety.
export const DEFAULT_TEIL1_COUNT = 5; // five intro prompts per session
export const DEFAULT_TEIL2_THEME_COUNT = 3; // three themes per session
export const DEFAULT_TEIL2_CARDS_PER_THEME = 2; // two words per theme
export const DEFAULT_TEIL3_CARD_COUNT = 5; // five picture cards per session
