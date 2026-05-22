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
    extraHeartsDesc: { tr: 'Tek seferlik mock satın alma', en: 'One-time mock purchase' },
    mockNote: {
      tr: 'Tüm satın almalar mock — gerçek ödeme yok, demo amaçlı.',
      en: 'All purchases are mock — no real payment, demo only.',
    },
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
    title: { tr: 'Başarımlar', en: 'Achievements' },
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

  // Smart reminder mesajları — sabah motivasyon, akşam streak/aktivite
  // Her açılışta random seçilir, 8'er varyasyon ile çeşitlilik sağlanır
  smartReminder: {
    // Sabah mesajları (9:00-12:00 arası)
    morning1: { tr: 'Günaydın! ☀️ Bugün 5 dakika Almanca?', en: 'Good morning! ☀️ 5 minutes of German today?' },
    morning2: { tr: 'Yeni bir gün, yeni kelimeler 🌅 Vogel seni bekliyor!', en: 'New day, new words 🌅 Vogel is waiting!' },
    morning3: { tr: 'Sabah kahveni iç, sonra bir ders yap ☕📚', en: 'Have your coffee, then a quick lesson ☕📚' },
    morning4: { tr: 'Bugün öğreneceğin kelime, yarın söyleyeceğin cümle 🌱', en: "Today's word is tomorrow's sentence 🌱" },
    morning5: { tr: 'Küçük adımlar büyük yollar açar. Bugün bir ders ⚡', en: 'Small steps, big roads. One lesson today ⚡' },
    morning6: { tr: 'Ich lerne jeden Tag. Sen de mi? 🇩🇪', en: 'Ich lerne jeden Tag. Do you? 🇩🇪' },
    morning7: { tr: 'Vogel uçtuğunda sen de uçacaksın 🐦 Başla!', en: "When Vogel flies, so will you 🐦 Let's go!" },
    morning8: { tr: 'Günü Almanca\'yla aç. Hadi bir ders! 🚀', en: 'Start the day with German. One lesson! 🚀' },

    // Akşam mesajları (18:00-22:00 arası)
    evening1: { tr: 'Bugünkü serini koru! 🔥 5 dakika yeter.', en: 'Keep your streak today! 🔥 5 minutes is enough.' },
    evening2: { tr: 'Vogel seni özledi 🥺 Bir derste görüşürüz?', en: 'Vogel misses you 🥺 See you in a lesson?' },
    evening3: { tr: 'Bugünü kaçırma! 📚 Almanca yolculuğun devam etsin.', en: "Don't miss today! 📚 Continue your German journey." },
    evening4: { tr: 'Serini kıramazsın, değil mi? 🔥 Bir derse vakit var.', en: "Can't break your streak, right? 🔥 Time for a lesson." },
    evening5: { tr: 'Yarın değil, BUGÜN! ⚡ Bir dersle günü kapat.', en: 'Not tomorrow, TODAY! ⚡ Close the day with a lesson.' },
    evening6: { tr: 'Pratik yapmayı unutma! Bir kelime bile yeterli 🌟', en: "Don't forget to practice! Even one word counts 🌟" },
    evening7: { tr: 'Bugünkü XP\'ni topla! ⚡ Vogel hazır.', en: "Collect today's XP! ⚡ Vogel is ready." },
    evening8: { tr: 'Yatmadan önce 5 dakika? Yeter de artar 🌙', en: '5 minutes before bed? More than enough 🌙' },

    // ────── MOTIVASYON-SPESİFİK MESAJLAR ──────
    // Her motivasyon için 3'er sabah + 3'er akşam mesajı.
    // personalization.ts otomatik seçim yapar.

    // 🌍 Seyahat
    travel_morning_1: { tr: 'Günaydın! ✈️ Bugün bir seyahat cümlesi öğren 🌍', en: 'Good morning! ✈️ Learn one travel phrase today 🌍' },
    travel_morning_2: { tr: 'Yeni gün, yeni şehir! 🗺️ Almanca\'yla yolculuğa devam', en: 'New day, new city! 🗺️ Continue your German journey' },
    travel_morning_3: { tr: 'Berlin\'de kahvaltı ısmarlayabilir misin? ☕ Hadi pratik!', en: 'Can you order breakfast in Berlin? ☕ Practice time!' },
    travel_evening_1: { tr: 'Sonraki tatilin Almanya mı? 🏖️ Bugün bir ders!', en: 'Next vacation in Germany? 🏖️ Quick lesson today!' },
    travel_evening_2: { tr: 'Yolda kaybolmadan önce yer sor: "Wo ist...?" 📍', en: 'Before getting lost, ask: "Wo ist...?" 📍' },
    travel_evening_3: { tr: 'Bugün "Wie viel kostet das?" öğrenelim 💶', en: "Today let's learn 'Wie viel kostet das?' 💶" },

    // 💼 İş
    work_morning_1: { tr: 'Günaydın! 💼 Bugün bir iş kelimesi öğren, CV\'ne ekle', en: "Morning! 💼 Learn one work word — add it to your CV" },
    work_morning_2: { tr: 'İşe gitmeden önce bir ders ⚡ Profesyonel kal!', en: 'A lesson before work ⚡ Stay professional!' },
    work_morning_3: { tr: 'Almanca toplantılar için: "Guten Morgen, Kollegen!" 👋', en: "For German meetings: 'Guten Morgen, Kollegen!' 👋" },
    work_evening_1: { tr: 'Bugünü kapatırken bir iş kelimesi — yarın işine yarayacak 📈', en: "End of day — one work word for tomorrow 📈" },
    work_evening_2: { tr: 'Bir Alman\'la nasıl profesyonel email yazarsın? Pratik 📊', en: 'How to write a German business email? Practice 📊' },
    work_evening_3: { tr: 'Kariyer için 5 dakika yatırım 💼 Vogel hazır', en: "5-min investment for your career 💼 Vogel's ready" },

    // ❤️ Aile
    family_morning_1: { tr: 'Sevdiklerinle Almanca konuşmak üzereyiz ❤️ Hadi pratik!', en: "Almost ready to speak with loved ones ❤️ Practice!" },
    family_morning_2: { tr: 'Bugün "Ich liebe dich" öğrenebilirsin 💕', en: "Today you can learn 'Ich liebe dich' 💕" },
    family_morning_3: { tr: 'Sevdiğine sürpriz yap, bir cümle söyle 🌹', en: 'Surprise your loved one with a sentence 🌹' },
    family_evening_1: { tr: 'Aile sofrası mı özlüyorsun? Almanca yakınlaştıracak 🍲', en: 'Missing family dinner? German brings you closer 🍲' },
    family_evening_2: { tr: 'Bugün bir "Familie" kelimesi — yarın söyle 👪', en: "Today a 'Familie' word — say it tomorrow 👪" },
    family_evening_3: { tr: 'Kuşlar yuvasına döner, sen Vogel\'a 🐦 5 dk', en: 'Birds fly home, you fly to Vogel 🐦 5 mins' },

    // 🎬 Film/Dizi/Müzik
    media_morning_1: { tr: 'Bugün bir Alman şarkısı çözüyoruz! 🎵', en: 'Decoding a German song today! 🎵' },
    media_morning_2: { tr: 'Netflix\'te altyazısız dizi yakın 🎬 Devam!', en: 'No-subtitle Netflix soon 🎬 Keep going!' },
    media_morning_3: { tr: 'Rammstein\'ı anlamaya bir kelime daha 🎸', en: 'One word closer to understanding Rammstein 🎸' },
    media_evening_1: { tr: 'Bu akşam Almanca bir film? 🍿 Önce pratik!', en: 'German movie tonight? 🍿 Practice first!' },
    media_evening_2: { tr: 'Dizi izlerken duyduğun kelimeyi anla 🎥', en: "Understand the word you heard in that show 🎥" },
    media_evening_3: { tr: 'Almanca müzik listen daha keyifli olacak 🎧', en: 'Your German playlist will be sweeter 🎧' },

    // 📚 Akademik
    academic_morning_1: { tr: 'Günü Almanca\'yla aç — akademisyen modu 📚', en: 'Start with German — scholar mode 📚' },
    academic_morning_2: { tr: 'Bir Almanca akademik metin daha okuma\'na yakınsın 📖', en: "One step closer to reading German academic texts 📖" },
    academic_morning_3: { tr: 'İlim Almanca konuşur — sen de yakında 🎓', en: "Science speaks German — you will too 🎓" },
    academic_evening_1: { tr: 'Bugün bir formal dil yapısı öğren 📝', en: 'Learn one formal structure today 📝' },
    academic_evening_2: { tr: '5 dakika çalışma, 5 hafta sonra fark edeceksin 📈', en: '5 min today, big difference in 5 weeks 📈' },
    academic_evening_3: { tr: 'Almanca tezler ulaşılmaz olmaktan çıktı 📄', en: 'German theses no longer out of reach 📄' },

    // 🧠 Merak
    curious_morning_1: { tr: 'Yeni bir dünyaya merhaba 🌍 Hadi keşfet!', en: 'Hello to a new world 🌍 Explore!' },
    curious_morning_2: { tr: 'Beynine yeni bir yapı sun 🧠 Almanca pratik', en: 'Give your brain new structure 🧠 German practice' },
    curious_morning_3: { tr: 'Merakını besle — 5 dakikalık bir keşif 🔍', en: 'Feed your curiosity — a 5-min discovery 🔍' },
    curious_evening_1: { tr: 'Bugün ne yeni şey öğrendin? Bir tane daha! ✨', en: "What did you learn today? One more! ✨" },
    curious_evening_2: { tr: 'Yeni bir kelimenin tadı başka olur 🍬', en: 'A new word has a different taste 🍬' },
    curious_evening_3: { tr: 'Almanca, beynindeki yeni bir mahalle 🏘️', en: 'German, a new neighborhood in your brain 🏘️' },
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
