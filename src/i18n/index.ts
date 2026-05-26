import { useUserStore } from '../store/useUserStore';

// ════════════════════════════════════════════════════════════════
// i18n — TR/EN sözlük
// Tüm Türkçe stringler gerçek Türkçe karakterlerle yazılmıştır
// (ı, İ, ö, Ö, ü, Ü, ş, Ş, ğ, Ğ, ç, Ç).
// Dosya UTF-8 olarak kaydedilmiştir.
// ════════════════════════════════════════════════════════════════

export type Lang = 'tr' | 'en';

export const messages = {
  // Common
  common: {
    continue: { tr: 'DEVAM', en: 'CONTINUE' },
    check: { tr: 'KONTROL ET', en: 'CHECK' },
    cancel: { tr: 'Vazgeç', en: 'Cancel' },
    confirm: { tr: 'Onayla', en: 'Confirm' },
    back: { tr: 'Geri', en: 'Back' },
    save: { tr: 'Kaydet', en: 'Save' },
    delete: { tr: 'Sil', en: 'Delete' },
    edit: { tr: 'Düzenle', en: 'Edit' },
    close: { tr: 'Kapat', en: 'Close' },
    loading: { tr: 'Yükleniyor...', en: 'Loading...' },
    error: { tr: 'Hata', en: 'Error' },
    ok: { tr: 'Tamam', en: 'OK' },
    yes: { tr: 'Evet', en: 'Yes' },
    no: { tr: 'Hayır', en: 'No' },
    soon: { tr: 'yakında', en: 'soon' },
    start: { tr: 'BAŞLA', en: 'START' },
    retry: { tr: 'TEKRAR DENE', en: 'TRY AGAIN' },
    goHome: { tr: 'ANA EKRANA DÖN', en: 'GO HOME' },
  },

  // Tab bar
  tabs: {
    map: { tr: 'Harita', en: 'Map' },
    lessons: { tr: 'Dersler', en: 'Lessons' },
    profile: { tr: 'Profil', en: 'Profile' },
    shop: { tr: 'Market', en: 'Shop' },
  },

  // Settings
  settings: {
    title: { tr: 'Ayarlar', en: 'Settings' },
    sectionSound: { tr: 'Ses & Titreşim', en: 'Sound & Vibration' },
    soundEffects: { tr: 'Ses Efektleri', en: 'Sound Effects' },
    soundEffectsDesc: { tr: 'Cevap sesleri ve uyarılar', en: 'Answer sounds and alerts' },
    haptic: { tr: 'Titreşim', en: 'Vibration' },
    hapticDesc: { tr: 'Haptik geri bildirim', en: 'Haptic feedback' },
    sectionNotifications: { tr: 'Bildirimler', en: 'Notifications' },
    notifications: { tr: 'Bildirimler', en: 'Notifications' },
    notificationsDesc: { tr: 'Günlük seri ve ders hatırlatıcıları', en: 'Daily streak & lesson reminders' },
    sectionAppearance: { tr: 'Görünüm', en: 'Appearance' },
    theme: { tr: 'Tema', en: 'Theme' },
    themeDesc: { tr: 'Uygulama renkleri', en: 'App colors' },
    themeDark: { tr: 'Karanlık', en: 'Dark' },
    themeLight: { tr: 'Aydınlık', en: 'Light' },
    sectionLanguage: { tr: 'Dil', en: 'Language' },
    interfaceLanguage: { tr: 'Arayüz Dili', en: 'Interface Language' },
    interfaceLanguageDesc: { tr: 'Uygulama dili (kurs dili değil)', en: 'App language (not course language)' },
    languageTr: { tr: 'Türkçe', en: 'Turkish' },
    languageEn: { tr: 'İngilizce', en: 'English' },
    // 🎯 Motivasyon (Hedeflerin) bölümü — onboarding'de seçilenler
    sectionMotivation: { tr: 'Hedeflerin', en: 'Your Goals' },
    motivationDesc: {
      tr: 'Bu hedefler ders önerilerini ve bildirimleri kişiselleştirir',
      en: 'These goals personalize lesson suggestions and notifications',
    },
    motivationsHint: { tr: 'En fazla 3 hedef seçebilirsin', en: 'Pick up to 3 goals' },
    motivationsEmpty: { tr: 'Henüz hedef seçmedin', en: 'No goals selected yet' },
    aboutTitle: { tr: 'Vogel', en: 'Vogel' },
    aboutDesc: {
      tr: 'Türkçe konuşanlar için Almanca öğrenme. Sürüm 1.0',
      en: 'German learning for Turkish speakers. Version 1.0',
    },
    // Yasal bölüm
    sectionLegal: { tr: 'Yasal', en: 'Legal' },
    privacyPolicy: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
    privacyPolicyDesc: {
      tr: 'Verilerinin nasıl korunduğunu öğren',
      en: 'Learn how your data is protected',
    },
  },

  // Privacy Policy ekranı
  privacyPolicy: {
    title: { tr: 'Gizlilik Politikası', en: 'Privacy Policy' },
  },

  // Map
  map: {
    greetingHi:  { tr: 'Selam 👋',                  en: 'Hello 👋' },
    greetingSub: { tr: 'Bugün ne öğrenelim?',        en: "What shall we learn today?" },
    welcome: { tr: 'Hadi başlayalım!', en: "Let's start!" },
    keepGoing: { tr: 'Devam et!', en: 'Keep going!' },
    levelCompleted: { tr: 'tamamlandı!', en: 'completed!' },
    resetButton: { tr: 'SIFIRLA', en: 'RESET' },
    resetTitle: { tr: 'İlerlemeyi Sıfırla', en: 'Reset Progress' },
    resetMessage: {
      tr: 'Tüm XP, kalpler, tamamlanan dersler ve premium durumu sıfırlanacak. Emin misin?',
      en: 'All XP, hearts, completed lessons and premium status will be reset. Are you sure?',
    },
    resetConfirm: { tr: 'Sıfırla', en: 'Reset' },
  },

  // Lessons screen
  lessons: {
    title: { tr: 'Dersler', en: 'Lessons' },
    unit: { tr: 'BÖLÜM', en: 'SECTION' },
    subtitle: { tr: 'Tüm seviyeler', en: 'All levels' },
    subtitleCount: {
      tr: 'Tüm seviyeler — {total} ders, {completed} tamamlandı',
      en: 'All levels — {total} lessons, {completed} completed',
    },
    completed: { tr: 'Tamamlandı', en: 'Completed' },
    completedBadge: { tr: 'TAMAMLANDI', en: 'COMPLETED' },
    inProgress: { tr: 'Yarım', en: 'In Progress' },
    inProgressBadge: { tr: 'YARIM', en: 'IN PROGRESS' },
    notStarted: { tr: 'Başlanmadı', en: 'Not Started' },
    notStartedBadge: { tr: 'BAŞLA', en: 'START' },
    total: { tr: 'Toplam', en: 'Total' },
    all: { tr: 'Hepsi', en: 'All' },
    allLevels: { tr: 'Tüm Seviyeler', en: 'All Levels' },
    search: { tr: 'Ders ara...', en: 'Search lessons...' },
    quickPractice: { tr: 'Hızlı Pratik', en: 'Quick Practice' },
    quickPracticeDesc: {
      tr: 'Rastgele bir ders ile hızla tekrar et',
      en: 'Quickly review with a random lesson',
    },
    noResults: { tr: 'Sonuç yok', en: 'No results' },
    noResultsDesc: { tr: 'Aramayı veya filtreleri değiştir', en: 'Change your search or filters' },
    clearFilters: { tr: 'FİLTRELERİ TEMİZLE', en: 'CLEAR FILTERS' },
    questionsCount: { tr: '{n} soru', en: '{n} questions' },
  },

  // Profile
  profile: {
    title: { tr: 'Profil', en: 'Profile' },
    upgradeBanner: { tr: '💎 Vogel Plus\'a geç — sınırsız can, reklamsız öğrenme', en: '💎 Upgrade to Vogel Plus — unlimited hearts, ad-free' },
    upgradeCta: { tr: 'İNCELE', en: 'VIEW' },
    level: { tr: 'SEVİYE', en: 'LEVEL' },
    xp: { tr: 'XP', en: 'XP' },
    streak: { tr: 'GÜNLÜK SERİ', en: 'STREAK' },
    streakDays: { tr: '{n} gün', en: '{n} days' },
    hearts: { tr: 'CAN', en: 'HEARTS' },
    accuracy: { tr: 'DOĞRULUK', en: 'ACCURACY' },
    completed: { tr: 'TAMAMLANAN', en: 'COMPLETED' },
    dailyGoal: { tr: 'Günlük Hedef', en: 'Daily Goal' },
    settings: { tr: 'Ayarlar', en: 'Settings' },
    settingsCard: { tr: 'Ayarlar', en: 'Settings' },
    settingsDesc: { tr: 'Tema, dil, ses', en: 'Theme, language, sound' },
    xpProgress: { tr: 'XP İlerlemen', en: 'Your XP Progress' },
    nextLevel: { tr: 'Sonraki seviye', en: 'Next level' },
    // 🎯 Goals Card — onboarding'de seçilen motivasyonları gösteren widget
    goalsCardTitle: { tr: 'Hedeflerin', en: 'Your Goals' },
    goalsCardEdit: { tr: 'Düzenlemek için tıkla', en: 'Tap to edit' },
    goalsCardEmpty: { tr: 'Henüz hedef belirlenmedi', en: 'No goals set yet' },
    goalsCardEmptyHint: {
      tr: 'Ayarlardan hedeflerini seçebilirsin — deneyimini kişiselleştirir',
      en: 'Pick your goals from Settings — it personalizes your experience',
    },
  },

  // Shop
  shop: {
    title: { tr: 'Market', en: 'Shop' },
    subtitle: { tr: 'Yeni paketler keşfet', en: 'Discover new packages' },
    subtitlePremium: { tr: 'Premium üyelik aktif', en: 'Premium membership active' },
    vogelPlus: { tr: 'Vogel Plus', en: 'Vogel Plus' },
    vogelPlusDesc: {
      tr: 'Sınırsız can, reklamsız, özel dersler',
      en: 'Unlimited hearts, ad-free, special lessons',
    },
    vogelPlusActive: { tr: 'Premium üyeliğin aktif', en: 'Your premium is active' },
    active: { tr: 'AKTİF', en: 'ACTIVE' },
    xpPackages: { tr: 'XP Paketleri', en: 'XP Packages' },
    xpSmall: { tr: 'Küçük', en: 'Small' },
    xpMedium: { tr: 'Orta', en: 'Medium' },
    xpLarge: { tr: 'Büyük', en: 'Large' },
    heartPackages: { tr: 'Can Paketleri', en: 'Heart Packages' },
    refillHearts: { tr: 'Canları Yenile', en: 'Refill Hearts' },
    refillHeartsPremium: { tr: 'Premium ile sınırsız can', en: 'Unlimited hearts with Premium' },
    refillHeartsFull: { tr: 'Mevcut can: {n}/{max} (dolu)', en: 'Current hearts: {n}/{max} (full)' },
    refillHeartsCurrent: { tr: 'Mevcut can: {n}/{max}', en: 'Current hearts: {n}/{max}' },
    full: { tr: 'DOLU', en: 'FULL' },
    premium: { tr: 'Premium', en: 'Premium' },
    extraHearts: { tr: '5 Ekstra Can', en: '5 Extra Hearts' },
    extraHeartsDesc: { tr: 'Tek seferlik satın alma', en: 'One-time purchase' },
    monthly: { tr: 'Aylık', en: 'Monthly' },
    yearly: { tr: 'Yıllık', en: 'Yearly' },
    lifetime: { tr: 'Ömür Boyu', en: 'Lifetime' },
    restorePurchases: { tr: 'Satın almaları geri yükle', en: 'Restore purchases' },
    restoreSuccess: { tr: 'Satın almaların geri yüklendi!', en: 'Purchases restored!' },
    restoreNone: { tr: 'Geri yüklenecek satın alma bulunamadı.', en: 'No purchases found to restore.' },
    restoreFailed: { tr: 'Geri yükleme başarısız oldu.', en: 'Restore failed.' },
    purchaseFailed: { tr: 'Satın alma başarısız oldu.', en: 'Purchase failed.' },
    popular: { tr: 'POPÜLER', en: 'POPULAR' },
    bestValue: { tr: 'EN İYİ', en: 'BEST' },
    select: { tr: 'SEÇ', en: 'SELECT' },
    perMonth: { tr: '/ay', en: '/mo' },
    perYear: { tr: '/yıl', en: '/yr' },
    unlimitedHearts: { tr: 'Sınırsız can', en: 'Unlimited hearts' },
    noAds: { tr: 'Reklamsız', en: 'Ad-free' },
    specialLessons: { tr: 'Özel dersler', en: 'Special lessons' },
    allFeatures: { tr: 'Tüm özellikler', en: 'All features' },
    oneTime: { tr: 'Tek seferlik', en: 'One-time' },
    walletXp: { tr: 'XP', en: 'XP' },
  },

  // Lesson screen
  lesson: {
    closeTitle: { tr: 'Dersten çıkılsın mı?', en: 'Exit lesson?' },
    closeMessage: { tr: 'İlerlemen bu derste kaydedilmeyecek.', en: 'Your progress will not be saved.' },
    closeContinue: { tr: 'Devam et', en: 'Continue' },
    closeExit: { tr: 'Çık', en: 'Exit' },
    notFound: { tr: 'Ders bulunamadı', en: 'Lesson not found' },
    empty: { tr: 'Bu ders henüz boş', en: 'This lesson is empty' },
    emptyDesc: {
      tr: 'İçerik eklendikten sonra burada sorular görünecek.',
      en: 'Questions will appear here once content is added.',
    },
    loadFailed: { tr: 'Soru yüklenemedi', en: 'Failed to load question' },
    correct: { tr: 'Harika!', en: 'Great!' },
    correctKeepGoing: { tr: 'Devam et', en: 'Keep going' },
    wrong: { tr: 'Yanlış', en: 'Wrong' },
    wrongAnswer: { tr: 'Doğrusu:', en: 'Correct:' },
  },

  // Lesson complete
  lessonComplete: {
    retryTitle: { tr: 'Tekrar Deneyelim!', en: "Let's Try Again!" },
    retryDesc: {
      tr: 'Endişelenme, öğrenmek tekrarla gelir',
      en: "Don't worry, learning comes with repetition",
    },
    growthTitle: { tr: 'Gelişim Yolunda', en: 'On the Way to Growth' },
    growthDesc: { tr: 'Daha iyiye gidiyorsun, devam et!', en: "You're getting better, keep going!" },
    goodTitle: { tr: 'İyi İş!', en: 'Good Job!' },
    goodDesc: { tr: 'Yolun yarısı tamam', en: 'Halfway there' },
    greatTitle: { tr: 'Harika!', en: 'Great!' },
    greatDesc: { tr: 'Çok az hatayla bitirdin', en: 'Finished with very few mistakes' },
    perfectTitle: { tr: 'Mükemmel!', en: 'Perfect!' },
    perfectDesc: { tr: 'Hatasız bir ders!', en: 'A flawless lesson!' },
    unitCompleteTitle: { tr: 'Ünite Tamamlandı!', en: 'Unit Completed!' },
    unitCompleteDesc: { tr: 'Yeni bölüm açıldı', en: 'New section unlocked' },
    totalXp: { tr: 'TOPLAM XP', en: 'TOTAL XP' },
    accuracyLabel: { tr: 'DOĞRULUK', en: 'ACCURACY' },
    heartsLabel: { tr: 'CAN', en: 'HEARTS' },
    lowHeartsBanner: {
      tr: '❤️ Can azaldı! Sınırsız can için Vogel Plus →',
      en: '❤️ Low on hearts! Get unlimited with Vogel Plus →',
    },
  },

  // Exercises
  exercise: {
    selectCorrect: { tr: 'Doğru cevabı seç', en: 'Select the correct answer' },
    translate: { tr: 'Çevir', en: 'Translate' },
    listen: { tr: 'Dinle ve cümleyi oluştur', en: 'Listen and build the sentence' },
    fillBlank: { tr: 'Boşluğa uygun kelimeyi seç', en: 'Choose the correct word' },
    speakPrompt: { tr: 'KONUŞARAK CEVAP VER', en: 'ANSWER BY SPEAKING' },
    sayThis: { tr: 'Söyle:', en: 'Say:' },
    micTap: { tr: 'Mikrofona dokun ve konuş', en: 'Tap the mic and speak' },
    micListening: { tr: 'Dinleniyor... (tekrar dokun: durdur)', en: 'Listening... (tap again to stop)' },
    micProcessing: { tr: 'Analiz ediliyor...', en: 'Analyzing...' },
    micTranscribing: { tr: 'Yazılıyor...', en: 'Transcribing...' },
    micDone: { tr: 'Tamamlandı!', en: 'Completed!' },
    micPermissionRequired: { tr: 'Mikrofon izni gerekli', en: 'Microphone permission required' },
    micPermissionMessage: {
      tr: 'Konuşma alıştırması için telefon ayarlarından mikrofon iznini ver.',
      en: 'Grant microphone permission in phone settings for speaking practice.',
    },
    micError: { tr: 'Kayıt hatası', en: 'Recording error' },
    micErrorMessage: { tr: 'Mikrofon kullanılamıyor.', en: 'Microphone not available.' },
    recognizedAnswer: { tr: 'ALGILANAN CEVAP', en: 'DETECTED ANSWER' },
    speakHere: { tr: 'Konuşman burada görünecek', en: 'Your speech will appear here' },
    micDenied: { tr: 'Mikrofon izni reddedildi', en: 'Microphone permission denied' },
    wordBank: { tr: 'Kelime havuzu', en: 'Word bank' },
    yourAnswer: { tr: 'Cevabın:', en: 'Your answer:' },
    tapHint: { tr: 'Kelimeleri sırası ile dokun', en: 'Tap words in order' },
    matchPairs: { tr: 'Eşleştir', en: 'Match the pairs' },
    meaning: { tr: 'Türkçesi', en: 'Meaning' },
    newBadge: { tr: 'YENİ', en: 'NEW' },
  },

  // Onboarding (5 step'li kişiselleştirilmiş akış)
  onboarding: {
    // Üst progress + ortak butonlar
    stepIndicator: { tr: '{current} / {total}', en: '{current} / {total}' },
    next: { tr: 'Sonraki', en: 'Next' },
    back: { tr: 'Geri', en: 'Back' },
    skip: { tr: 'Atla', en: 'Skip' },
    startButton: { tr: 'HADİ BAŞLA', en: "LET'S START" },

    // ─── STEP 1: WELCOME ───
    welcome: { tr: "Vogel'e Hoşgeldin", en: 'Welcome to Vogel' },
    subtitle: { tr: 'Almanca öğrenmenin en eğlenceli yolu', en: 'The most fun way to learn German' },
    welcomeContinue: { tr: 'Devam', en: 'Continue' },

    // ─── STEP 2: LEVEL CHECK (sıfırdan mı, placement test mi?) ───
    levelCheckTitle: { tr: 'Seviyene göre başlayalım', en: "Let's start at your level" },
    levelCheckSubtitle: {
      tr: 'İki seçeneğin var — sana uygun olanı seç',
      en: 'Two options — pick what suits you',
    },
    levelScratch: { tr: 'Sıfırdan başlıyorum', en: "I'm starting from scratch" },
    levelScratchDesc: {
      tr: "Almanca'ya yeni başlıyorum — A1'den başla",
      en: "I'm new to German — start at A1",
    },
    levelPlacement: { tr: 'Seviyemi test et', en: 'Test my level' },
    levelPlacementDesc: {
      tr: '6 soruluk hızlı test (~2 dakika)',
      en: 'Quick 6-question test (~2 min)',
    },

    // ─── STEP 3: MOTIVATION (çoklu seçim, 1-3) ───
    motivationTitle: { tr: "Almanca'yı neden öğrenmek istiyorsun?", en: 'Why do you want to learn German?' },
    motivationSubtitle: { tr: 'Birden çok seçebilirsin (1-3) — sana göre bir yolculuk hazırlayacağız', en: 'Pick up to 3 — we will tailor your journey' },
    motivationCounter: { tr: '{count} / 3 seçili', en: '{count} / 3 selected' },
    motivationMaxReached: { tr: 'Maksimum 3 seçim yapabilirsin', en: 'You can pick up to 3' },
    motivationTravel: { tr: 'Seyahat etmek', en: 'For travel' },
    motivationWork: { tr: 'İş veya kariyer', en: 'Work or career' },
    motivationFamily: { tr: 'Sevdiklerim Almanca konuşuyor', en: 'My loved ones speak German' },
    motivationMedia: { tr: 'Film, dizi, müzik', en: 'Movies, shows, music' },
    motivationAcademic: { tr: 'Akademik çalışma', en: 'Academic study' },
    motivationCurious: { tr: 'Sadece merak', en: 'Just curious' },

    // ─── STEP 3: DAILY GOAL (sadece dakika) ───
    goalTitle: { tr: 'Günde ne kadar vaktin var?', en: 'How much time per day?' },
    goalSubtitle: { tr: 'Hedefini sonradan ayarlardan değiştirebilirsin', en: 'You can change this later in settings' },
    goalCasual: { tr: 'Rahat', en: 'Casual' },
    goalNormal: { tr: 'Normal', en: 'Normal' },
    goalSerious: { tr: 'Ciddi', en: 'Serious' },
    goalIntense: { tr: 'Yoğun', en: 'Intense' },
    goalMinutesCasual: { tr: '~5 dk', en: '~5 min' },
    goalMinutesNormal: { tr: '~10 dk', en: '~10 min' },
    goalMinutesSerious: { tr: '~15 dk', en: '~15 min' },
    goalMinutesIntense: { tr: '~25 dk', en: '~25 min' },
    goalMascotDefault: { tr: 'Bir hedef seç — sana göre bir program hazırlayayım 🐦', en: 'Pick a goal — I will tailor it for you 🐦' },
    goalMascotCasual: { tr: 'Yavaş ama emin adımlarla 🌱', en: 'Slow and steady 🌱' },
    goalMascotNormal: { tr: 'Tam kıvamında bir hedef ⚡', en: 'Just the right balance ⚡' },
    goalMascotSerious: { tr: 'Sıkı çalışacağız, kabul mü? 💪', en: "We'll work hard, deal? 💪" },
    goalMascotIntense: { tr: 'Vay, hedefin büyük! 🚀', en: 'Wow, big goal! 🚀' },

    // ─── STEP 4: MINI TASTER ───
    tasterTitle: { tr: 'İlk Almanca kelime!', en: 'Your first German word!' },
    tasterSubtitle: { tr: 'Hadi tahmin et', en: 'Take a guess' },
    tasterQuestion: { tr: '"Hallo" ne demek?', en: 'What does "Hallo" mean?' },
    tasterOption1: { tr: 'Merhaba', en: 'Hello' },
    tasterOption2: { tr: 'Güle güle', en: 'Goodbye' },
    tasterOption3: { tr: 'Teşekkürler', en: 'Thank you' },
    tasterOption4: { tr: 'Lütfen', en: 'Please' },
    tasterCorrect: { tr: 'Müthişsin! 🎉 Sen zaten hazırsın', en: 'Awesome! 🎉 You are ready' },
    tasterWrong: { tr: 'Yaklaştın! Doğru cevap: Merhaba 👋', en: 'Close! Correct: Hello 👋' },
    tasterContinue: { tr: 'Devam', en: 'Continue' },

    // ─── STEP 5: NOTIFICATIONS ───
    notificationsTitle: { tr: 'Sana hatırlatma yapalım mı?', en: 'Can we send you reminders?' },
    notificationsSubtitle: {
      tr: 'Vogel gün içinde rastgele zamanlarda seni dürter — bunaltmadan',
      en: 'Vogel nudges you at random times during the day — not annoying',
    },
    notificationsEnable: { tr: 'Evet, hatırlatma yap', en: 'Yes, send reminders' },
    notificationsLater: { tr: 'Şimdi değil', en: 'Not now' },
    notificationsBenefit1: { tr: 'Serini koru', en: 'Keep your streak' },
    notificationsBenefit2: { tr: 'Pratik yapmayı unutma', en: "Don't forget to practice" },
    notificationsBenefit3: { tr: 'Sadece günde 1-2 mesaj', en: 'Only 1-2 messages a day' },

    // ─── STEP 6: KIŞİSEL ÖZET ───
    summaryTitle: { tr: 'Senin Vogel Yolculuğun', en: 'Your Vogel Journey' },
    summarySubtitle: { tr: 'Sana özel hazırladık', en: 'Tailored just for you' },
    summaryMotivationTitle: { tr: 'Hedeflerin', en: 'Your goals' },
    summaryRoutineTitle: { tr: 'Günlük rutinin', en: 'Your daily routine' },
    summaryRoutineDesc: { tr: 'Her gün yaklaşık {minutes} dakika', en: 'About {minutes} minutes per day' },
    summaryEtaTitle: { tr: 'A2 seviyesine tahmini', en: 'Estimated time to A2' },
    summaryEtaWeeks: { tr: '~{weeks} hafta', en: '~{weeks} weeks' },
    summaryEtaFast: { tr: 'Hızlı ilerleyeceksin 🚀', en: "You'll progress fast 🚀" },
    summaryEtaModerate: { tr: 'Dengeli bir tempo ⚡', en: 'A steady pace ⚡' },
    summaryEtaSlow: { tr: 'Sağlam adımlarla 🌱', en: 'Solid steady steps 🌱' },
    summaryNotificationsOn: { tr: 'Bildirimler açık 🔔', en: 'Notifications on 🔔' },
    summaryNotificationsOff: { tr: 'Bildirimler kapalı', en: 'Notifications off' },
    summaryMascot: {
      tr: 'Birlikte harika bir yolculuk olacak. Hadi başlayalım! 🐦',
      en: "We'll have a great journey together. Let's start! 🐦",
    },
    summaryStartButton: { tr: 'HADİ BAŞLAYALIM 🚀', en: "LET'S START 🚀" },

    // ─── Motivasyon özet mesajları (Step 6'da kart içinde) ───
    summaryTravel: { tr: 'Otel, ulaşım ve yemek dili — yolda işine yarayacak', en: 'Hotels, transit and food talk — your travel companion' },
    summaryWork: { tr: 'Profesyonel diyaloglar ve iş kelimeleri', en: 'Professional dialogue and work vocabulary' },
    summaryFamily: { tr: 'Sevdiklerinle iletişim kurabilmek için', en: 'To connect with your loved ones' },
    summaryMedia: { tr: 'Film ve diziler altyazısız keyifli olacak', en: 'Movies and shows without subtitles' },
    summaryAcademic: { tr: 'Akademik metinler ve formal dil', en: 'Academic texts and formal language' },
    summaryCurious: { tr: 'Yeni bir dünya, yeni bir bakış açısı', en: 'A new world, a new perspective' },
  },

  // 🔄 Tekrar Merkezi (SM-2 Spaced Repetition)
  review: {
    // Boş durum: hiç tekrar yok
    emptyTitle: { tr: 'Bütün tekrarlar tamam!', en: 'All caught up!' },
    emptySubtitle: {
      tr: 'Henüz tekrar bekleyen kelime yok. Önce birkaç ders yap.',
      en: 'No words waiting for review. Complete a few lessons first.',
    },

    // Tamamlanma ekranı
    completeTitle: { tr: 'Harika iş!', en: 'Great job!' },
    completeSubtitle: { tr: '{count} kelimeyi tekrar ettin', en: 'You reviewed {count} words' },
    statCorrect: { tr: 'DOĞRU', en: 'CORRECT' },
    statWrong: { tr: 'YANLIŞ', en: 'WRONG' },
    statAccuracy: { tr: 'BAŞARI', en: 'ACCURACY' },

    // Flashcard etiketleri
    cardLabelSource: { tr: 'TÜRKÇE', en: 'TURKISH' },
    cardLabelTarget: { tr: 'ALMANCA', en: 'GERMAN' },
    cardHint: {
      tr: 'Almancasını düşün, sonra cevabı gör',
      en: 'Think of the German, then reveal',
    },
    showAnswer: { tr: 'Cevabı Göster', en: 'Show Answer' },
    tapToHear: { tr: 'Sesi için dokun', en: 'Tap to hear' },
    judgeWrong: { tr: 'Hatırlamadım', en: "Didn't know" },
    judgeCorrect: { tr: 'Biliyordum', en: 'Knew it' },

    // Map ekranı banner (>= 3 kelime due ise görünür)
    bannerTitle: { tr: '{count} kelime tekrar bekliyor', en: '{count} words ready for review' },
    bannerSubtitle: {
      tr: 'Aklında kalması için zamanı gelen kelimeler',
      en: 'Words due for review to keep them fresh',
    },
    bannerCta: { tr: 'Tekrarı başlat — {count} kelime', en: 'Start review — {count} words' },
  },

  // Daily goal
  dailyGoal: {
    title: { tr: 'Günlük Hedef', en: 'Daily Goal' },
    todayProgress: { tr: 'Bugünkü İlerlemen', en: "Today's Progress" },
    streakTitle: { tr: 'Günlük Seri', en: 'Daily Streak' },
    streakDesc: { tr: 'Her gün ders yaparak serini koru', en: 'Keep your streak by practicing daily' },
  },

  // No hearts
  noHearts: {
    title: { tr: 'Canların Bitti!', en: 'Out of Hearts!' },
    subtitle: {
      tr: 'Devam etmek için canların yenilenmesini bekle veya hemen yenile.',
      en: 'Wait for hearts to refill or refill now to continue.',
    },
    waitText: { tr: 'Sonraki can: {time}', en: 'Next heart: {time}' },
    refillNow: { tr: '450 XP ile YENİLE', en: 'REFILL with 450 XP' },
    goShop: { tr: 'Markete Git', en: 'Go to Shop' },
    backHome: { tr: 'Ana Ekrana Dön', en: 'Back to Home' },
    getPlus: { tr: '💎 VOGEL PLUS — Sınırsız Can', en: '💎 VOGEL PLUS — Unlimited Hearts' },
    plusBenefit: { tr: 'Sınırsız can · Reklamsız · Tüm seviyeler', en: 'Unlimited hearts · No ads · All levels' },
  },

  // Paywall (3. ders sonrası modal)
  paywall: {
    badge: { tr: '🎉 3. dersinizi bitirdiniz!', en: '🎉 You finished your 3rd lesson!' },
    title: { tr: 'Gerçek öğrenme başlıyor', en: 'Real learning starts here' },
    subtitle: {
      tr: 'Sınırsız can, reklamsız öğrenme. Durmak yok.',
      en: 'Unlimited hearts, no ads. Never stop learning.',
    },
    feature1: { tr: '♾️  Sınırsız can', en: '♾️  Unlimited hearts' },
    feature2: { tr: '🚫  Reklam yok', en: '🚫  No ads' },
    feature3: { tr: '📚  Tüm seviyelere erişim', en: '📚  Access to all levels' },
    feature4: { tr: '⚡  Öncelikli destek', en: '⚡  Priority support' },
    cta: { tr: 'VOGEL PLUS\'I GÖR', en: 'SEE VOGEL PLUS' },
    dismiss: { tr: 'Hayır, teşekkürler', en: 'No thanks' },
  },

  // Streak Calendar
  streakCalendar: {
    title: { tr: 'Seri Takvimi', en: 'Streak Calendar' },
    subtitle: { tr: 'Son 7 gün', en: 'Last 7 days' },
    unit: { tr: 'günlük seri', en: 'day streak' },
    keepGoing: { tr: 'Devam et, harikasın!', en: 'Keep going, awesome!' },
    startToday: { tr: 'Bugün başla 💪', en: 'Start today 💪' },
    dayMon: { tr: 'Pzt', en: 'Mon' },
    dayTue: { tr: 'Sal', en: 'Tue' },
    dayWed: { tr: 'Çar', en: 'Wed' },
    dayThu: { tr: 'Per', en: 'Thu' },
    dayFri: { tr: 'Cum', en: 'Fri' },
    daySat: { tr: 'Cmt', en: 'Sat' },
    daySun: { tr: 'Paz', en: 'Sun' },
  },

  // Daily Quest Panel
  dailyQuestPanel: {
    title: { tr: 'Günlük Görevler', en: 'Daily Quests' },
    rewardXp: { tr: '+{n} XP ödül', en: '+{n} XP reward' },
    openChest: { tr: '🎁 SANDIĞI AÇ', en: '🎁 OPEN CHEST' },
    claimed: { tr: '✓ Ödül alındı', en: '✓ Reward claimed' },
  },

  // Level Up Screen
  levelUp: {
    title: { tr: 'SEVİYE ATLADIN!', en: 'LEVEL UP!' },
    subtitle: { tr: 'Seviye {n}\'e yükseldin', en: 'You leveled up to {n}' },
    continue: { tr: 'DEVAM', en: 'CONTINUE' },
  },

  // Achievements
  achievements: {
    title: { tr: 'Başarılar', en: 'Achievements' },
    summary: { tr: '{unlocked}/{total} rozet açıldı', en: '{unlocked}/{total} badges unlocked' },
    viewAll: { tr: 'Tümünü gör', en: 'View all' },
    locked: { tr: 'Kilitli', en: 'Locked' },
    unlocked: { tr: 'Açıldı', en: 'Unlocked' },
    newUnlock: { tr: 'Yeni rozet açıldı!', en: 'New achievement unlocked!' },
    // Rozet başlıkları ve açıklamaları
    firstLessonTitle: { tr: 'İlk Adım', en: 'First Step' },
    firstLessonDesc: { tr: 'İlk dersini tamamladın', en: 'Complete your first lesson' },
    tenLessonsTitle: { tr: 'İstikrar', en: 'Consistent' },
    tenLessonsDesc: { tr: '10 ders tamamladın', en: 'Complete 10 lessons' },
    fiftyLessonsTitle: { tr: 'Marathon', en: 'Marathon' },
    fiftyLessonsDesc: { tr: '50 ders tamamladın', en: 'Complete 50 lessons' },
    hundredLessonsTitle: { tr: 'Usta', en: 'Master' },
    hundredLessonsDesc: { tr: '100 ders tamamladın', en: 'Complete 100 lessons' },
    streak3Title: { tr: 'Alışkanlık', en: 'Habit Forming' },
    streak3Desc: { tr: '3 günlük seri', en: '3 day streak' },
    streak7Title: { tr: 'Haftalık', en: 'Weekly Champion' },
    streak7Desc: { tr: '7 günlük seri', en: '7 day streak' },
    streak30Title: { tr: 'Aylık Efsane', en: 'Monthly Legend' },
    streak30Desc: { tr: '30 günlük seri', en: '30 day streak' },
    xp100Title: { tr: 'Başlangıç', en: 'Beginner' },
    xp100Desc: { tr: '100 XP kazandın', en: 'Earn 100 XP' },
    xp1000Title: { tr: 'XP Avcısı', en: 'XP Hunter' },
    xp1000Desc: { tr: '1000 XP kazandın', en: 'Earn 1000 XP' },
    xp5000Title: { tr: 'XP Şampiyonu', en: 'XP Champion' },
    xp5000Desc: { tr: '5000 XP kazandın', en: 'Earn 5000 XP' },
    a1CompleteTitle: { tr: 'A1 Bitirdi', en: 'A1 Complete' },
    a1CompleteDesc: { tr: 'A1 seviyesini tamamladın', en: 'Complete A1 level' },
    a2CompleteTitle: { tr: 'A2 Bitirdi', en: 'A2 Complete' },
    a2CompleteDesc: { tr: 'A2 seviyesini tamamladın', en: 'Complete A2 level' },
    b1CompleteTitle: { tr: 'B1 Bitirdi', en: 'B1 Complete' },
    b1CompleteDesc: { tr: 'B1 seviyesini tamamladın', en: 'Complete B1 level' },
    perfectLessonTitle: { tr: 'Mükemmel Ders', en: 'Perfect Lesson' },
    perfectLessonDesc: { tr: 'Hatasız bir ders bitir', en: 'Finish a lesson without mistakes' },
    firstPurchaseTitle: { tr: 'İlk Alışveriş', en: 'First Purchase' },
    firstPurchaseDesc: { tr: 'Markette ilk alışverişini yaptın', en: 'Make your first shop purchase' },
    premiumTitle: { tr: 'VIP Üye', en: 'VIP Member' },
    premiumDesc: { tr: 'Premium\'a yükseltin', en: 'Upgrade to Premium' },
    completeQuestTitle: { tr: 'Görev Avcısı', en: 'Quest Hunter' },
    completeQuestDesc: { tr: 'İlk günlük görevi tamamla', en: 'Complete first daily quest' },
  },

  // Grammar Tip
  grammarTip: {
    title: { tr: 'Gramer İpucu', en: 'Grammar Tip' },
    gotIt: { tr: 'Anladım', en: 'Got it' },
  },

  // Recommended lesson
  recommended: {
    title: { tr: 'Önerilen Ders', en: 'Recommended Lesson' },
    cta: { tr: 'Devam Et', en: 'Continue' },
  },

  // Streak banner
  streakBanner: {
    keepIt: { tr: '🔥 Serini koru!', en: '🔥 Keep your streak!' },
    days: { tr: '{n} gündür aktifsin', en: 'Active for {n} days' },
  },

  // Next level
  nextLevel: {
    completed: { tr: 'Bu seviye tamam!', en: 'Level complete!' },
    continueCta: { tr: 'Sonraki seviye: {level} →', en: 'Next level: {level} →' },
  },

  // Reminders
  reminder: {
    title: { tr: 'Akıllı Hatırlatmalar', en: 'Smart Reminders' },
    subtitle: { tr: 'Vogel seni doğru zamanda dürtsün', en: 'Let Vogel nudge you at the right time' },
    enable: { tr: 'Aç', en: 'Enable' },
    notInstalled: {
      tr: 'Bildirim paketi kurulu değil. Terminalde "npx expo install expo-notifications" çalıştır.',
      en: 'Notifications package not installed. Run "npx expo install expo-notifications".',
    },
    expoGoUnsupported: {
      tr: 'Expo Go\'da bildirimler kısıtlı. Tam destek için: "npx expo prebuild" sonra "npx expo run:android".',
      en: 'Limited in Expo Go. For full support: "npx expo prebuild" then "npx expo run:android".',
    },
    permissionDenied: { tr: 'Bildirim izni reddedildi. Telefon ayarlarından açabilirsin.', en: 'Notification permission denied. You can enable it from phone settings.' },
    activeStatus: { tr: 'Aktif — gün içinde random zamanlarda seni dürtecek 🐦', en: 'Active — Vogel will nudge you throughout the day 🐦' },
    testButton: { tr: '🔔 Test Bildirimi Gönder', en: '🔔 Send Test Notification' },
    testSent: { tr: '5 saniye sonra bildirim gelecek (uygulamayı arkaya alabilirsin)', en: 'A notification will arrive in 5 seconds (you can background the app)' },
    testFailed: { tr: 'Test bildirimi gönderilemedi', en: 'Failed to send test notification' },
    expoGoInfo: {
      tr: 'Expo Go\'da yerel bildirimler çalışmalı. Production APK\'da tam destek olur.',
      en: 'Local notifications should work in Expo Go. Full support in production APK.',
    },
  },

  // Smart reminder mesajları — TITLE|BODY formatı.
  // notifications.ts pipe ile ayırır: solu title (kalın+büyük), sağı body.
  // Her açılışta random seçilir.
  smartReminder: {
    // ────── SABAH (9:00-12:00) — Pozitif, çağrıcı ──────
    morning1: { tr: '☀️ Günaydın!|Beş dakika yeter. Hadi başla.', en: '☀️ Good morning!|Five minutes is all it takes.' },
    morning2: { tr: '🌅 Yeni güne hoş geldin|Bugün öğreneceğin kelime, yarın söyleyeceğin cümle.', en: '🌅 Welcome to a new day|Today\'s word is tomorrow\'s sentence.' },
    morning3: { tr: '☕ Kahveni alıp gel|Hızlı bir ders mükemmel bir başlangıç.', en: '☕ Grab your coffee|One quick lesson — the perfect start.' },
    morning4: { tr: '⚡ Günü güçlü başlat|Tek bir ders, tüm güne enerji.', en: '⚡ Start strong|One lesson powers your whole day.' },
    morning5: { tr: '🚀 Bugün hangi kelime?|Yeni bir kelime, yeni bir kapı.', en: '🚀 Which word today?|A new word opens a new door.' },
    morning6: { tr: '🇩🇪 Ich lerne jeden Tag|Sen de aramıza katıl. Bir ders açık.', en: '🇩🇪 Ich lerne jeden Tag|Join the club — one lesson waiting.' },
    morning7: { tr: '🐦 Vogel uyandı|Sen de gel, beraber uçalım.', en: '🐦 Vogel is awake|Come fly with us.' },
    morning8: { tr: '🌱 Küçük adım, büyük yol|Bugün de bir adım at.', en: '🌱 Small step, long road|Take one more today.' },

    // ────── AKŞAM (18:00-22:00) — Streak FOMO + son şans ──────
    evening1: { tr: '🔥 Streak\'in tehlikede!|Beş dakikalık bir ders ile günü kurtar.', en: '🔥 Your streak is at risk!|Save the day with one quick lesson.' },
    evening2: { tr: '🥺 Vogel seni özledi|Bir derste görüşelim mi?', en: '🥺 Vogel misses you|Meet in a lesson?' },
    evening3: { tr: '⏰ Gece yarısı yaklaşıyor|Bugün hiç ders yapmadın. Sıkı bir ders, hızlı bir akşam.', en: '⏰ Midnight approaches|No lesson today yet. Fix it fast.' },
    evening4: { tr: '🔥 Seriyi BIRAKMA|Bugünkü altın kalbi koru.', en: '🔥 Don\'t break the streak|Protect today\'s golden flame.' },
    evening5: { tr: '⚡ Yarın değil, BUGÜN|Bir ders ile günü zaferle kapat.', en: '⚡ Not tomorrow — TODAY|Close the day with victory.' },
    evening6: { tr: '🌟 Tek kelime bile yeter|Pratik atlamadan günü bitirme.', en: '🌟 Even one word counts|Don\'t end the day without practice.' },
    evening7: { tr: '⚡ XP hedefin var mı?|Tamamla, ödüller seni bekliyor.', en: '⚡ Got an XP goal?|Finish it — rewards await.' },
    evening8: { tr: '🌙 Yatmadan 5 dakika|Uyurken beynin tekrar eder. Bilimsel gerçek.', en: '🌙 5 minutes before bed|Your brain will rehearse it as you sleep.' },

    // ────── MOTIVASYON-SPESİFİK ──────

    // 🌍 Seyahat
    travel_morning_1: { tr: '✈️ Bugün Berlin\'desin (zihnen)|Bir seyahat cümlesi öğren, valizi hazır.', en: '✈️ Berlin today (in your mind)|Learn one travel phrase, pack the bag.' },
    travel_morning_2: { tr: '🗺️ Yolculuk Almanca konuşur|Yeni bir şehir, yeni bir cümle.', en: '🗺️ Travel speaks German|New city, new sentence.' },
    travel_morning_3: { tr: '☕ Kahvaltı sipariş et|"Ein Kaffee, bitte." Ezberle, kullan.', en: '☕ Order breakfast|"Ein Kaffee, bitte." Learn it, use it.' },
    travel_evening_1: { tr: '🏖️ Sonraki tatil = Almanya?|Hazırlık şimdi başlar. Beş dakika.', en: '🏖️ Next trip = Germany?|Prep starts now. 5 minutes.' },
    travel_evening_2: { tr: '📍 "Wo ist...?" gücü|Kaybolmamak için bugün öğren.', en: '📍 The power of "Wo ist...?"|Learn it tonight — never get lost.' },
    travel_evening_3: { tr: '💶 "Wie viel kostet das?"|Bugün öğren, alışverişte kullan.', en: '💶 "Wie viel kostet das?"|Learn tonight, use it shopping.' },

    // 💼 İş
    work_morning_1: { tr: '💼 CV\'nde "Deutsch B1"|Yolun başındasın. Bir ders.', en: '💼 "Deutsch B1" on your CV|You\'re on your way. One lesson.' },
    work_morning_2: { tr: '⚡ İşe gitmeden 5 dk|Profesyonel beynin teşekkür edecek.', en: '⚡ 5 mins before work|Your professional brain will thank you.' },
    work_morning_3: { tr: '👋 Guten Morgen, Kollegen!|Yarın bunu söyleyebilmek için bugün pratik.', en: '👋 Guten Morgen, Kollegen!|Practice today, use it tomorrow.' },
    work_evening_1: { tr: '📈 Bugünü kapatırken|Bir iş kelimesi — yarın masada işine yarar.', en: '📈 As you wrap up|One word for tomorrow\'s desk.' },
    work_evening_2: { tr: '📊 Almanca business email?|Yapı öğrenmenin tam zamanı.', en: '📊 German business email?|Perfect time to learn the structure.' },
    work_evening_3: { tr: '💼 Kariyere 5 dakika|Bu yatırım faiz getirir. Söz.', en: '💼 5 mins for your career|This investment compounds. Promise.' },

    // ❤️ Aile
    family_morning_1: { tr: '❤️ Sevdiklerine|Bir cümle daha, bir adım daha yakın.', en: '❤️ For your loved ones|One sentence closer.' },
    family_morning_2: { tr: '💕 "Ich liebe dich"|Bugün öğren, bu akşam söyle.', en: '💕 "Ich liebe dich"|Learn today, say tonight.' },
    family_morning_3: { tr: '🌹 Sürpriz cümle hazırla|Onlara Almanca söyle, ışıldasınlar.', en: '🌹 Surprise phrase ready|Say it in German — watch them glow.' },
    family_evening_1: { tr: '🍲 Aile sofrası özlemini|Bir kelime daha Almanca\'yla doldur.', en: '🍲 Missing family dinner?|Fill it with one more German word.' },
    family_evening_2: { tr: '👪 "Familie" kelimeleri|Bugün öğren, yarın yakınla paylaş.', en: '👪 "Familie" words|Learn today, share tomorrow.' },
    family_evening_3: { tr: '🐦 Kuşlar yuvaya döner|Sen de Vogel\'a. 5 dk yeter.', en: '🐦 Birds fly home|You fly to Vogel. 5 mins.' },

    // 🎬 Film/Dizi/Müzik
    media_morning_1: { tr: '🎵 Bir Alman şarkısı|Bugün anlam çözmenin sırası.', en: '🎵 A German song|Time to crack the meaning.' },
    media_morning_2: { tr: '🎬 Altyazısız Netflix|Hedef o. Bir adım daha yakınsın.', en: '🎬 Netflix without subs|That\'s the goal. One step closer.' },
    media_morning_3: { tr: '🎸 Rammstein anlamaya|Bir kelime daha. Devam et.', en: '🎸 Understanding Rammstein|One more word. Keep going.' },
    media_evening_1: { tr: '🍿 Almanca film akşamı?|Önce hızlı bir ders, sonra koltuk.', en: '🍿 German movie night?|Quick lesson first, then the couch.' },
    media_evening_2: { tr: '🎥 Diziyi anlama|Az önce duyduğun kelimeyi bul.', en: '🎥 Crack that show|Find that word you just heard.' },
    media_evening_3: { tr: '🎧 Playlist\'in tatlı|Almanca\'yla daha tatlı olacak.', en: '🎧 Your playlist is sweet|German makes it sweeter.' },

    // 📚 Akademik
    academic_morning_1: { tr: '📚 Akademisyen modu|Beyin uyandı, bir ders zamanı.', en: '📚 Scholar mode on|Brain\'s awake — lesson time.' },
    academic_morning_2: { tr: '📖 Almanca akademik metin|Bir kelime daha yakınsın.', en: '📖 German academic text|One word closer.' },
    academic_morning_3: { tr: '🎓 Bilim Almanca konuşur|Yakında sen de.', en: '🎓 Science speaks German|Soon you will too.' },
    academic_evening_1: { tr: '📝 Bir formal yapı|Bugün öğren, yarın yazına ekle.', en: '📝 One formal structure|Learn tonight, add to your writing.' },
    academic_evening_2: { tr: '📈 5 dakika bugün|5 hafta sonra "vay be" diyeceksin.', en: '📈 5 minutes today|In 5 weeks you\'ll say "wow".' },
    academic_evening_3: { tr: '📄 Almanca tezler|Artık erişilemez değil. Devam.', en: '📄 German theses|No longer out of reach.' },

    // 🧠 Merak
    curious_morning_1: { tr: '🌍 Yeni bir dünya seni bekliyor|Hadi keşfet.', en: '🌍 A new world awaits|Go explore.' },
    curious_morning_2: { tr: '🧠 Beynine yeni yapı|Almanca = nöral spor salonu.', en: '🧠 New brain structure|German = mental gym.' },
    curious_morning_3: { tr: '🔍 5 dakikalık keşif|Yeni kelimeler, yeni dünyalar.', en: '🔍 5-min discovery|New words, new worlds.' },
    curious_evening_1: { tr: '✨ Bugün ne öğrendin?|Bir tane daha ekle, daha güzel uyu.', en: '✨ What did you learn?|Add one more, sleep better.' },
    curious_evening_2: { tr: '🍬 Yeni kelime tadı|Bir öğrenme + bir tatmin.', en: '🍬 The taste of a new word|One learn, one satisfaction.' },
    curious_evening_3: { tr: '🏘️ Beyninde yeni mahalle|Almanca buraya taşınıyor.', en: '🏘️ A new neighborhood in your brain|German moves in tonight.' },
  },

  // ── Seviyeler ─────────────────────────────────────────────────
  levels: {
    title: { tr: 'Seviyeler', en: 'Levels' },
    subtitle: { tr: 'Almanca seviyene göre çalış. Her seviye en sık kullanılan kelimelerden oluşur — sınava hazırlanmanın en hızlı yolu.', en: 'Study German by your level. Each level is built from the most frequent words — the fastest way to prepare for an exam.' },
    wordCount: { tr: '{count} kelime', en: '{count} words' },
    progress: { tr: '{learned} / {total} öğrenildi', en: '{learned} / {total} learned' },
    examBest: { tr: '🏅 En iyi deneme: %{percent}', en: '🏅 Best test: {percent}%' },
    studyShort: { tr: 'Kartlar', en: 'Cards' },
    examShort: { tr: 'Deneme', en: 'Test' },
    descriptions: {
      A1: { tr: 'Başlangıç — günlük temel kelimeler', en: 'Beginner — essential everyday words' },
      A2: { tr: 'Temel — genişletilmiş günlük kelimeler', en: 'Elementary — extended everyday vocabulary' },
      B1: { tr: 'Orta — daha geniş ve akıcı dil', en: 'Intermediate — broader, more fluent language' },
      B2: { tr: 'Orta-üstü — soyut konular ve zengin söz dağarcığı', en: 'Upper-intermediate — abstract topics and rich vocabulary' },
      C1: { tr: 'İleri — karmaşık metinler ve akıcı, ileri düzey dil', en: 'Advanced — complex texts and fluent, advanced language' },
    },
    homeCard: {
      badge: { tr: 'SINAVA HAZIRLIK', en: 'EXAM PREP' },
      title: { tr: 'Goethe & telc Sınavlarına Hazırlan', en: 'Prepare for the Goethe & telc Exams' },
      subtitle: { tr: 'Gerçek sınav formatında pratik yap, seviyeni yükselt', en: 'Practise in real exam format and level up' },
      cta: { tr: 'Başla', en: 'Start' },
    },
  },

  // ── Deneme Sınavı ─────────────────────────────────────────────
  exam: {
    title: { tr: '{level} Deneme', en: '{level} Test' },
    question: { tr: 'Soru {current} / {total}', en: 'Question {current} / {total}' },
    vocabPrompt: { tr: 'Bu kelimenin Türkçe karşılığı?', en: 'What is the Turkish meaning?' },
    listenPrompt: { tr: 'Dinle ve doğru anlamı seç', en: 'Listen and pick the correct meaning' },
    readPrompt: { tr: 'Metne göre cevapla:', en: 'Answer based on the text:' },
    articlePrompt: { tr: 'Bu isim hangi artikeli alır?', en: 'Which article does this noun take?' },
    replay: { tr: 'Tekrar dinlemek için dokun', en: 'Tap to listen again' },
    section: {
      vocab: { tr: 'Bölüm 1 · Kelime', en: 'Part 1 · Vocabulary' },
      listening: { tr: 'Bölüm 2 · Dinleme', en: 'Part 2 · Listening' },
      reading: { tr: 'Bölüm 3 · Okuma', en: 'Part 3 · Reading' },
      grammar: { tr: 'Bölüm 4 · Dil Bilgisi', en: 'Part 4 · Grammar' },
    },
    empty: { tr: 'Bu seviyede sınav için yeterli kelime yok.', en: 'Not enough words in this level for a test.' },
    result: {
      passedTitle: { tr: 'Tebrikler, geçtin!', en: 'Congratulations, you passed!' },
      failedTitle: { tr: 'Az kaldı — biraz daha çalış', en: 'Almost there — keep practising' },
      score: { tr: '{correct} / {total} doğru', en: '{correct} / {total} correct' },
      percent: { tr: '%{percent} başarı', en: '{percent}% score' },
      retry: { tr: 'Tekrar Dene', en: 'Try Again' },
      study: { tr: 'Bu Seviyeyi Çalış', en: 'Study This Level' },
      back: { tr: 'Seviyelere Dön', en: 'Back to Levels' },
    },
  },

  // ── Flashcard'lar ─────────────────────────────────────────────
  flashcards: {
    score: {
      know: { tr: 'Biliyorum', en: 'Know' },
      hard: { tr: 'Öğrendim', en: 'Learned' },
      again: { tr: 'Tekrar', en: 'Again' },
    },
    card: {
      tapToReveal: { tr: 'GÖRMEK İÇİN DOKUN', en: 'TAP TO REVEAL' },
      definition: { tr: 'TANIM', en: 'DEFINITION' },
      know: { tr: 'BİLİYORUM', en: 'KNOW' },
      learned: { tr: 'ÖĞRENDİM', en: 'LEARNED' },
      again: { tr: 'TEKRAR', en: 'AGAIN' },
    },
    results: {
      excellent: { tr: 'Mükemmel bir seans!', en: 'Excellent session!' },
      good: { tr: 'İyi gidiyorsun!', en: 'Good progress!' },
      keepGoing: { tr: 'Çalışmaya devam!', en: 'Keep practising!' },
      summary: { tr: '{total} kart · {correct} doğru', en: '{total} cards · {correct} correct' },
      accuracy: { tr: 'Bu seansta %{accuracy} doğruluk', en: '{accuracy}% accuracy this session' },
      wordsLearned: { tr: '{count} kelime öğrenildi', en: '{count} words learned' },
      thisSession: { tr: 'Bu seans', en: 'This session' },
      practiceAgain: { tr: 'Tekrar Çalış', en: 'Practice Again' },
      backHome: { tr: 'Ana Sayfaya Dön', en: 'Back to Home' },
    },
    limit: {
      title: { tr: 'Bugünlük çalışma\nbitti 🎯', en: "Today's practice\nis done 🎯" },
      body: { tr: 'Ücretsiz planda günde {limit} seans çalışabilirsin. Sınırsız çalışmak için Premium\'a geç.', en: 'The free plan includes {limit} sessions per day. Upgrade to Premium for unlimited practice.' },
      quota: { tr: '{used}/{total} seans tamamlandı', en: '{used}/{total} sessions completed' },
      benefitsTitle: { tr: 'PREMIUM İLE AÇILIR', en: 'PREMIUM UNLOCKS' },
      benefit1: { tr: 'Sınırsız kart pratiği', en: 'Unlimited flashcard practice' },
      benefit2: { tr: 'Goethe & telc sınav hazırlığı', en: 'Goethe & telc exam prep' },
      benefit3: { tr: 'Sınırsız AI açıklaması', en: 'Unlimited AI explanations' },
      cta: { tr: "Premium'a Geç", en: 'Go Premium' },
      back: { tr: 'Yarın tekrar dene', en: 'Come back tomorrow' },
    },
  },

  // ── Kelime Detay ──────────────────────────────────────────────
  word: {
    audioHint: { tr: 'Telaffuzu dinlemek için dokun', en: 'Tap to hear pronunciation' },
    audioPlaying: { tr: 'Çalınıyor…', en: 'Playing…' },
    sections: {
      meanings: { tr: 'Anlamlar', en: 'Meanings' },
      examples: { tr: 'Örnekler', en: 'Examples' },
      synonyms: { tr: 'Eş Anlamlılar', en: 'Synonyms' },
      antonyms: { tr: 'Zıt Anlamlılar', en: 'Antonyms' },
      conjugation: { tr: 'Çekim', en: 'Conjugation' },
    },
    tense: {
      present: { tr: 'Şimdiki', en: 'Present' },
      past: { tr: 'Geçmiş', en: 'Past' },
      future: { tr: 'Gelecek', en: 'Future' },
    },
    verb: {
      regular: { tr: 'düzenli fiil', en: 'regular verb' },
      irregular: { tr: 'düzensiz fiil', en: 'irregular verb' },
      example: { tr: 'Örnek cümle', en: 'Example sentence' },
    },
    verbCase: {
      title: { tr: 'Hâl Durumu (Rektion)', en: 'Case Government (Rektion)' },
      akkusativ: { tr: 'Akkusativ alır', en: 'Takes Accusative' },
      dativ: { tr: 'Dativ alır', en: 'Takes Dative' },
      dativAkkusativ: { tr: 'Dativ + Akkusativ alır', en: 'Takes Dative + Accusative' },
      genitiv: { tr: 'Genitiv alır', en: 'Takes Genitive' },
      akkusativDesc: { tr: 'Bu fiilin nesnesi -i hâlinde (Akkusativ) çekilir. Tipik örüntü (sehen ile): „Ich sehe den Mann."', en: 'This verb\'s object is in the Accusative case. Typical pattern (with sehen): "Ich sehe den Mann."' },
      dativDesc: { tr: 'Bu fiilin nesnesi -e hâlinde (Dativ) çekilir. Tipik örüntü (helfen ile): „Ich helfe dem Mann."', en: 'This verb\'s object is in the Dative case. Typical pattern (with helfen): "Ich helfe dem Mann."' },
      dativAkkusativDesc: { tr: 'Bu fiil iki nesne alır: kişi -e hâlinde (Dativ), nesne -i hâlinde (Akkusativ). Tipik örüntü (geben ile): „Ich gebe dem Mann das Buch."', en: 'This verb takes two objects: the person in Dative, the thing in Accusative. Typical pattern (with geben): "Ich gebe dem Mann das Buch."' },
      genitivDesc: { tr: 'Bu fiilin nesnesi -in hâlinde (Genitiv) çekilir. Nadir ve daha resmidir. Tipik örüntü (gedenken ile): „Wir gedenken der Opfer."', en: 'This verb\'s object is in the Genitive case. Rare and more formal. Typical pattern (with gedenken): "Wir gedenken der Opfer."' },
    },
    error: {
      title: { tr: 'Kelime bulunamadı', en: 'Word not found' },
      withWord: { tr: '"{word}" için bir tanım bulamadık. Yazımı kontrol et veya başka bir kelime dene.', en: 'We couldn\'t find a definition for "{word}". Check the spelling or try another word.' },
      noWord: { tr: 'Aranacak bir kelime belirtilmedi.', en: 'No word was provided to look up.' },
    },
    didYouMean: {
      label: { tr: 'Bunu mu demek istedin?', en: 'Did you mean?' },
    },
    conjugationLocked: {
      title: { tr: 'Fiil Çekimleri Premium', en: 'Conjugations are Premium' },
      body: { tr: 'Bu fiilin tüm zamanlarda (Präsens, Präteritum, Perfekt…) çekim tablolarını Premium ile aç.', en: 'Unlock full conjugation tables for this verb across every tense (Präsens, Präteritum, Perfekt…) with Premium.' },
      cta: { tr: 'Premium ile Aç', en: 'Unlock with Premium' },
    },
  },

  // ── A1 Konuşma Simülatörü ─────────────────────────────────────
  sprechen: {
    title: { tr: 'A1 Konuşma Simülatörü', en: 'A1 Speaking Simulator' },
    subtitle: { tr: 'Goethe & telc A1 Sprechen sınavının üç bölümünü gerçek formatta dene.', en: 'Practise all three parts of the Goethe & telc A1 Sprechen exam in real format.' },
    intro: {
      badge: { tr: 'AI EXAMINER', en: 'AI EXAMINER' },
      title: { tr: 'A1 Sprechen prova zamanı', en: 'Time to rehearse A1 Sprechen' },
      subtitle: { tr: 'Üç bölüm, ~12 dakika. Yazılı cevap ver, Examiner geri bildirim verir.', en: 'Three parts, ~12 minutes. Type your answers, the examiner gives instant feedback.' },
      teil1Label: { tr: 'Bölüm 1 · Kendini tanıt', en: 'Part 1 · Introduce yourself' },
      teil1Desc: { tr: 'İsim, yaş, ülke, şehir, dil, meslek, hobi + heceleme + sayı söyleme.', en: 'Name, age, country, city, languages, job, hobby + spelling + numbers.' },
      teil2Label: { tr: 'Bölüm 2 · Tema & Kelime', en: 'Part 2 · Theme & Word' },
      teil2Desc: { tr: 'Üç farklı tema, her birinde iki kelime. Önce sen sor, sonra cevap ver.', en: 'Three themes, two words each. First you ask, then you answer.' },
      teil3Label: { tr: 'Bölüm 3 · Rica formülasyonu', en: 'Part 3 · Polite requests' },
      teil3Desc: { tr: 'Beş görsel kart. Her birine uygun, kibar bir rica kalıbı kur.', en: 'Five picture cards. Phrase a polite request that fits each image.' },
      tipTitle: { tr: '💡 Sınav günü ipucu', en: '💡 Exam-day tip' },
      tipBody: { tr: '3-4 düzgün cümle yeterli — istersen aile, evlilik ve çocuklar gibi konuları da ekleyebilirsin. Sınav arkadaşınla önceden pratik yaparsan büyük avantaj.', en: '3-4 clean sentences are enough — feel free to add family, marriage, or kids. Practising with your exam partner beforehand is a big advantage.' },
      start: { tr: 'Simülasyona başla', en: 'Start simulation' },
      premiumLock: { tr: '🔒 Premium — Konuşma Simülatörü', en: '🔒 Premium — Speaking Simulator' },
    },
    partLabel: {
      teil1: { tr: 'Bölüm 1 · Sich vorstellen', en: 'Part 1 · Sich vorstellen' },
      teil2: { tr: 'Bölüm 2 · Themen', en: 'Part 2 · Themen' },
      teil3: { tr: 'Bölüm 3 · Bitten', en: 'Part 3 · Bitten' },
    },
    progress: { tr: 'Soru {current} / {total}', en: 'Question {current} / {total}' },
    teil1: {
      categories: {
        name: { tr: 'İsim', en: 'Name' },
        alter: { tr: 'Yaş', en: 'Age' },
        land: { tr: 'Ülke', en: 'Country' },
        wohnort: { tr: 'Şehir', en: 'City' },
        sprachen: { tr: 'Diller', en: 'Languages' },
        beruf: { tr: 'Meslek', en: 'Job' },
        hobby: { tr: 'Hobi', en: 'Hobby' },
        familie: { tr: 'Aile', en: 'Family' },
        buchstabieren: { tr: 'Hecele', en: 'Spelling' },
        zahlen: { tr: 'Sayı söyle', en: 'Numbers' },
      },
      placeholder: { tr: 'Cevabını Almanca yaz…', en: 'Type your answer in German…' },
      hint: { tr: '💡 İpucu', en: '💡 Hint' },
      model: { tr: '📋 Örnek cevap', en: '📋 Model answer' },
    },
    teil2: {
      themeLabel: { tr: 'Tema', en: 'Theme' },
      wordLabel: { tr: 'Kelime', en: 'Word' },
      askPrompt: { tr: 'Bu kelimeyle bir soru kur. Sen soruyorsun.', en: "Form a question using this word. You're the one asking." },
      answerPrompt: { tr: 'Examiner soruyor — şimdi sen Almanca cevap ver.', en: 'The examiner is asking — answer in German.' },
      placeholderAsk: { tr: 'Sorunu Almanca yaz (ör. Was isst du zum Frühstück?)', en: 'Type your question in German (e.g. Was isst du zum Frühstück?)' },
      placeholderAnswer: { tr: 'Cevabını Almanca yaz…', en: 'Type your answer in German…' },
    },
    teil3: {
      prompt: { tr: 'Bu görsele uygun kibar bir rica kalıbı kur:', en: 'Phrase a polite request for this picture:' },
      placeholder: { tr: 'Rica cümleni Almanca yaz…', en: 'Type your request in German…' },
      partnerReplies: { tr: 'Examiner şöyle cevap verebilir:', en: 'Sample partner replies:' },
    },
    feedback: {
      great: { tr: '✅ Sehr gut!', en: '✅ Sehr gut!' },
      okay: { tr: '👍 Genau! Anlaşıldı.', en: '👍 Genau! Understood.' },
      tooShort: { tr: '🤏 Biraz daha uzun bir cümle gerek — en az 2 kelime.', en: '🤏 A bit longer please — at least 2 words.' },
      missing: { tr: '🔍 Cümlende anahtar kelime eksik. Aşağıdaki örneğe bak.', en: '🔍 A key word is missing. Look at the model below.' },
      model: { tr: '📋 Doğru kalıp', en: '📋 Model phrasing' },
      next: { tr: 'Devam et', en: 'Continue' },
    },
    mic: {
      tapToSpeak: { tr: '🎤 Konuşmak için dokun', en: '🎤 Tap to speak' },
      listening: { tr: '🔴 Dinliyorum… (durdurmak için tekrar dokun)', en: '🔴 Listening… (tap again to stop)' },
      permissionDenied: { tr: 'Mikrofon izni gerekiyor. Ayarlardan izin verip tekrar dene.', en: 'Microphone permission required. Allow it in Settings and try again.' },
      notAvailable: { tr: 'Sesli giriş bu test ortamında çalışmaz — TestFlight veya yüklenmiş APK ile aktif olur. Şimdilik yazılı cevap verebilirsin.', en: "Voice input isn't available in this preview — it activates in TestFlight or an installed APK. You can still type your answer." },
    },
    result: {
      title: { tr: 'Simülasyon tamamlandı!', en: 'Simulation complete!' },
      scoreLabel: { tr: 'Skor', en: 'Score' },
      score: { tr: '{correct} / {total} doğru', en: '{correct} / {total} correct' },
      passed: { tr: '🎉 Tebrikler — A1 seviyesinde konuşman akıyor!', en: '🎉 Congrats — your A1 speaking is fluent!' },
      needsWork: { tr: '💪 Süper başlangıç. Tekrar dene, her seferinde daha iyi olacak.', en: "💪 Great start. Try again and you'll do even better." },
      examDayTitle: { tr: 'Sınav günü taktiği', en: 'Exam-day playbook' },
      examDayBody: { tr: 'İsim alfabetik sırayla çağrılıyor; sınav arkadaşını öğrenip onunla önceden iki tur pratik yap. Üç bölüm çok hızlı geçer (~12 dk), telaşa kapılma.', en: "Names are called alphabetically; learn your exam partner and rehearse two rounds together. The three parts fly by (~12 min) — don't panic." },
      retry: { tr: 'Tekrar dene', en: 'Try again' },
      back: { tr: 'Geri dön', en: 'Back' },
    },
    homeButton: { tr: '🎤 A1 Konuşma', en: '🎤 A1 Speaking' },
  },

  // ── A2 Konuşma Simülatörü ─────────────────────────────────────
  sprechenA2: {
    title: { tr: 'A2 Konuşma Simülatörü', en: 'A2 Speaking Simulator' },
    intro: {
      badge: { tr: 'AI EXAMINER · A2', en: 'AI EXAMINER · A2' },
      title: { tr: 'A2 Sprechen prova zamanı', en: 'Time to rehearse A2 Sprechen' },
      subtitle: { tr: 'Üç bölüm — Monolog + Jüri Sorusu + Plan Yapma. Sesli veya yazılı cevap ver, Examiner anında geri bildirim verir.', en: 'Three parts — Monologue, jury follow-up, joint planning. Speak or type; the examiner gives instant feedback.' },
      teil1Label: { tr: 'Bölüm 1 · Kennenlernen', en: 'Part 1 · Kennenlernen' },
      teil1Desc: { tr: 'Karşılıklı tanışma. Yaşadığın yer, meslek, dil, hobi gibi konularda detaylı sorulara A1\'den daha akıcı cevaplar ver.', en: "Get-to-know-you Q&A. Answer questions about where you live, your job, languages, hobbies — fuller answers than A1." },
      teil2Label: { tr: 'Bölüm 2 · Von sich erzählen', en: 'Part 2 · Von sich erzählen' },
      teil2Desc: { tr: 'Kart başlığını gör, 3-4 alt başlığa değin, kesintisiz konuş. Sonra jüri ek soru sorar.', en: 'Read the card title, cover 3-4 guide questions in one go. The jury asks one follow-up.' },
      teil3Label: { tr: 'Bölüm 3 · Gemeinsam planen', en: 'Part 3 · Gemeinsam planen' },
      teil3Desc: { tr: 'Ortak bir plan (hediye, sinema, gezi). Karşıdaki examiner ile zaman, mekân, bütçe için anlaşmaya var.', en: 'Plan something together (gift, cinema, trip). Negotiate time, place, budget with the AI partner.' },
      tipTitle: { tr: '💡 A2 ipucu', en: '💡 A2 tip' },
      tipBody: { tr: 'Perfekt (Ich bin gegangen) + weil/wenn cümleciklerini bol kullan. Monolog 40 kelimenin üstünde olsun.', en: 'Use Perfekt (Ich bin gegangen) + weil/wenn clauses generously. Aim for 40+ words in your monologue.' },
      start: { tr: 'Simülasyona başla', en: 'Start simulation' },
    },
    partLabel: {
      teil1: { tr: 'Bölüm 1 · Kennenlernen', en: 'Part 1 · Kennenlernen' },
      teil2Monolog: { tr: 'Bölüm 2 · Monolog', en: 'Part 2 · Monologue' },
      teil2Followup: { tr: 'Bölüm 2 · Jüri Sorusu', en: 'Part 2 · Jury follow-up' },
      teil3Examiner: { tr: 'Bölüm 3 · Partner Konuşuyor', en: 'Part 3 · Partner speaking' },
      teil3User: { tr: 'Bölüm 3 · Sıra Sende', en: 'Part 3 · Your turn' },
    },
    teil1: {
      categories: {
        wohnort: { tr: 'Yaşadığın Yer', en: 'Where you live' },
        beruf: { tr: 'Meslek', en: 'Job' },
        familie: { tr: 'Aile', en: 'Family' },
        sprachen: { tr: 'Diller', en: 'Languages' },
        hobbys: { tr: 'Hobiler', en: 'Hobbies' },
        reisen: { tr: 'Seyahat', en: 'Travel' },
        essen: { tr: 'Yemek', en: 'Food' },
        sport: { tr: 'Spor', en: 'Sport' },
        tagesablauf: { tr: 'Günlük Rutin', en: 'Daily routine' },
      },
      placeholder: { tr: 'Cevabını Almanca yaz veya 🎤 mikrofona dokunup konuş…', en: 'Type your answer in German or tap 🎤 to speak…' },
    },
    progress: { tr: 'Adım {current} / {total}', en: 'Step {current} / {total}' },
    teil2: {
      leitfragenLabel: { tr: 'Bu başlıklara değinmen lazım:', en: 'Cover these prompts:' },
      placeholderMonolog: { tr: 'Monoloğunu Almanca yaz veya 🎤 mikrofona dokunup konuş…', en: 'Type your monologue or tap 🎤 to speak…' },
      placeholderAnswer: { tr: 'Cevabını Almanca yaz veya 🎤 mikrofona dokunup konuş…', en: 'Type your answer or tap 🎤 to speak…' },
    },
    teil3: {
      setupLabel: { tr: 'Senaryo', en: 'Scenario' },
      talkingPointsLabel: { tr: 'Anlaşmanız gereken noktalar', en: 'What you need to agree on' },
      partnerSpeaking: { tr: 'Partner konuşuyor — dinle, sonra cevabını ver.', en: 'Partner is speaking — listen, then answer.' },
      yourTurn: { tr: 'Sıra sende', en: 'Your turn' },
      continue: { tr: 'Devam', en: 'Continue' },
      placeholder: { tr: 'Cevabını Almanca yaz veya 🎤 mikrofona dokunup konuş…', en: 'Type your reply or tap 🎤 to speak…' },
    },
    feedback: {
      monologGreat: { tr: '✅ Sehr gut! Akıcı bir monolog.', en: '✅ Sehr gut! Fluent monologue.' },
      monologOkay: { tr: '👍 İyi başlangıç — kelime sayını biraz artırabilirsin.', en: '👍 Good start — try to add a bit more.' },
      monologShort: { tr: '🤏 Çok kısa. En az {min} kelimeli bir monolog bekleniyor.', en: '🤏 Too short. We expect at least {min} words.' },
      monologMissing: { tr: '🔍 Kart başlıklarına yeterince değinmemişsin. Aşağıdaki örneği oku.', en: "🔍 You didn't cover enough of the card prompts. Check the model below." },
      bonusPerfekt: { tr: '⭐ Perfekt zamanı kullandın — A2\'nin alameti farikası!', en: '⭐ You used Perfekt — A2 signature!' },
      bonusSubordinate: { tr: '⭐ "weil/wenn" cümleciği yakaladın — çok iyi.', en: '⭐ Spotted a "weil/wenn" clause — excellent.' },
      great: { tr: '✅ Sehr gut!', en: '✅ Sehr gut!' },
      okay: { tr: '👍 Genau!', en: '👍 Genau!' },
      tooShort: { tr: '🤏 Biraz daha uzun bir cümle gerek.', en: '🤏 A bit longer please.' },
      missing: { tr: '🔍 Anahtar kelime eksik. Aşağıdaki kalıba bak.', en: '🔍 A key word is missing. Look at the model.' },
      model: { tr: '📋 Doğru kalıp', en: '📋 Model phrasing' },
      next: { tr: 'Devam et', en: 'Continue' },
    },
    mic: {
      tapToSpeak: { tr: '🎤 Konuşmak için dokun', en: '🎤 Tap to speak' },
      listening: { tr: '🔴 Dinliyorum… (durdurmak için tekrar dokun)', en: '🔴 Listening… (tap again to stop)' },
      permissionDenied: { tr: 'Mikrofon izni gerekiyor. Ayarlardan izin verip tekrar dene.', en: 'Microphone permission required. Allow it in Settings and try again.' },
      notAvailable: { tr: 'Sesli giriş bu test ortamında çalışmaz — TestFlight veya yüklenmiş APK ile aktif olur. Şimdilik yazılı cevap verebilirsin.', en: "Voice input isn't available in this preview — it activates in TestFlight or an installed APK." },
    },
    result: {
      title: { tr: 'A2 Simülasyonu tamamlandı!', en: 'A2 simulation complete!' },
      score: { tr: '{correct} / {total} doğru', en: '{correct} / {total} correct' },
      passed: { tr: '🎉 Tebrikler — A2 konuşma seviyende emin adımlarla ilerliyorsun!', en: '🎉 Congrats — your A2 speaking is on solid ground!' },
      needsWork: { tr: '💪 Süper deneme. Perfekt + weil cümlecikleriyle bir daha dene, daha akıcı olacak.', en: '💪 Great attempt. Add Perfekt + weil clauses next round.' },
      retry: { tr: 'Tekrar dene', en: 'Try again' },
      back: { tr: 'Geri dön', en: 'Back' },
    },
    homeButton: { tr: '🎤 A2 Konuşma', en: '🎤 A2 Speaking' },
  },
} as const;

type Messages = typeof messages;
type DotKeys<T, P extends string = ''> = {
  [K in keyof T]: T[K] extends { tr: string; en: string }
    ? `${P}${K & string}`
    : T[K] extends object
      ? DotKeys<T[K], `${P}${K & string}.`>
      : never;
}[keyof T];

export type MessageKey = DotKeys<Messages>;

function getMessage(key: string, lang: Lang): string {
  const parts = key.split('.');
  let node: unknown = messages;
  for (const part of parts) {
    if (node && typeof node === 'object' && part in node) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  if (node && typeof node === 'object' && 'tr' in node && 'en' in node) {
    return (node as Record<Lang, string>)[lang];
  }
  return key;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => String(params[k] ?? `{${k}}`));
}

export function useT() {
  const lang = useUserStore((s) => s.language);
  return (key: MessageKey, params?: Record<string, string | number>): string => {
    const msg = getMessage(key as string, lang);
    return interpolate(msg, params);
  };
}

export function getT(key: MessageKey, params?: Record<string, string | number>): string {
  const lang = useUserStore.getState().language;
  const msg = getMessage(key as string, lang);
  return interpolate(msg, params);
}
