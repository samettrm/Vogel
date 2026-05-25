// German verb case government (Rektion) — which grammatical case a verb's
// object takes.
//
// Linguistic note: Accusative is the DEFAULT for transitive German verbs, so
// thousands of verbs take it. The verbs a learner must actively memorise are
// the closed, finite classes — Dative, Dative+Accusative and Genitive verbs.
// Those lists below aim to be near-complete; the Accusative list covers the
// common transitive verbs. A verb that is intransitive or governed by a
// preposition is left out — showing nothing beats showing a wrong case.

export type VerbCase = 'akkusativ' | 'dativ' | 'dativ-akkusativ' | 'genitiv';

// Verbs whose single object is in the Dative — a closed class (~60 verbs).
const DATIV: string[] = [
  'ähneln', 'antworten', 'applaudieren', 'auffallen', 'ausweichen', 'begegnen',
  'beikommen', 'beipflichten', 'beistehen', 'beitreten', 'beiwohnen', 'danken',
  'dienen', 'drohen', 'einfallen', 'einleuchten', 'entgegnen', 'entkommen',
  'entrinnen', 'entsprechen', 'fehlen', 'folgen', 'gefallen', 'gehorchen',
  'gehören', 'gelingen', 'genügen', 'gleichen', 'glücken', 'gratulieren',
  'helfen', 'huldigen', 'imponieren', 'missfallen', 'misslingen', 'misstrauen',
  'nachgeben', 'nachlaufen', 'nahekommen', 'nützen', 'obliegen', 'passen',
  // 'passieren' isn't a Dative-governing verb. It only looks Dative when
  // paired with a "freier Dativ" (Dativus ethicus) — e.g. "Mir ist etwas
  // passiert" — so listing it here mislabels the rektion. Removed.
  'raten', 'schaden', 'schmecken', 'schmeicheln', 'standhalten',
  'trauen', 'trotzen', 'unterliegen', 'vertrauen', 'verzeihen', 'weichen',
  'widerfahren', 'widersprechen', 'widerstehen', 'winken', 'zuhören',
  'zureden', 'zusehen', 'zuschauen', 'zustimmen', 'zustoßen', 'zuvorkommen',
  'zuwinken',
];

// Ditransitive verbs — Dative person, Accusative thing ("jdm etwas …").
const DATIV_AKKUSATIV: string[] = [
  'abgewöhnen', 'angewöhnen', 'anbieten', 'antun', 'anvertrauen', 'beibringen',
  'beweisen', 'borgen', 'bringen', 'einschenken', 'empfehlen', 'entziehen',
  'erklären', 'erlauben', 'ermöglichen', 'erzählen', 'geben', 'gestatten',
  'gönnen', 'klauen', 'leihen', 'liefern', 'melden', 'mitbringen', 'mitteilen',
  'opfern', 'rauben', 'reichen', 'sagen', 'schenken', 'schicken', 'schildern',
  'schreiben', 'schulden', 'schwören', 'senden', 'stehlen', 'übergeben',
  'überlassen', 'verbieten', 'verdanken', 'vermachen', 'verraten',
  'verschweigen', 'versprechen', 'verweigern', 'vorlesen', 'vormachen',
  'vorschlagen', 'vorstellen', 'vorwerfen', 'wegnehmen', 'widmen', 'wünschen',
  'zeigen', 'zumuten', 'zuschicken', 'zuteilen', 'zutrauen', 'zuwerfen',
];

// Verbs governing the Genitive — a very small, mostly formal set.
const GENITIV: string[] = [
  'bedürfen', 'gedenken', 'harren', 'entbehren', 'sich annehmen',
  'sich bedienen', 'sich bemächtigen', 'sich enthalten', 'sich entledigen',
  'sich erfreuen', 'sich rühmen', 'sich vergewissern',
];

// Common verbs that take a single Accusative object (the default pattern).
const AKKUSATIV: string[] = [
  'haben', 'machen', 'sehen', 'hören', 'lesen', 'finden', 'nehmen', 'suchen',
  'brauchen', 'kennen', 'lieben', 'hassen', 'mögen', 'treffen', 'fragen',
  'besuchen', 'verstehen', 'vergessen', 'öffnen', 'schließen', 'essen',
  'trinken', 'kochen', 'backen', 'bauen', 'tragen', 'werfen', 'fangen',
  'halten', 'ziehen', 'schieben', 'heben', 'legen', 'stellen', 'setzen',
  'benutzen', 'benützen', 'verwenden', 'gebrauchen', 'lernen', 'lehren',
  'studieren', 'üben', 'wiederholen', 'beschreiben', 'malen', 'zeichnen',
  'fotografieren', 'beobachten', 'betrachten', 'ansehen', 'anschauen',
  'bemerken', 'entdecken', 'verlieren', 'gewinnen', 'bekommen', 'erhalten',
  'kriegen', 'waschen', 'putzen', 'reinigen', 'reparieren', 'schneiden',
  'töten', 'retten', 'schützen', 'verteidigen', 'angreifen', 'besiegen',
  'gründen', 'organisieren', 'planen', 'vorbereiten', 'beenden', 'erledigen',
  'lösen', 'prüfen', 'kontrollieren', 'testen', 'messen', 'mieten',
  'vermieten', 'bezahlen', 'beantworten', 'verlassen', 'nennen', 'rufen',
  'schlagen', 'küssen', 'umarmen', 'fühlen', 'wecken', 'kämmen', 'füttern',
  'gießen', 'ernten', 'anrufen', 'anziehen', 'ausziehen', 'aufmachen',
  'zumachen', 'anmachen', 'ausmachen', 'einschalten', 'ausschalten',
  'aufräumen', 'abholen', 'mitnehmen', 'einpacken', 'auspacken', 'aufheben',
  'wegwerfen', 'sammeln', 'ordnen', 'sortieren', 'vergleichen', 'mischen',
  'teilen', 'verbinden', 'trennen', 'binden', 'jagen', 'schießen',
  'erreichen', 'schaffen', 'leisten', 'eröffnen', 'leiten', 'führen',
  'verwalten', 'beherrschen', 'überwachen', 'erziehen', 'unterrichten',
  'ausbilden', 'bewerten', 'korrigieren', 'verbessern', 'ändern', 'verändern',
  'gestalten', 'formen', 'bilden', 'herstellen', 'produzieren', 'montieren',
  'installieren', 'einrichten', 'ausstatten', 'schmücken', 'streichen',
  'heiraten', 'grüßen', 'begrüßen', 'einladen', 'informieren', 'warnen',
  'überzeugen', 'beeindrucken', 'ärgern', 'stören', 'unterstützen', 'fördern',
  'loben', 'kritisieren', 'bestrafen', 'belohnen', 'verhaften', 'festnehmen',
  'befreien', 'entlassen', 'einstellen', 'beschäftigen', 'bestellen',
  'packen', 'laden', 'füllen', 'leeren', 'drehen', 'wenden', 'brechen',
  'zerstören', 'beschädigen', 'errichten', 'abreißen', 'graben', 'pflanzen',
  'kaufen', 'verkaufen', 'holen', 'bestätigen', 'ablehnen', 'akzeptieren',
  'wählen', 'entscheiden', 'erkennen', 'erwarten', 'wiegen', 'zählen',
  'schätzen', 'verlangen', 'fordern',
];

const VERB_CASES = new Map<string, VerbCase>();
for (const v of AKKUSATIV) VERB_CASES.set(v, 'akkusativ');
for (const v of DATIV) VERB_CASES.set(v, 'dativ');
for (const v of DATIV_AKKUSATIV) VERB_CASES.set(v, 'dativ-akkusativ');
for (const v of GENITIV) VERB_CASES.set(v, 'genitiv');

// Returns the case a German verb governs, or undefined when not known.
export function getVerbCase(word: string): VerbCase | undefined {
  return VERB_CASES.get(word.trim().toLowerCase());
}
