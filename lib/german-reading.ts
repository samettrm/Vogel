// Original German reading passages for the exam's reading section, graded
// A1 → C1. Hand-written for Lexora — NOT copied from any copyrighted exam
// material. Each passage carries short comprehension questions (Turkish).

export type ReadingLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

export interface ReadingQuestion {
  q: string; // question, in Turkish
  options: string[]; // answer options, in Turkish
  correct: number; // index of the correct option
}

export interface ReadingPassage {
  level: ReadingLevel;
  text: string; // the German passage
  questions: ReadingQuestion[];
}

export const READING_PASSAGES: ReadingPassage[] = [
  // ── A1 ──────────────────────────────────────────────────────────────────────
  {
    level: 'A1',
    text: 'Hallo Lisa,\nich komme am Samstag nach Berlin. Mein Zug kommt um 14 Uhr an. Kannst du mich vom Bahnhof abholen?\nDanke und bis bald!\nTom',
    questions: [
      { q: 'Tom ne zaman Berlin’e geliyor?', options: ['Cumartesi', 'Pazar', 'Cuma', 'Pazartesi'], correct: 0 },
      {
        q: 'Tom, Lisa’dan ne istiyor?',
        options: ['Onu istasyondan almasını', 'Ona yemek yapmasını', 'Ona bilet almasını', 'Onu akşam aramasını'],
        correct: 0,
      },
    ],
  },
  {
    level: 'A1',
    text: 'Das ist Maria. Sie ist 25 Jahre alt und wohnt in München. Maria arbeitet als Lehrerin. Am Wochenende spielt sie gern Tennis.',
    questions: [
      { q: 'Maria nerede yaşıyor?', options: ['München', 'Berlin', 'Hamburg', 'Köln'], correct: 0 },
      { q: 'Maria’nın mesleği nedir?', options: ['Öğretmen', 'Doktor', 'Öğrenci', 'Mühendis'], correct: 0 },
    ],
  },
  {
    level: 'A1',
    text: 'Achtung! Das Schwimmbad ist heute geschlossen. Morgen ist es wieder geöffnet, von 9 bis 18 Uhr.',
    questions: [
      {
        q: 'Yüzme havuzu bugün açık mı?',
        options: ['Hayır, kapalı', 'Evet, açık', 'Sadece sabah açık', 'Sadece akşam açık'],
        correct: 0,
      },
      { q: 'Havuz yarın saat kaçta açılıyor?', options: ["9'da", "18'de", "8'de", "10'da"], correct: 0 },
    ],
  },
  {
    level: 'A1',
    text: 'Einkaufsliste:\n- Brot\n- Milch\n- Eier\n- Käse\nBitte auch Kaffee kaufen. Danke!',
    questions: [
      { q: 'Aşağıdakilerden hangisi listede YOK?', options: ['Çay', 'Ekmek', 'Süt', 'Peynir'], correct: 0 },
      { q: 'Kahve alınacak mı?', options: ['Evet', 'Hayır', 'Belli değil', 'Sadece süt alınacak'], correct: 0 },
    ],
  },

  // ── A2 ──────────────────────────────────────────────────────────────────────
  {
    level: 'A2',
    text: 'Peter steht jeden Tag um 7 Uhr auf. Er frühstückt und fährt mit dem Bus zur Arbeit. Am Abend kocht er und sieht fern.',
    questions: [
      { q: 'Peter işe nasıl gidiyor?', options: ['Otobüsle', 'Arabayla', 'Yürüyerek', 'Trenle'], correct: 0 },
      {
        q: 'Peter akşamları ne yapıyor?',
        options: ['Yemek yapıp televizyon izliyor', 'Spor yapıyor', 'Geç saate kadar çalışıyor', 'Arkadaşlarıyla buluşuyor'],
        correct: 0,
      },
    ],
  },
  {
    level: 'A2',
    text: 'Liebe Frau Wagner,\nich kann am Montag nicht zum Deutschkurs kommen. Ich bin krank. Ich komme am Mittwoch wieder.\nViele Grüße\nAhmet',
    questions: [
      {
        q: 'Ahmet pazartesi neden kursa gelemiyor?',
        options: ['Hasta olduğu için', 'Tatilde olduğu için', 'Çalıştığı için', 'Unuttuğu için'],
        correct: 0,
      },
      { q: 'Ahmet ne zaman tekrar gelecek?', options: ['Çarşamba', 'Pazartesi', 'Cuma', 'Salı'], correct: 0 },
    ],
  },
  {
    level: 'A2',
    text: 'Letztes Wochenende war ich mit meiner Familie am See. Das Wetter war schön und wir haben gegrillt. Mein Bruder ist geschwommen, aber das Wasser war noch kalt.',
    questions: [
      { q: 'Aile hafta sonu nereye gitti?', options: ['Göle', 'Dağa', 'Denize', 'Şehre'], correct: 0 },
      { q: 'Kardeşi ne yaptı?', options: ['Yüzdü', 'Balık tuttu', 'Uyudu', 'Yemek yaptı'], correct: 0 },
    ],
  },

  // ── B1 ──────────────────────────────────────────────────────────────────────
  {
    level: 'B1',
    text: 'Seit drei Monaten lerne ich Deutsch in einem Abendkurs. Am Anfang war es schwierig, besonders die Grammatik. Aber jetzt verstehe ich schon viel und kann einfache Gespräche führen. Mein Ziel ist es, nächstes Jahr in Deutschland zu studieren.',
    questions: [
      {
        q: 'Kişi Almancayı nerede öğreniyor?',
        options: ['Akşam kursunda', 'Üniversitede', 'Okulda', 'Yalnızca internetten'],
        correct: 0,
      },
      {
        q: 'Kişinin hedefi nedir?',
        options: ['Almanya’da okumak', 'Almanya’da çalışmak', 'Öğretmen olmak', 'Tatile gitmek'],
        correct: 0,
      },
    ],
  },
  {
    level: 'B1',
    text: 'Viele Menschen in der Stadt benutzen das Fahrrad, um zur Arbeit zu fahren. Das ist gesund und gut für die Umwelt. Die Stadt hat deshalb neue Radwege gebaut. Trotzdem fahren manche Leute lieber mit dem Auto, weil es schneller ist.',
    questions: [
      {
        q: 'İnsanlar neden bisiklet kullanıyor?',
        options: ['Sağlıklı ve çevre dostu olduğu için', 'Pahalı olduğu için', 'Yavaş olduğu için', 'Zorunlu olduğu için'],
        correct: 0,
      },
      {
        q: 'Bazı insanlar neden arabayı tercih ediyor?',
        options: ['Daha hızlı olduğu için', 'Daha ucuz olduğu için', 'Daha sağlıklı olduğu için', 'Daha çevreci olduğu için'],
        correct: 0,
      },
    ],
  },
  {
    level: 'B1',
    text: 'Anna hat letzte Woche ihren Job verloren. Zuerst war sie traurig, aber dann hat sie sich neue Stellen angeschaut. Heute hatte sie ein Vorstellungsgespräch bei einer großen Firma. Sie hofft, dass sie bald eine Antwort bekommt.',
    questions: [
      {
        q: 'Anna’nın başına ne geldi?',
        options: ['İşini kaybetti', 'Terfi etti', 'Başka şehre taşındı', 'Hastalandı'],
        correct: 0,
      },
      {
        q: 'Anna bugün ne yaptı?',
        options: ['İş görüşmesine gitti', 'Yeni ev baktı', 'Tatile çıktı', 'Doktora gitti'],
        correct: 0,
      },
    ],
  },

  // ── B2 ──────────────────────────────────────────────────────────────────────
  {
    level: 'B2',
    text: 'Immer mehr junge Leute entscheiden sich dafür, nach dem Abitur eine Pause zu machen, bevor sie studieren. In diesem sogenannten „Gap Year“ reisen viele ins Ausland oder sammeln Berufserfahrung. Kritiker meinen, dass dadurch wertvolle Zeit verloren geht. Befürworter dagegen betonen, dass die jungen Menschen reifer und selbstständiger werden.',
    questions: [
      {
        q: '„Gap Year“ döneminde gençler genellikle ne yapıyor?',
        options: [
          'Yurt dışına gidip iş deneyimi kazanıyor',
          'Hemen üniversiteye başlıyor',
          'Sadece evde dinleniyor',
          'Lise eğitimine devam ediyor',
        ],
        correct: 0,
      },
      {
        q: 'Destekleyenler bu konuda ne düşünüyor?',
        options: [
          'Gençlerin daha olgun ve bağımsız olduğunu',
          'Değerli zamanın boşa gittiğini',
          'Çok pahalı olduğunu',
          'Tamamen gereksiz olduğunu',
        ],
        correct: 0,
      },
    ],
  },
  {
    level: 'B2',
    text: 'Die Digitalisierung verändert die Arbeitswelt grundlegend. Viele Tätigkeiten, die früher von Menschen erledigt wurden, übernehmen heute Maschinen. Das schafft einerseits neue Möglichkeiten, andererseits fürchten viele Arbeitnehmer um ihre Stellen. Experten sind sich einig, dass lebenslanges Lernen immer wichtiger wird.',
    questions: [
      {
        q: 'Dijitalleşme iş dünyasını nasıl etkiliyor?',
        options: [
          'Birçok işi makineler devralıyor',
          'Hiçbir şey değişmiyor',
          'Sadece maaşları artırıyor',
          'İş saatlerini uzatıyor',
        ],
        correct: 0,
      },
      {
        q: 'Uzmanlara göre giderek daha önemli olan nedir?',
        options: ['Yaşam boyu öğrenme', 'Daha çok mesai', 'Erken emeklilik', 'Daha az tatil'],
        correct: 0,
      },
    ],
  },
  {
    level: 'B2',
    text: 'Gesunde Ernährung ist in den letzten Jahren zu einem wichtigen Thema geworden. Während manche Menschen komplett auf Fleisch verzichten, achten andere vor allem auf regionale und saisonale Produkte. Ärzte empfehlen, möglichst frische Lebensmittel zu essen und Fertiggerichte zu vermeiden.',
    questions: [
      {
        q: 'Bazı insanlar beslenmede neye dikkat ediyor?',
        options: [
          'Bölgesel ve mevsimsel ürünlere',
          'Yalnızca fiyata',
          'Yalnızca porsiyon büyüklüğüne',
          'Hiçbir şeye',
        ],
        correct: 0,
      },
      {
        q: 'Doktorlar ne öneriyor?',
        options: [
          'Taze gıda yiyip hazır yemeklerden kaçınmayı',
          'Daha az öğün yemeyi',
          'Hiç et yememeyi',
          'Sadece vitamin almayı',
        ],
        correct: 0,
      },
    ],
  },

  // ── C1 ──────────────────────────────────────────────────────────────────────
  {
    level: 'C1',
    text: 'Der Klimawandel zählt zweifellos zu den größten Herausforderungen unserer Zeit. Obwohl die wissenschaftlichen Belege eindeutig sind, fällt es vielen Regierungen schwer, konsequente Maßnahmen umzusetzen. Der Grund dafür liegt häufig in wirtschaftlichen Interessen, die kurzfristig schwerer wiegen als langfristige ökologische Überlegungen.',
    questions: [
      {
        q: 'Hükümetler neden kararlı önlemler almakta zorlanıyor?',
        options: [
          'Kısa vadeli ekonomik çıkarlar ağır bastığı için',
          'Bilimsel kanıt bulunmadığı için',
          'Halk bunu hiç istemediği için',
          'Teknoloji yetersiz olduğu için',
        ],
        correct: 0,
      },
      {
        q: 'Metne göre bilimsel kanıtların durumu nedir?',
        options: ['Açık ve nettir', 'Belirsizdir', 'Yetersizdir', 'Tartışmalıdır'],
        correct: 0,
      },
    ],
  },
  {
    level: 'C1',
    text: 'Die Bedeutung der Mehrsprachigkeit wird in einer zunehmend vernetzten Welt oft unterschätzt. Wer mehrere Sprachen beherrscht, profitiert nicht nur beruflich, sondern entwickelt auch ein tieferes Verständnis für andere Kulturen. Studien deuten zudem darauf hin, dass das Erlernen von Sprachen die geistige Flexibilität bis ins hohe Alter fördert.',
    questions: [
      {
        q: 'Çok dillilik, mesleki faydanın yanı sıra başka ne sağlar?',
        options: [
          'Diğer kültürleri daha derin anlamayı',
          'Otomatik olarak daha yüksek maaş',
          'Daha az çalışma saati',
          'Ücretsiz seyahat',
        ],
        correct: 0,
      },
      {
        q: 'Araştırmalar dil öğrenmenin neyi desteklediğini gösteriyor?',
        options: [
          'İleri yaşa kadar zihinsel esnekliği',
          'Yalnızca kısa süreli hafızayı',
          'Fiziksel dayanıklılığı',
          'Uyku düzenini',
        ],
        correct: 0,
      },
    ],
  },
  {
    level: 'C1',
    text: 'In der öffentlichen Debatte über das Homeoffice gehen die Meinungen weit auseinander. Während die einen die gewonnene Flexibilität und den Wegfall langer Arbeitswege loben, beklagen andere die zunehmende Vermischung von Beruf und Privatleben. Unternehmen stehen vor der Aufgabe, Modelle zu entwickeln, die beiden Seiten gerecht werden.',
    questions: [
      {
        q: 'Ev ofisini eleştirenler neden şikâyetçi?',
        options: [
          'İş ve özel hayatın giderek iç içe geçmesinden',
          'Maaşların düşmesinden',
          'İnternetin yavaş olmasından',
          'Meslektaşlarını özlemekten',
        ],
        correct: 0,
      },
      {
        q: 'Şirketlerin önündeki görev nedir?',
        options: [
          'İki tarafa da uygun modeller geliştirmek',
          'Ev ofisini tamamen yasaklamak',
          'Tüm maaşları artırmak',
          'Ofis binalarını kapatmak',
        ],
        correct: 0,
      },
    ],
  },
];
