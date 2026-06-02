# 🔧 Aile Planı (Family Plan) — Bilinen Buglar & Fixler

> Vogel'de aile üyeliği sisteminde bulunup düzeltilen 7 bug. **Aynı template'ten gelen
> diğer uygulamalarda (Lexora vb.) büyük olasılıkla AYNI buglar var.** Bu rehbere göre
> tek tek tara ve düzelt.
>
> Referans Vogel commit'leri (birebir diff'ler): `d47d550`, `3395686`, `cc0af9a`, `75f267c`.
> Kural: önce CLAUDE.md / STABILITY-LOCK.md oku; `tsc 0` olmadan commit etme.

## Mimari (Vogel ile aynı varsayılıyor — kendi yapında doğrula)

- **Backend:** `functions/src/family/*` (Cloud Functions callable): `ensureFamilyOwner`,
  `generateInviteCode`, `acceptInvite`, `leaveFamily`, `removeFamilyMember` + `webhooks/rcWebhook.ts`
- **Client store:** `src/store/useFamilyStore.ts` (Firestore listener'larla dolar, **persist YOK**)
- **Premium köprüsü:** `app/_layout.tsx` → `PremiumSyncer` + `FamilySyncer`
- **Ekran:** `app/family.tsx` + `src/components/family/*` (AddMemberCard, MemberListItem, AcceptInviteScreen)
- **Üye premium'u CLIENT-side türetilir:** `isFamilyPremium` (family doc/ref) → PremiumSyncer →
  `useUserStore.isPremium`. (RC üyeleri tanımaz; yalnız owner satın alır.)

---

## 🔴 BUG 1 (KRİTİK) — Exponential premium: 1 abonelik katlanarak çoğalıyor

**Belirti:** Üye, ailenin owner'ı gibi davranıp KENDİ davet kodunu üretip 5 kişi daha
davet edebiliyor. O 5 kişi de aynısını yapıyor → 1 aile aboneliği sonsuz çoğalıyor.
Ayrıca üye ayrılınca premium'u düşmüyor.

**Kök sebep:**
1. `PremiumSyncer` (_layout): `if (isFamilyPremium) { setPremium(true); setState({activePlanId:'family'}) }`
   → ÜYEYE de `activePlanId='family'` yazıyor.
2. `family.tsx`: `if (isPremium && activePlanId==='family') ensureFamilyOwner()` → üye için
   bile çağrılıyor → backend üyeye family doc açıyor → üye owner oluyor → davet ediyor.
3. `useFamilyStore.setFamilyRef`: `isFamilyPremium: x || get().isFamilyPremium` **STICKY OR**
   → ayrılınca (removedAt set) bir daha false olmuyor → premium kalıyor.
4. Backend `ensureFamilyOwner` RC doğrulaması YAPMIYOR (çağıran herkese doc açıyor).

**Fix:**

**A) `family.tsx` — ensureFamilyOwner'ı GERÇEK RC aile sahipliğine kilitle (store'a güvenme):**
```ts
useEffect(() => {
  if (!user || isMember) return;
  let alive = true;
  (async () => {
    const { getActivePlanId } = await import('.../services/purchases');
    const rcPlan = await getActivePlanId();          // RC entitlement'ından GERÇEK plan
    if (alive && rcPlan === 'family') await ensureFamilyOwner();
  })();
  return () => { alive = false; };
}, [user, isMember]);
// Eski koddaki `activePlanId === 'family'` GATE'ini KALDIR — kirli, üyeye de yazılıyor.
```

**B) `useFamilyStore.setFamilyRef` — STICKY OR'u kaldır:**
```ts
setFamilyRef: (ref) => {
  const role = get().role;
  if (role === 'owner') { set({ familyRef: ref }); return; } // owner premium'u doc'tan
  const isFamilyPremium = !!ref && ref.removedAt == null && (doc==null || doc.status==='active');
  set({ familyRef: ref, isFamilyPremium }); // `|| get().isFamilyPremium` ASLA EKLEME
}
// setFamilyDoc(null) de role+isFamilyPremium'u ref'e göre sıfırlamalı
// (eskiden sadece familyDoc:null yapıp stale bırakıyordu).
```

**C) Backend `ensureFamilyOwner` — sunucu guard (defense-in-depth):**
```ts
const refSnap = await db.doc(userFamilyRefPath(uid)).get();
if (refSnap.exists && refSnap.data()?.removedAt == null) {
  throw new HttpsError('failed-precondition',
    'Başka bir ailenin aktif üyesisin; kendi aile planını açamazsın.');
}
// (snap.exists erken-return'ünden SONRA, create'ten ÖNCE)
```

---

## 🔴 BUG 2 — Ayrılınca premium ANINDA düşmüyor (sadece app restart'ta)

**Belirti:** Üye "Aileden Ayrıl" der ama kilitli özellikleri kullanmaya devam eder,
Market'te hâlâ üye görünür. Ancak uygulamayı tamamen kapatıp açınca premiumsuz gelir.

**Kök sebep:** Bug 1B'deki STICKY OR + leave sonrası proaktif temizlik yok.

**Fix:** Bug 1B'yi uygula (reaktif yapar) + leave başarısında PROAKTİF temizle (anında):
```ts
onPress: async () => {
  const result = await leaveFamily();
  if (result.ok) {
    useFamilyStore.getState().clearFamily();
    useUserStore.getState().setPremium(false);
    useUserStore.setState({ activePlanId: null });
    router.replace('/(tabs)');
  }
}
```

---

## 🟠 BUG 3 — Davet kodları TEK KULLANIMLIK değil

**Belirti:** Üye ayrılıp AYNI kodla geri girebiliyor. Kod defalarca kullanılabiliyor.

**Kök sebep:** `acceptInvite` `consumed` alanını kontrol/set etmiyor; `generateInviteCode`
eski kodu geçersiz kılmıyor. (FamilyInviteDoc tipinde `consumed` zaten var, kullanılmıyor.)

**Fix:**

**A) backend `acceptInvite` — expiry kontrolünden sonra + join yazımında:**
```ts
if (invite.consumed === true)
  throw new HttpsError('failed-precondition',
    'Bu davet kodu zaten kullanılmış. Aile sahibinden yeni kod iste.');
// join yazımında:
const clear = family.currentInviteCode === rawCode
  ? { currentInviteCode: null, currentInviteExpiresAt: null } : {};
txn.update(familyRef, { members:..., memberUids:..., ...clear, updatedAt: now });
txn.update(inviteRef, { consumed: true });   // KODU TÜKET
```

**B) backend `generateInviteCode` — yeni kod üretince eskiyi geçersiz kıl (tek aktif kod):**
```ts
const oldCode = family.currentInviteCode;          // (reads writes'tan ÖNCE)
const oldRef = oldCode ? db.doc(inviteDocPath(oldCode)) : null;
const oldSnap = oldRef ? await txn.get(oldRef) : null;
// ...writes...
if (oldRef && oldSnap?.exists) txn.update(oldRef, { consumed: true });
```

**Sonuç:** Owner kod üretir → 1 kişi katılır → kod ölür. Sonraki üye için YENİ kod üretir.
Çıkan/atılan kişi yeni kod gelene kadar giremez.

---

## 🟠 BUG 4 — Patron (owner) üye atamıyor (kick UI yok)

**Belirti:** Owner istenmeyen üyeyi çıkaramıyor. (Backend `removeFamilyMember` VAR, UI yok.)

**Fix:** `family.tsx` owner görünümünde MemberListItem'a kick bağla (MemberListItem zaten
`canRemove` + `onRemove` destekliyor):
```tsx
<MemberListItem ... canRemove onRemove={() => confirmRemove(m, t)} />
// confirmRemove: Alert onayı → removeFamilyMember(member.uid).
// Backend removeFamilyMember: members'tan çıkar + familyRef.removedAt set.
// Tek-kullanımlık kod (Bug 3) sayesinde atılan üye aynı kodla geri giremez.
```

---

## 🟡 BUG 5 — Davet edilen üyenin KOD GİRECEK yeri yok

**Belirti:** Davet edilen (premium olmayan) kişi kodu hiçbir yere giremiyor; aile ekranı
sadece "aile planı satın al" gösteriyor + ekrana ulaşamıyor (settings linki premium-gated).

**Fix:**
- **A)** `family.tsx` "aileye dahil değil" görünümüne TextInput + "Aileye Katıl" (`acceptInvite`)
  ekle. Başarıda Firestore listener role'ü 'member' yapınca görünüm otomatik geçer.
- **B)** Settings'teki aile linkini `isPremium &&` yerine `user &&` yap → davet edilen
  premium-olmayan da `/family`'ye ulaşsın.

---

## 🟡 BUG 6 — WhatsApp'a giden davet linki TIKLANAMIYOR

**Belirti:** Paylaşım `appscheme://invite/CODE` custom scheme → WhatsApp linke çevirmiyor.

**Fix:** https landing page kullan (GitHub Pages'te `docs/invite.html`):
- `docs/invite.html`: `?code=` okur, kodu gösterir, "Uygulamayı Aç" (deep link) + store linkleri.
- Paylaşım linkini `https://<github-pages>/invite.html?code=CODE` yap (AddMemberCard +
  `generateInviteCode`'un döndürdüğü `link`). https = tıklanabilir.

---

## 🟡 BUG 7 — Aile ekranında GERİ butonu yok

**Fix:** `family.tsx`'in her görünümüne geri butonlu header ekle:
```tsx
<Stack.Screen options={{ title, headerShown: false }} />
<FamilyHeader .../>   // chevron-back → router.canGoBack() ? back() : replace('/(tabs)')
```

---

## 🚀 Aktif etme (her iki taraf da değişiyor)

1. **Backend** (acceptInvite, generateInviteCode, ensureFamilyOwner değişti):
   ```
   cd functions && npm install && npm run build   # tsc 0 doğrula
   firebase deploy --only functions
   ```
2. **Client** (family.tsx, useFamilyStore, settings, AddMemberCard, i18n): **yeni build** (TestFlight/Play)
3. **docs/invite.html** → GitHub Pages otomatik yayınlar (push yeter)
4. **Bozuk veri temizliği:** Bug 1'den ÖNCE üyeyken-owner-olmuş hesapların Firestore'da bozuk
   `families/{uid}` doc'ları kalır → elle sil (`familyRef`'leri de). `users/{uid}/data`
   subkoleksiyonuna **DOKUNMA** (kullanıcı ilerlemesi orada).

## ✅ Test checklist (yeni build + deploy sonrası)

- [ ] Owner kod üret → https link paylaş → tıklanabilir mi
- [ ] Davet edilen (premiumsuz) → Ayarlar → Aile → kod gir → katılıyor mu
- [ ] Üye premium'u açılıyor mu (kilitli özellikler + Market)
- [ ] Üye AYRILINCA → premium ANINDA düşüyor mu + Market premiumsuza dönüyor mu
- [ ] Aynı (eski) kodla GERİ GİREMİYOR mu
- [ ] Owner üyeyi ÇIKARABİLİYOR mu (kick) → atılan premium düşüyor + geri giremiyor
- [ ] Ex-member KENDİ ailesini AÇAMIYOR / davet EDEMİYOR mu (exponential durdu mu)
- [ ] Aile ekranında GERİ butonu çalışıyor mu
