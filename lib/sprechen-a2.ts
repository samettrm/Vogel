// ─────────────────────────────────────────────────────────────────────────────
// Goethe & telc A2 Sprechen (Speaking) exam simulator — content pool.
//
// Three parts, matching the official A2 oral-exam format:
//   Teil 1: Kennenlernen     — paired Q&A on personal life. A2 answers are
//                              richer than A1 (Perfekt, weil/wenn clauses).
//   Teil 2: Von sich erzählen — candidate gets an Aufgabenblatt (title +
//                              3-4 Leitfragen), delivers a 1-2 min monologue,
//                              jury then asks one follow-up question.
//   Teil 3: Gemeinsam planen  — two candidates plan something together
//                              (gift, cinema, trip), negotiating a Termin.
//                              Calendar overlap → propose → reject → accept.
//
// Every German line stays inside the A2 grammar envelope: Präsens + Perfekt,
// modal verbs, weil/wenn/dass subordinates, Komparativ. No Konjunktiv II,
// no passive, no relative clauses with whom.
// ─────────────────────────────────────────────────────────────────────────────

import type { BilingualText } from '@/lib/sprechen-a1';

export type SprechenA2Part = 'teil1' | 'teil2' | 'teil3';

// ── Teil 1: Kennenlernen (Q&A on personal life, deeper than A1) ──────────────
export interface SprechenA2Teil1Prompt {
  id: string;
  /** Topic the card shows (Wohnort, Beruf, …). */
  category: string;
  /** Question the partner asks. */
  question: BilingualText;
  /** Model A2 answer — uses Perfekt + weil/wenn where natural. */
  modelAnswer: BilingualText;
  /** Keywords any acceptable reply should mention. */
  acceptKeywords: string[];
  /** Optional Turkish tip surfaced after a wrong reply. */
  hint?: BilingualText;
}

export const TEIL1_PROMPTS_A2: SprechenA2Teil1Prompt[] = [
  {
    id: 'wohnort',
    category: 'wohnort',
    question: { de: 'Wo wohnen Sie und wie lange schon dort?', tr: 'Nerede ve ne kadardır orada yaşıyorsunuz?' },
    modelAnswer: {
      de: 'Ich wohne in Istanbul und ich bin dort geboren. Ich wohne seit fünfundzwanzig Jahren hier.',
      tr: 'İstanbul\'da yaşıyorum, orada doğdum. Yirmi beş yıldır burada yaşıyorum.',
    },
    acceptKeywords: ['ich wohne', 'seit', 'geboren', 'jahre'],
    hint: {
      de: 'Sagen Sie „Ich wohne in …" und „seit … Jahren".',
      tr: 'Hem şehri hem süreyi söyle: "Ich wohne in … seit … Jahren".',
    },
  },
  {
    id: 'beruf',
    category: 'beruf',
    question: { de: 'Was sind Sie von Beruf? Wie sieht Ihr Arbeitstag aus?', tr: 'Mesleğiniz ne? İş gününüz nasıl geçiyor?' },
    modelAnswer: {
      de: 'Ich bin Lehrer von Beruf. Mein Tag beginnt um sieben Uhr, weil meine erste Stunde um acht ist. Am Nachmittag korrigiere ich Hefte.',
      tr: 'Mesleğim öğretmenlik. Günüm yedide başlar çünkü ilk dersim sekizde. Öğleden sonra defter okurum.',
    },
    acceptKeywords: ['ich bin', 'mein tag', 'arbeite', 'weil', 'beruf'],
    hint: {
      de: 'Nennen Sie den Beruf und eine konkrete Aufgabe — z.B. „Ich arbeite … weil …".',
      tr: 'Mesleği + somut bir iş anı söyle. Cümleye "weil" katarsan A2 bonusu.',
    },
  },
  {
    id: 'familie',
    category: 'familie',
    question: { de: 'Erzählen Sie etwas über Ihre Familie.', tr: 'Ailenizden biraz bahsedin.' },
    modelAnswer: {
      de: 'Meine Familie ist nicht groß. Ich habe eine Schwester und einen Bruder. Meine Eltern wohnen in Ankara, aber ich besuche sie oft.',
      tr: 'Ailem büyük değil. Bir kız ve bir erkek kardeşim var. Annem-babam Ankara\'da yaşıyor ama onları sık ziyaret ediyorum.',
    },
    acceptKeywords: ['familie', 'eltern', 'bruder', 'schwester', 'kinder', 'wohnen'],
    hint: {
      de: 'Sagen Sie 2-3 Sätze: Größe, Personen, was sie machen.',
      tr: '2-3 cümle: kim, kaç kişi, nerede yaşıyorlar.',
    },
  },
  {
    id: 'sprachen',
    category: 'sprachen',
    question: { de: 'Welche Sprachen sprechen Sie und wo haben Sie sie gelernt?', tr: 'Hangi dilleri konuşuyorsunuz ve nerede öğrendiniz?' },
    modelAnswer: {
      de: 'Ich spreche Türkisch und ein bisschen Deutsch. Englisch habe ich in der Schule gelernt. Deutsch lerne ich gerade in einem Sprachkurs.',
      tr: 'Türkçe ve biraz Almanca konuşuyorum. İngilizceyi okulda öğrendim. Almancayı şu anda bir dil kursunda öğreniyorum.',
    },
    acceptKeywords: ['ich spreche', 'ich lerne', 'gelernt', 'türkisch', 'deutsch', 'englisch'],
    hint: {
      de: 'Erwähnen Sie auch, wo / wie Sie sie gelernt haben (Perfekt!).',
      tr: 'Sadece dilleri değil, nerede öğrendiğini de söyle. Perfekt kullan: "Ich habe … gelernt".',
    },
  },
  {
    id: 'hobbys',
    category: 'hobbys',
    question: { de: 'Was machen Sie in Ihrer Freizeit?', tr: 'Boş zamanınızda ne yaparsınız?' },
    modelAnswer: {
      de: 'In meiner Freizeit lese ich gern Bücher und spiele Fußball. Am Wochenende treffe ich auch meine Freunde, weil wir gern zusammen ins Café gehen.',
      tr: 'Boş zamanımda kitap okumayı ve futbol oynamayı severim. Hafta sonu arkadaşlarımla da buluşurum, çünkü beraber kafeye gitmeyi seviyoruz.',
    },
    acceptKeywords: ['freizeit', 'ich lese', 'spiele', 'höre', 'treffe', 'gern'],
    hint: {
      de: 'Nennen Sie zwei Hobbys und sagen Sie „weil" oder „wenn".',
      tr: 'İki hobi say ve "weil/wenn" ile bir gerekçe ekle.',
    },
  },
  {
    id: 'reisen',
    category: 'reisen',
    question: { de: 'Reisen Sie gern? Wohin sind Sie schon gefahren?', tr: 'Seyahat etmeyi sever misiniz? Şimdiye kadar nereye gittiniz?' },
    modelAnswer: {
      de: 'Ja, ich reise sehr gern. Letzten Sommer bin ich nach Italien gefahren und ich habe die Stadt Rom besucht. Es war sehr schön.',
      tr: 'Evet, seyahat etmeyi çok severim. Geçen yaz İtalya\'ya gittim ve Roma şehrini gezdim. Çok güzeldi.',
    },
    acceptKeywords: ['reise', 'gefahren', 'besucht', 'war', 'gemacht', 'sommer'],
    hint: {
      de: 'Antwort braucht Perfekt: „Ich bin … gefahren / habe … besucht".',
      tr: 'Geçmişe dair konuş, Perfekt kullan: "Ich bin … gefahren".',
    },
  },
  {
    id: 'essen',
    category: 'essen',
    question: { de: 'Was essen Sie gern? Können Sie kochen?', tr: 'Ne yemeyi seversin? Yemek yapabiliyor musun?' },
    modelAnswer: {
      de: 'Ich esse sehr gern türkisches Essen, besonders Köfte und Lahmacun. Ja, ich kann ein bisschen kochen, aber meine Mutter kocht besser.',
      tr: 'Türk yemeklerini çok severim, özellikle köfte ve lahmacun. Evet, biraz yemek yapabiliyorum ama annem daha iyi yapıyor.',
    },
    acceptKeywords: ['ich esse', 'gern', 'kann', 'koche', 'essen'],
    hint: {
      de: 'Erst was Sie essen, dann ob Sie kochen können.',
      tr: 'Önce ne yediğini, sonra yemek yapıp yapamadığını söyle.',
    },
  },
  {
    id: 'sport',
    category: 'sport',
    question: { de: 'Machen Sie Sport? Welche Sportart und wie oft?', tr: 'Spor yapar mısınız? Hangi spor, ne sıklıkta?' },
    modelAnswer: {
      de: 'Ja, ich spiele zweimal pro Woche Fußball mit meinen Freunden. Im Sommer schwimme ich auch oft, weil das gut für meinen Rücken ist.',
      tr: 'Evet, haftada iki kez arkadaşlarımla futbol oynarım. Yaz aylarında yüzerim de, çünkü sırtım için iyi geliyor.',
    },
    acceptKeywords: ['sport', 'spiele', 'mache', 'pro woche', 'oft'],
    hint: {
      de: 'Geben Sie die Häufigkeit: „einmal pro Woche", „jeden Tag" …',
      tr: 'Sıklığı ekle: "haftada bir / her gün / bazen".',
    },
  },
  {
    id: 'tagesablauf',
    category: 'tagesablauf',
    question: { de: 'Wie sieht Ihr Tag normalerweise aus?', tr: 'Normal bir gününüz nasıl geçer?' },
    modelAnswer: {
      de: 'Ich stehe um sieben Uhr auf, frühstücke und gehe dann zur Arbeit. Am Nachmittag mache ich Sport. Abends sehe ich oft einen Film mit meiner Familie.',
      tr: 'Yediye doğru kalkarım, kahvaltı edip işe giderim. Öğleden sonra spor yaparım. Akşamları çoğu zaman ailemle film izlerim.',
    },
    acceptKeywords: ['stehe auf', 'frühstücke', 'gehe', 'mache', 'sehe', 'uhr'],
    hint: {
      de: 'Folgen Sie der Tageschronologie (morgens → mittags → abends).',
      tr: 'Günü sırasıyla anlat: sabah → öğle → akşam.',
    },
  },
  // ── More A2 variety so repeats feel fresh ───────────────────────────────────
  {
    id: 'wochenende',
    category: 'hobbys',
    question: { de: 'Was haben Sie letztes Wochenende gemacht?', tr: 'Geçen hafta sonu ne yaptınız?' },
    modelAnswer: {
      de: 'Letztes Wochenende habe ich Freunde getroffen und wir sind ins Kino gegangen. Es war sehr schön.',
      tr: 'Geçen hafta sonu arkadaşlarımla buluştum ve sinemaya gittik. Çok güzeldi.',
    },
    acceptKeywords: ['letztes wochenende', 'getroffen', 'gegangen', 'gemacht', 'war'],
    hint: {
      de: 'Perfekt benutzen: „Ich habe / Ich bin … gemacht/gegangen".',
      tr: 'Perfekt: "Ich habe …" veya "Ich bin … gegangen".',
    },
  },
  {
    id: 'musik',
    category: 'hobbys',
    question: { de: 'Welche Musik hören Sie gern?', tr: 'Ne tür müzik dinlemeyi seversiniz?' },
    modelAnswer: {
      de: 'Ich höre gern Popmusik, weil sie fröhlich ist. Manchmal höre ich auch türkische Musik.',
      tr: 'Pop müzik dinlemeyi severim, neşeli olduğu için. Bazen Türkçe müzik de dinlerim.',
    },
    acceptKeywords: ['höre', 'gern', 'musik', 'weil'],
    hint: {
      de: 'Geben Sie einen Grund mit „weil".',
      tr: 'Nedenini "weil" ile ekle.',
    },
  },
  {
    id: 'urlaub',
    category: 'reisen',
    question: { de: 'Wo waren Sie letzten Sommer im Urlaub?', tr: 'Geçen yaz tatile nereye gittiniz?' },
    modelAnswer: {
      de: 'Letzten Sommer war ich in Antalya. Ich bin am Strand gewesen und habe viel geschwommen.',
      tr: 'Geçen yaz Antalya’daydım. Plaja gittim ve çok yüzdüm.',
    },
    acceptKeywords: ['war', 'letzten sommer', 'gewesen', 'geschwommen', 'urlaub'],
    hint: {
      de: 'Erzählen Sie im Perfekt — wo, wann, was gemacht.',
      tr: 'Perfekt ile anlat — nerede, ne zaman, ne yaptın.',
    },
  },
  {
    id: 'transport',
    category: 'tagesablauf',
    question: { de: 'Wie kommen Sie zur Arbeit oder Schule?', tr: 'İşe ya da okula nasıl gidersiniz?' },
    modelAnswer: {
      de: 'Ich fahre meistens mit dem Bus, weil das schneller ist. Manchmal gehe ich auch zu Fuß.',
      tr: 'Genelde otobüsle giderim, daha hızlı olduğu için. Bazen yürüyerek de giderim.',
    },
    acceptKeywords: ['fahre', 'gehe', 'bus', 'auto', 'fuß', 'weil'],
    hint: {
      de: 'Verkehrsmittel + Grund: „Ich fahre mit … weil …".',
      tr: 'Araç + sebep: "Ich fahre mit … weil …".',
    },
  },
  {
    id: 'haustier',
    category: 'familie',
    question: { de: 'Haben Sie ein Haustier?', tr: 'Evcil hayvanınız var mı?' },
    modelAnswer: {
      de: 'Ja, ich habe einen Hund. Er heißt Max und ist drei Jahre alt.',
      tr: 'Evet, bir köpeğim var. Adı Max ve üç yaşında.',
    },
    acceptKeywords: ['haustier', 'hund', 'katze', 'ich habe', 'kein'],
    hint: {
      de: 'Ja/Nein + Tier + 1-2 Details (Name, Alter).',
      tr: 'Ja/Nein + hayvan + 1-2 detay (isim, yaş).',
    },
  },
  {
    id: 'kindheit',
    category: 'familie',
    question: { de: 'Wo sind Sie geboren und aufgewachsen?', tr: 'Nerede doğdunuz ve büyüdünüz?' },
    modelAnswer: {
      de: 'Ich bin in Istanbul geboren und dort aufgewachsen. Meine Familie wohnt immer noch dort.',
      tr: 'İstanbul’da doğdum ve orada büyüdüm. Ailem hâlâ orada yaşıyor.',
    },
    acceptKeywords: ['geboren', 'aufgewachsen', 'in', 'dort'],
    hint: {
      de: 'Perfekt + Ort: „Ich bin in … geboren".',
      tr: '"Ich bin in … geboren" + ek detay.',
    },
  },
  {
    id: 'lieblingsessen',
    category: 'essen',
    question: { de: 'Was ist Ihr Lieblingsessen?', tr: 'En sevdiğiniz yemek ne?' },
    modelAnswer: {
      de: 'Mein Lieblingsessen ist Köfte. Meine Mutter kocht es jeden Sonntag.',
      tr: 'En sevdiğim yemek köfte. Annem her pazar yapar.',
    },
    acceptKeywords: ['lieblingsessen', 'mag', 'esse gern', 'kocht'],
    hint: {
      de: 'Form: „Mein Lieblingsessen ist …" + warum/wann.',
      tr: '"Mein Lieblingsessen ist …" + neden/ne zaman.',
    },
  },
];

export const DEFAULT_TEIL1_COUNT_A2 = 4;

// ── Teil 2: Aus dem eigenen Leben erzählen (Monologue + jury follow-up) ──────
export interface SprechenA2Teil2Followup {
  question: BilingualText;
  modelAnswer: BilingualText;
  acceptKeywords: string[];
}

export interface SprechenA2Teil2Theme {
  id: string;
  /** Card title written at the top of the Aufgabenblatt. */
  title: BilingualText;
  /** 3-4 prompts the candidate must touch on during the monologue. */
  leitfragen: BilingualText[];
  /** A sample A2-grade monologue — used for hints and end-of-step feedback. */
  modelMonolog: BilingualText;
  /** Keywords any acceptable monologue should mention (lowercased). */
  monologAcceptKeywords: string[];
  /** Minimum word count we expect — A2 monologues are usually 40-60 words. */
  monologMinWords: number;
  /** 2-3 jury follow-up questions; one is picked per session. */
  juryFollowups: SprechenA2Teil2Followup[];
}

export const TEIL2_THEMES_A2: SprechenA2Teil2Theme[] = [
  {
    id: 'geld',
    title: { de: 'Geld in meinem Leben', tr: 'Hayatımda Para' },
    leitfragen: [
      { de: 'Wofür geben Sie Ihr Geld aus?', tr: 'Paranızı neye harcıyorsunuz?' },
      { de: 'Sparen Sie für etwas?', tr: 'Bir şey için biriktiriyor musunuz?' },
      { de: 'Wo kaufen Sie Ihre Kleidung?', tr: 'Giysilerinizi nereden alıyorsunuz?' },
      {
        de: 'Bezahlen Sie lieber mit Karte oder bar?',
        tr: 'Kartla mı nakit mi ödemeyi tercih edersiniz?',
      },
    ],
    modelMonolog: {
      de: 'Ich gebe mein Geld vor allem für Essen, Miete und manchmal Reisen aus. Ich spare jeden Monat ein bisschen, weil ich nächstes Jahr nach Berlin fahren möchte. Meine Kleidung kaufe ich meistens online, denn das ist billiger. Ich bezahle lieber mit Karte, weil es schneller ist.',
      tr: 'Paramı çoğunlukla yemek, kira ve bazen seyahatlere harcarım. Her ay biraz biriktiriyorum çünkü gelecek yıl Berlin\'e gitmek istiyorum. Giysilerimi genelde internetten alırım çünkü daha ucuz. Kartla ödemeyi tercih ediyorum çünkü daha hızlı.',
    },
    monologAcceptKeywords: [
      'geld',
      'gebe aus',
      'kaufe',
      'spare',
      'bezahle',
      'karte',
      'weil',
      'gehe',
    ],
    monologMinWords: 35,
    juryFollowups: [
      {
        question: { de: 'Was war Ihr letztes teures Geschenk?', tr: 'Son pahalı hediyeniz neydi?' },
        modelAnswer: {
          de: 'Mein letztes teures Geschenk war eine Uhr für meinen Vater.',
          tr: 'Son pahalı hediyem babama aldığım bir saatti.',
        },
        acceptKeywords: ['mein letztes', 'geschenk', 'war', 'gekauft'],
      },
      {
        question: { de: 'Geben Sie viel Geld für Hobbys aus?', tr: 'Hobiler için çok para harcıyor musunuz?' },
        modelAnswer: {
          de: 'Ja, ich gebe ziemlich viel für meine Hobbys aus, vor allem für Bücher und Sport.',
          tr: 'Evet, hobilerime epey para harcıyorum, özellikle kitap ve spora.',
        },
        acceptKeywords: ['hobbys', 'gebe', 'aus', 'sport', 'bücher'],
      },
    ],
  },
  {
    id: 'wochenende',
    title: { de: 'Mein Wochenende', tr: 'Hafta Sonum' },
    leitfragen: [
      { de: 'Was machen Sie am Wochenende?', tr: 'Hafta sonu ne yaparsınız?' },
      { de: 'Wann stehen Sie am Wochenende auf?', tr: 'Hafta sonu kaçta kalkarsınız?' },
      { de: 'Treffen Sie Freunde am Wochenende?', tr: 'Hafta sonu arkadaşlarınızla görüşür müsünüz?' },
      {
        de: 'Was haben Sie letztes Wochenende gemacht?',
        tr: 'Geçen hafta sonu ne yaptınız?',
      },
    ],
    modelMonolog: {
      de: 'Am Wochenende stehe ich später auf, normalerweise um neun Uhr. Am Samstag treffe ich oft meine Freunde im Café. Am Sonntag bleibe ich zu Hause und sehe Filme. Letztes Wochenende bin ich mit meiner Familie ins Restaurant gegangen und wir haben Fisch gegessen. Es war wirklich schön.',
      tr: 'Hafta sonu daha geç kalkarım, genelde dokuzda. Cumartesi sık sık arkadaşlarımla kafede buluşurum. Pazar evde kalırım ve film izlerim. Geçen hafta sonu ailemle restorana gittim ve balık yedik. Çok güzeldi.',
    },
    monologAcceptKeywords: [
      'wochenende',
      'samstag',
      'sonntag',
      'treffe',
      'gegangen',
      'gemacht',
      'freunde',
    ],
    monologMinWords: 35,
    juryFollowups: [
      {
        question: { de: 'Was machen Sie lieber: ausgehen oder zu Hause bleiben?', tr: 'Hangisini tercih edersiniz: dışarı çıkmak mı evde kalmak mı?' },
        modelAnswer: {
          de: 'Ich bleibe lieber zu Hause, weil ich gern Filme sehe und lese.',
          tr: 'Evde kalmayı tercih ederim çünkü film izlemeyi ve okumayı severim.',
        },
        acceptKeywords: ['lieber', 'bleibe', 'gehe aus', 'weil'],
      },
      {
        question: { de: 'Haben Sie letztes Wochenende Sport gemacht?', tr: 'Geçen hafta sonu spor yaptınız mı?' },
        modelAnswer: {
          de: 'Ja, ich bin am Sonntag im Park gelaufen, etwa eine Stunde.',
          tr: 'Evet, pazar günü parkta yaklaşık bir saat koştum.',
        },
        acceptKeywords: ['sport', 'gelaufen', 'gemacht', 'gespielt', 'sonntag', 'samstag'],
      },
    ],
  },
  {
    id: 'beruf',
    title: { de: 'Mein Beruf', tr: 'Mesleğim' },
    leitfragen: [
      { de: 'Was sind Sie von Beruf?', tr: 'Mesleğiniz ne?' },
      { de: 'Wie sieht Ihr Arbeitstag aus?', tr: 'İş gününüz nasıl geçer?' },
      { de: 'Was gefällt Ihnen an Ihrer Arbeit?', tr: 'İşinizin hangi yanını seviyorsunuz?' },
      { de: 'Was würden Sie gern in Zukunft machen?', tr: 'Gelecekte ne yapmak istersiniz?' },
    ],
    modelMonolog: {
      de: 'Ich bin Lehrer von Beruf. Mein Tag beginnt um sieben Uhr morgens. Ich unterrichte Deutsch und Englisch. An meiner Arbeit gefällt mir, dass ich mit Kindern arbeite. In Zukunft möchte ich gern in Deutschland arbeiten, weil ich mein Deutsch verbessern will.',
      tr: 'Mesleğim öğretmenlik. Günüm sabah yedide başlar. Almanca ve İngilizce öğretirim. İşimde çocuklarla çalışmak hoşuma gidiyor. Gelecekte Almanya’da çalışmak isterim, çünkü Almancamı geliştirmek istiyorum.',
    },
    monologAcceptKeywords: ['beruf', 'arbeite', 'mein tag', 'gefällt', 'möchte', 'weil'],
    monologMinWords: 35,
    juryFollowups: [
      {
        question: { de: 'Arbeiten Sie lieber allein oder im Team?', tr: 'Yalnız mı yoksa ekiple mi çalışmayı seversiniz?' },
        modelAnswer: {
          de: 'Ich arbeite lieber im Team, weil das oft mehr Spaß macht.',
          tr: 'Ekiple çalışmayı tercih ederim, çünkü çoğu zaman daha eğlenceli.',
        },
        acceptKeywords: ['lieber', 'team', 'allein', 'weil'],
      },
      {
        question: { de: 'Wie viele Stunden arbeiten Sie pro Tag?', tr: 'Günde kaç saat çalışırsınız?' },
        modelAnswer: {
          de: 'Ich arbeite normalerweise acht Stunden pro Tag.',
          tr: 'Normalde günde sekiz saat çalışırım.',
        },
        acceptKeywords: ['stunden', 'arbeite', 'pro tag', 'normalerweise'],
      },
    ],
  },
  {
    id: 'reisen',
    title: { de: 'Reisen und Urlaub', tr: 'Seyahat ve Tatil' },
    leitfragen: [
      { de: 'Reisen Sie gern?', tr: 'Seyahat etmeyi sever misiniz?' },
      { de: 'Wohin sind Sie schon gefahren?', tr: 'Nereye gittiniz şimdiye kadar?' },
      { de: 'Wie reisen Sie am liebsten?', tr: 'En çok nasıl seyahat etmeyi seversiniz?' },
      { de: 'Was war Ihr letzter Urlaub?', tr: 'Son tatiliniz nasıldı?' },
    ],
    modelMonolog: {
      de: 'Ja, ich reise sehr gern. Ich bin schon nach Italien, Spanien und Deutschland gefahren. Am liebsten reise ich mit dem Flugzeug, weil es schnell ist. Letzten Sommer war ich in Rom. Ich habe viele Museen besucht und gutes Essen probiert.',
      tr: 'Evet, seyahat etmeyi çok severim. İtalya, İspanya ve Almanya’ya gittim. En çok uçakla gitmeyi severim çünkü hızlı. Geçen yaz Roma’daydım. Birçok müze gezdim ve güzel yemekler denedim.',
    },
    monologAcceptKeywords: ['reise', 'gefahren', 'besucht', 'mit dem', 'urlaub', 'war'],
    monologMinWords: 35,
    juryFollowups: [
      {
        question: { de: 'Was packen Sie immer in Ihren Koffer?', tr: 'Bavulunuza her zaman ne koyarsınız?' },
        modelAnswer: {
          de: 'Ich packe immer Kleidung, mein Handy und ein Buch ein.',
          tr: 'Her zaman kıyafet, telefonum ve bir kitap koyarım.',
        },
        acceptKeywords: ['koffer', 'packe', 'immer', 'kleidung'],
      },
      {
        question: { de: 'Was möchten Sie als Nächstes besuchen?', tr: 'Bir sonraki seyahatte nereye gitmek istersiniz?' },
        modelAnswer: {
          de: 'Nächstes Jahr möchte ich gern nach Berlin fahren.',
          tr: 'Gelecek yıl Berlin’e gitmek isterim.',
        },
        acceptKeywords: ['möchte', 'nächstes', 'fahren', 'besuchen'],
      },
    ],
  },
  {
    id: 'gesundheit',
    title: { de: 'Gesundheit', tr: 'Sağlık' },
    leitfragen: [
      { de: 'Wie oft gehen Sie zum Arzt?', tr: 'Doktora ne sıklıkta gidersiniz?' },
      { de: 'Was machen Sie, wenn Sie krank sind?', tr: 'Hastalandığınızda ne yaparsınız?' },
      { de: 'Treiben Sie regelmäßig Sport?', tr: 'Düzenli spor yapar mısınız?' },
      { de: 'Was essen Sie gesundes?', tr: 'Sağlıklı olarak ne yersiniz?' },
    ],
    modelMonolog: {
      de: 'Ich gehe nicht oft zum Arzt, vielleicht einmal im Jahr. Wenn ich krank bin, trinke ich viel Tee und ruhe mich aus. Ich mache regelmäßig Sport, weil das gut für die Gesundheit ist. Ich esse viel Obst und Gemüse.',
      tr: 'Doktora sık gitmem, belki yılda bir. Hastalandığımda çok çay içerim ve dinlenirim. Düzenli spor yaparım çünkü sağlık için iyi. Çok meyve ve sebze yerim.',
    },
    monologAcceptKeywords: ['arzt', 'krank', 'sport', 'gesund', 'esse', 'trinke'],
    monologMinWords: 35,
    juryFollowups: [
      {
        question: { de: 'Was machen Sie bei Stress?', tr: 'Stresli olduğunuzda ne yaparsınız?' },
        modelAnswer: {
          de: 'Bei Stress mache ich Yoga oder höre Musik, das hilft mir.',
          tr: 'Streste yoga yaparım veya müzik dinlerim, bana iyi geliyor.',
        },
        acceptKeywords: ['stress', 'yoga', 'musik', 'hilft', 'mache'],
      },
      {
        question: { de: 'Rauchen Sie oder trinken Sie Alkohol?', tr: 'Sigara veya alkol kullanıyor musunuz?' },
        modelAnswer: {
          de: 'Nein, ich rauche nicht und trinke sehr selten Alkohol.',
          tr: 'Hayır, sigara içmem ve nadiren alkol içerim.',
        },
        acceptKeywords: ['rauche', 'trinke', 'nicht', 'selten', 'alkohol'],
      },
    ],
  },
  {
    id: 'wohnen',
    title: { de: 'Meine Wohnung', tr: 'Dairem' },
    leitfragen: [
      { de: 'Wo wohnen Sie?', tr: 'Nerede yaşıyorsunuz?' },
      { de: 'Wie ist Ihre Wohnung?', tr: 'Daireniz nasıl?' },
      { de: 'Was gefällt Ihnen an Ihrer Wohnung?', tr: 'Dairenizin hangi yanı hoşunuza gidiyor?' },
      { de: 'Was möchten Sie ändern?', tr: 'Neyi değiştirmek istersiniz?' },
    ],
    modelMonolog: {
      de: 'Ich wohne in Istanbul, in einer Wohnung mit drei Zimmern. Die Wohnung ist nicht groß, aber sie ist gemütlich. Mir gefällt die Küche besonders gut, weil sie hell ist und einen Balkon hat. Ich wohne mit meiner Familie zusammen. Ich möchte gern ein größeres Wohnzimmer haben.',
      tr: 'İstanbul\'da, üç odalı bir dairede yaşıyorum. Daire büyük değil ama rahat. Mutfak özellikle hoşuma gidiyor çünkü aydınlık ve balkonu var. Ailemle birlikte yaşıyorum. Daha büyük bir oturma odası isterim.',
    },
    monologAcceptKeywords: [
      'wohne',
      'wohnung',
      'zimmer',
      'gefällt',
      'küche',
      'familie',
      'möchte',
      'weil',
    ],
    monologMinWords: 35,
    juryFollowups: [
      {
        question: { de: 'Wer wohnt mit Ihnen zusammen?', tr: 'Sizinle kim yaşıyor?' },
        modelAnswer: {
          de: 'Ich wohne mit meinen Eltern und meinem Bruder zusammen.',
          tr: 'Annem, babam ve erkek kardeşimle yaşıyorum.',
        },
        acceptKeywords: ['wohne mit', 'familie', 'eltern', 'bruder', 'schwester', 'allein'],
      },
      {
        question: { de: 'Möchten Sie einmal umziehen? Warum?', tr: 'Bir gün taşınmak ister misiniz? Neden?' },
        modelAnswer: {
          de: 'Ja, eines Tages möchte ich nach Deutschland umziehen, weil ich dort arbeiten will.',
          tr: 'Evet, bir gün Almanya\'ya taşınmak istiyorum çünkü orada çalışmak istiyorum.',
        },
        acceptKeywords: ['umziehen', 'möchte', 'weil', 'andere'],
      },
    ],
  },
];

// ── Teil 3: Gemeinsam etwas planen (Dialogue) ────────────────────────────────
export interface SprechenA2Teil3Turn {
  speaker: 'examiner' | 'user';
  /** What's said (examiner) or what the candidate should aim for (user). */
  prompt: BilingualText;
  /** For user turns only: a sample A2-level reply. */
  modelAnswer?: BilingualText;
  /** Keywords any acceptable user reply should contain. */
  acceptKeywords?: string[];
}

export interface SprechenA2Teil3Scenario {
  id: string;
  title: BilingualText;
  /** Short setup paragraph shown above the dialogue. */
  setup: BilingualText;
  /** Bullet list — what needs to be agreed on. */
  talkingPoints: BilingualText[];
  /** Strict turn order: examiner opens, user responds, alternating. */
  turns: SprechenA2Teil3Turn[];
}

export const TEIL3_SCENARIOS_A2: SprechenA2Teil3Scenario[] = [
  {
    id: 'geschenk',
    title: { de: 'Geschenk für Patrick', tr: 'Patrick’e Doğum Günü Hediyesi' },
    setup: {
      de: 'Ihr Freund Patrick hat nächste Woche Geburtstag. Planen Sie zusammen ein Geschenk.',
      tr: 'Arkadaşınız Patrick’in gelecek hafta doğum günü. Birlikte bir hediye planlayın.',
    },
    talkingPoints: [
      { de: 'Was kaufen wir?', tr: 'Ne alıyoruz?' },
      { de: 'Wann treffen wir uns?', tr: 'Ne zaman buluşacağız?' },
      { de: 'Wo kaufen wir das Geschenk?', tr: 'Hediyeyi nereden alıyoruz?' },
      { de: 'Wie viel geben wir aus?', tr: 'Ne kadar harcıyoruz?' },
    ],
    turns: [
      {
        speaker: 'examiner',
        prompt: {
          de: 'Hallo! Patrick hat nächste Woche Geburtstag. Was sollen wir ihm kaufen?',
          tr: 'Selam! Patrick’in gelecek hafta doğum günü. Ona ne alalım?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie ein Geschenk vor (z.B. Buch, Uhr, Kaffeemaschine).',
          tr: 'Bir hediye öner (örn. kitap, saat, kahve makinesi).',
        },
        modelAnswer: {
          de: 'Wie wäre es mit einem Buch? Er liest gern.',
          tr: 'Bir kitap nasıl olur? Okumayı seviyor.',
        },
        acceptKeywords: ['wie wäre', 'vielleicht', 'kaufen', 'buch', 'uhr', 'idee'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Gute Idee! Wann treffen wir uns zum Einkaufen? Hast du am Samstag Zeit?',
          tr: 'İyi fikir! Alışveriş için ne zaman buluşalım? Cumartesi vaktin var mı?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Sagen Sie, ob Samstag passt. Wenn nicht, schlagen Sie einen anderen Tag vor.',
          tr: 'Cumartesi uyar mı söyle. Uymazsa başka bir gün öner.',
        },
        modelAnswer: {
          de: 'Am Samstag habe ich leider keine Zeit. Passt es dir am Sonntag um 11 Uhr?',
          tr: 'Cumartesi maalesef vaktim yok. Pazar saat 11’de sana uyar mı?',
        },
        acceptKeywords: ['samstag', 'sonntag', 'uhr', 'passt', 'zeit', 'kann'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Sonntag um 11 Uhr passt. Wo treffen wir uns? Und wie viel geben wir aus?',
          tr: 'Pazar saat 11 uyar. Nerede buluşacağız? Ve ne kadar harcayacağız?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Sagen Sie einen Treffpunkt und das Budget (z.B. 30 Euro pro Person).',
          tr: 'Bir buluşma noktası ve bütçe söyle (örn. kişi başı 30 Euro).',
        },
        modelAnswer: {
          de: 'Treffen wir uns vor dem Kaufhaus. Jeder gibt 30 Euro, das sind zusammen 60 Euro.',
          tr: 'Mağazanın önünde buluşalım. Kişi başı 30 Euro veriyoruz, toplam 60 Euro eder.',
        },
        acceptKeywords: ['treffen', 'vor', 'euro', 'jeder', 'zusammen'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Super, abgemacht! Bis Sonntag also.',
          tr: 'Süper, anlaştık! Pazara görüşürüz.',
        },
      },
    ],
  },
  {
    id: 'kino',
    title: { de: 'Ins Kino gehen', tr: 'Birlikte Sinemaya Gitmek' },
    setup: {
      de: 'Sie möchten am Wochenende zusammen ins Kino gehen. Planen Sie den Abend.',
      tr: 'Hafta sonu birlikte sinemaya gitmek istiyorsunuz. Akşamı planlayın.',
    },
    talkingPoints: [
      { de: 'Welcher Film?', tr: 'Hangi film?' },
      { de: 'Welcher Tag und welche Uhrzeit?', tr: 'Hangi gün, saat kaçta?' },
      { de: 'Wo treffen wir uns?', tr: 'Nerede buluşacağız?' },
      { de: 'Wer kauft die Tickets?', tr: 'Biletleri kim alacak?' },
    ],
    turns: [
      {
        speaker: 'examiner',
        prompt: {
          de: 'Hast du Lust, am Wochenende ins Kino zu gehen? Was möchtest du sehen?',
          tr: 'Hafta sonu sinemaya gitmek ister misin? Neyi izlemek istiyorsun?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Sagen Sie Ja und schlagen Sie einen Film vor (Komödie, Krimi, Animation …).',
          tr: 'Evet de ve bir film öner (komedi, polisiye, animasyon…).',
        },
        modelAnswer: {
          de: 'Ja, gern! Ich möchte gern eine Komödie sehen. Was meinst du?',
          tr: 'Evet, memnuniyetle! Bir komedi izlemek istiyorum. Sen ne dersin?',
        },
        acceptKeywords: ['gern', 'möchte', 'sehen', 'film', 'komödie', 'krimi'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Eine Komödie ist eine gute Idee. Wann gehen wir? Am Freitag oder Samstag?',
          tr: 'Komedi iyi fikir. Ne zaman gidelim? Cuma mı cumartesi mi?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Wählen Sie einen Tag und eine Uhrzeit (z.B. Samstag, 20 Uhr).',
          tr: 'Bir gün ve saat seç (örn. cumartesi 20:00).',
        },
        modelAnswer: {
          de: 'Lass uns am Samstag um 20 Uhr gehen. Passt das?',
          tr: 'Cumartesi saat 20:00’de gidelim. Uyar mı?',
        },
        acceptKeywords: ['samstag', 'freitag', 'uhr', 'lass uns', 'passt'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Passt. Wo treffen wir uns? Vor dem Kino oder lieber im Café?',
          tr: 'Uyar. Nerede buluşacağız? Sinemanın önünde mi yoksa kafede mi?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie einen Treffpunkt vor und sagen Sie, wer die Tickets kauft.',
          tr: 'Buluşma noktasını öner ve biletleri kimin alacağını söyle.',
        },
        modelAnswer: {
          de: 'Treffen wir uns um halb acht im Café. Ich kaufe die Tickets online, okay?',
          tr: '7:30’da kafede buluşalım. Biletleri internetten ben alırım, olur mu?',
        },
        acceptKeywords: ['treffen', 'café', 'kino', 'kaufe', 'tickets', 'online'],
      },
      {
        speaker: 'examiner',
        prompt: { de: 'Super! Bis Samstag dann.', tr: 'Süper! Cumartesi görüşürüz.' },
      },
    ],
  },
  {
    id: 'ausflug',
    title: { de: 'Ausflug am Wochenende', tr: 'Hafta Sonu Gezisi' },
    setup: {
      de: 'Sie wollen am Wochenende einen Ausflug machen. Planen Sie zusammen, wohin Sie fahren.',
      tr: 'Hafta sonu bir gezi yapmak istiyorsunuz. Birlikte nereye gideceğinizi planlayın.',
    },
    talkingPoints: [
      { de: 'Wohin fahren wir?', tr: 'Nereye gideceğiz?' },
      { de: 'Wann fahren wir los?', tr: 'Ne zaman yola çıkacağız?' },
      { de: 'Wie fahren wir? (Auto, Bus, Zug)', tr: 'Nasıl gideceğiz? (Araba, otobüs, tren)' },
      { de: 'Was nehmen wir mit?', tr: 'Yanımıza ne alacağız?' },
    ],
    turns: [
      {
        speaker: 'examiner',
        prompt: {
          de: 'Wollen wir am Sonntag einen Ausflug machen? Wohin möchtest du fahren?',
          tr: 'Pazar bir gezi yapalım mı? Nereye gitmek istersin?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie ein Ziel vor (See, Park, Strand, Wald …).',
          tr: 'Bir yer öner (göl, park, plaj, orman…).',
        },
        modelAnswer: {
          de: 'Wie wäre es mit dem See? Dort können wir spazieren und ein Picknick machen.',
          tr: 'Göl nasıl olur? Orada yürüyüş yapabilir ve piknik yapabiliriz.',
        },
        acceptKeywords: ['wie wäre', 'see', 'park', 'strand', 'wald', 'spazieren'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Der See klingt schön! Wann fahren wir los und wie kommen wir hin?',
          tr: 'Göl güzel olur! Ne zaman yola çıkıyoruz ve nasıl gidiyoruz?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Sagen Sie die Uhrzeit und das Verkehrsmittel.',
          tr: 'Saat ve ulaşım aracını söyle.',
        },
        modelAnswer: {
          de: 'Wir fahren um 9 Uhr los, am besten mit dem Bus, weil es billiger ist.',
          tr: 'Saat 9’da yola çıkarız, en iyisi otobüsle, çünkü daha ucuz.',
        },
        acceptKeywords: ['uhr', 'fahren', 'bus', 'auto', 'zug', 'weil'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Mit dem Bus ist gut. Was nehmen wir mit?',
          tr: 'Otobüsle iyi olur. Yanımıza ne alıyoruz?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Sagen Sie, was Sie und Ihr Partner mitbringen.',
          tr: 'Sen ve arkadaşının ne getireceğini söyle.',
        },
        modelAnswer: {
          de: 'Ich bringe Sandwiches und Wasser mit. Kannst du Obst und Kekse mitbringen?',
          tr: 'Sandviç ve su getiririm. Sen meyve ve bisküvi getirebilir misin?',
        },
        acceptKeywords: ['bringe', 'mit', 'wasser', 'essen', 'obst', 'sandwich'],
      },
      {
        speaker: 'examiner',
        prompt: { de: 'Klar, abgemacht! Bis Sonntag.', tr: 'Tabii, anlaştık! Pazara görüşürüz.' },
      },
    ],
  },
  // ── More A2 scenarios so repeat sessions feel fresh ────────────────────────
  {
    id: 'restaurant',
    title: { de: 'Im Restaurant essen', tr: 'Restoranda Yemek' },
    setup: {
      de: 'Sie möchten mit einem Freund essen gehen. Planen Sie zusammen das Restaurant und die Uhrzeit.',
      tr: 'Bir arkadaşınızla yemeğe çıkmak istiyorsunuz. Birlikte restoranı ve saati planlayın.',
    },
    talkingPoints: [
      { de: 'Welches Restaurant?', tr: 'Hangi restoran?' },
      { de: 'Wann gehen wir?', tr: 'Ne zaman gidiyoruz?' },
      { de: 'Wer reserviert den Tisch?', tr: 'Masayı kim ayırtacak?' },
      { de: 'Wie viel ausgeben?', tr: 'Ne kadar harcayacağız?' },
    ],
    turns: [
      {
        speaker: 'examiner',
        prompt: {
          de: 'Hast du Lust, am Freitagabend essen zu gehen? Welches Restaurant möchtest du?',
          tr: 'Cuma akşamı yemeğe çıkmak ister misin? Hangi restoranı seçelim?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie ein Restaurant vor (italienisch, türkisch, asiatisch…).',
          tr: 'Bir restoran öner (İtalyan, Türk, Asya…).',
        },
        modelAnswer: {
          de: 'Wie wäre es mit einem italienischen Restaurant? Ich liebe Pizza.',
          tr: 'İtalyan restoranı nasıl olur? Pizzayı çok severim.',
        },
        acceptKeywords: ['wie wäre', 'italienisch', 'türkisch', 'restaurant', 'liebe'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Italienisch klingt gut. Um wie viel Uhr treffen wir uns?',
          tr: 'İtalyan iyi olur. Saat kaçta buluşalım?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie eine Uhrzeit vor.',
          tr: 'Bir saat öner.',
        },
        modelAnswer: {
          de: 'Lass uns um halb acht treffen. Passt das?',
          tr: '7:30’da buluşalım. Sana uyar mı?',
        },
        acceptKeywords: ['uhr', 'lass uns', 'passt', 'treffen'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Passt. Wer reserviert den Tisch?',
          tr: 'Tamamdır. Masayı kim ayırtacak?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Sagen Sie, wer reserviert.',
          tr: 'Kimin ayırtacağını söyle.',
        },
        modelAnswer: {
          de: 'Ich reserviere den Tisch online. Kein Problem.',
          tr: 'Masayı online ben ayırtırım. Sorun değil.',
        },
        acceptKeywords: ['reserviere', 'ich', 'online', 'tisch'],
      },
      {
        speaker: 'examiner',
        prompt: { de: 'Super, bis Freitag dann!', tr: 'Süper, Cuma görüşürüz!' },
      },
    ],
  },
  {
    id: 'stadtgang',
    title: { de: 'Stadtbesichtigung', tr: 'Şehir Turu' },
    setup: {
      de: 'Ein Freund besucht Sie. Planen Sie zusammen einen Tag in Ihrer Stadt.',
      tr: 'Bir arkadaşınız ziyarete geliyor. Birlikte şehrinizde bir günü planlayın.',
    },
    talkingPoints: [
      { de: 'Wohin gehen wir zuerst?', tr: 'Önce nereye gidelim?' },
      { de: 'Wann treffen wir uns?', tr: 'Ne zaman buluşalım?' },
      { de: 'Was essen wir zu Mittag?', tr: 'Öğle yemeği için ne yiyelim?' },
      { de: 'Wie kommen wir herum?', tr: 'Nasıl dolaşacağız?' },
    ],
    turns: [
      {
        speaker: 'examiner',
        prompt: {
          de: 'Mein Freund kommt morgen. Was sollen wir ihm zeigen?',
          tr: 'Arkadaşım yarın geliyor. Ona neyi göstermeli?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie einen Ort vor (Park, Museum, Markt…).',
          tr: 'Bir yer öner (park, müze, çarşı…).',
        },
        modelAnswer: {
          de: 'Wir können zuerst das Museum besuchen, danach in den Park gehen.',
          tr: 'Önce müzeyi gezeriz, sonra parka gideriz.',
        },
        acceptKeywords: ['können', 'zuerst', 'museum', 'park', 'besuchen'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Gute Idee. Wann treffen wir uns?',
          tr: 'İyi fikir. Ne zaman buluşalım?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie Uhrzeit und Treffpunkt vor.',
          tr: 'Saat ve buluşma yeri öner.',
        },
        modelAnswer: {
          de: 'Lass uns um zehn Uhr vor dem Museum treffen.',
          tr: 'Saat onda müzenin önünde buluşalım.',
        },
        acceptKeywords: ['uhr', 'treffen', 'vor', 'lass uns'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Klingt gut. Wo essen wir zu Mittag?',
          tr: 'Güzel. Öğle yemeğini nerede yiyelim?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie ein Restaurant oder Café vor.',
          tr: 'Bir restoran ya da kafe öner.',
        },
        modelAnswer: {
          de: 'Es gibt ein gutes Café in der Altstadt. Dort können wir essen.',
          tr: 'Eski şehirde güzel bir kafe var. Orada yiyebiliriz.',
        },
        acceptKeywords: ['café', 'restaurant', 'können', 'essen'],
      },
      {
        speaker: 'examiner',
        prompt: { de: 'Perfekt! Bis morgen.', tr: 'Süper! Yarın görüşürüz.' },
      },
    ],
  },
  {
    id: 'geburtstagsparty',
    title: { de: 'Geburtstagsparty planen', tr: 'Doğum Günü Partisi Planı' },
    setup: {
      de: 'Sie planen zusammen eine Geburtstagsparty für eine Freundin. Was kaufen Sie und wer macht was?',
      tr: 'Bir arkadaşınız için doğum günü partisi planlıyorsunuz. Ne alalım, kim ne yapacak?',
    },
    talkingPoints: [
      { de: 'Wann und wo machen wir die Party?', tr: 'Parti ne zaman ve nerede?' },
      { de: 'Wen laden wir ein?', tr: 'Kimi davet edelim?' },
      { de: 'Was kaufen wir zu essen?', tr: 'Ne yemek alalım?' },
      { de: 'Welches Geschenk?', tr: 'Hangi hediye?' },
    ],
    turns: [
      {
        speaker: 'examiner',
        prompt: {
          de: 'Anna hat bald Geburtstag. Sollen wir eine kleine Party machen? Wann und wo?',
          tr: 'Anna’nın yakında doğum günü. Küçük bir parti yapalım mı? Ne zaman, nerede?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Schlagen Sie Tag, Uhrzeit und Ort vor (zu Hause, Café, Park…).',
          tr: 'Gün, saat ve yer öner (evde, kafede, parkta…).',
        },
        modelAnswer: {
          de: 'Wir können am Samstagabend um acht Uhr bei mir zu Hause feiern.',
          tr: 'Cumartesi akşamı saat sekizde benim evimde kutlayabiliriz.',
        },
        acceptKeywords: ['samstag', 'uhr', 'können', 'hause', 'feiern'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Bei dir zu Hause ist super. Wen laden wir ein?',
          tr: 'Senin evinde iyi olur. Kimi davet edelim?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Sagen Sie, wen Sie einladen möchten.',
          tr: 'Kimi davet etmek istediğini söyle.',
        },
        modelAnswer: {
          de: 'Wir laden ungefähr zehn Freunde von Anna ein.',
          tr: 'Anna’nın yaklaşık on arkadaşını davet ederiz.',
        },
        acceptKeywords: ['laden ein', 'freunde', 'zehn', 'gäste'],
      },
      {
        speaker: 'examiner',
        prompt: {
          de: 'Gute Idee. Was kaufen wir zu essen und zu trinken?',
          tr: 'İyi fikir. Yiyecek ve içecek olarak ne alalım?',
        },
      },
      {
        speaker: 'user',
        prompt: {
          de: 'Sagen Sie, was Sie kaufen werden und wer was bringt.',
          tr: 'Ne alacağınızı ve kimin ne getireceğini söyle.',
        },
        modelAnswer: {
          de: 'Ich kaufe Pizza und Cola. Kannst du den Kuchen mitbringen?',
          tr: 'Ben pizza ve kola alırım. Sen pasta getirebilir misin?',
        },
        acceptKeywords: ['kaufe', 'bringe', 'pizza', 'kuchen', 'cola'],
      },
      {
        speaker: 'examiner',
        prompt: { de: 'Klar, abgemacht! Bis Samstag.', tr: 'Tabii, anlaştık! Cumartesi görüşürüz.' },
      },
    ],
  },
];

// ─── Grading helpers (monologue threshold differs from short replies) ────────
export interface MonologGrading {
  ok: boolean;
  words: number;
  matched: string[];
  /** Did the candidate use Perfekt? Bonus marker for grading. */
  hasPerfekt: boolean;
  /** Did the candidate use "weil" / "wenn" / "dass"? Bonus marker. */
  hasSubordinate: boolean;
}

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,;:!?¡¿"'„“”«»()—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const PERFEKT_AUX = /\b(habe|hast|hat|haben|habt|bin|bist|ist|sind|seid|war|warst|waren)\b/;
const SUBORDINATE = /\b(weil|wenn|dass|obwohl|damit|als)\b/;

export function gradeMonolog(
  input: string,
  accept: string[],
  minWords: number,
): MonologGrading {
  const text = normalise(input);
  const words = text.length === 0 ? 0 : text.split(' ').length;
  const matched = accept
    .map((k) => normalise(k))
    .filter((k) => k.length > 0 && text.includes(k));
  return {
    ok: words >= minWords && matched.length >= 2,
    words,
    matched,
    hasPerfekt: PERFEKT_AUX.test(text),
    hasSubordinate: SUBORDINATE.test(text),
  };
}

// Default session shape — pick 1 theme for Teil 2, 1 scenario for Teil 3.
export const DEFAULT_TEIL2_THEME_COUNT_A2 = 1;
export const DEFAULT_TEIL3_SCENARIO_COUNT_A2 = 1;
