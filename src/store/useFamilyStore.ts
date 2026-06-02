import { create } from 'zustand';
import type { FamilyDocClient, UserFamilyRefClient } from '../services/family';

// ════════════════════════════════════════════════════════════════
// FAMILY STORE — cloud authoritative, persist EDİLMEZ.
//
// Bu store sadece Firestore listener'ları tarafından doldurulur.
// Persist edilmemesi kritik:
//   1. Race condition: logout sonrası stale state kalmasın
//   2. State drift: AsyncStorage'a yazılırsa Firestore ↔ local farkı oluşur
//   3. Premium resolve: PremiumSyncer canlı verilerle çalışsın
//
// Logout sırasında clearFamily() çağrılır (sync.ts → clearLocalProgress).
// ════════════════════════════════════════════════════════════════

export type FamilyRole = 'owner' | 'member' | null;

interface FamilyState {
  // Family doc (owner kendisi için, üye owner'ın family'sini izliyorsa)
  familyDoc: FamilyDocClient | null;

  // Member ise kendi familyRef'i
  familyRef: UserFamilyRefClient | null;

  // Türetilmiş alanlar (selector kullanılarak hesaplanabilir ama hazır tutmak hızlı)
  role: FamilyRole;
  isFamilyPremium: boolean; // family üzerinden premium mu

  // Actions
  setFamilyDoc: (doc: FamilyDocClient | null, currentUid: string | null) => void;
  setFamilyRef: (ref: UserFamilyRefClient | null) => void;
  clearFamily: () => void;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  familyDoc: null,
  familyRef: null,
  role: null,
  isFamilyPremium: false,

  setFamilyDoc: (doc, currentUid) => {
    if (!doc || !currentUid) {
      // Doc okunamadı/silindi/üyelikten çıkarıldı: üye kendi familyRef'i AKTİFSE
      // (removedAt yok) premium korunur (transient erişim kaybı). Aksi halde
      // rol + family-premium SIFIRLANIR (eskiden sadece familyDoc:null idi → stale kalıyordu).
      const ref = get().familyRef;
      const memberStillActive = !!ref && ref.removedAt == null;
      set({
        familyDoc: null,
        role: memberStillActive ? 'member' : null,
        isFamilyPremium: memberStillActive,
      });
      return;
    }
    // Owner mıyım kontrol et
    const isOwner = doc.ownerUid === currentUid;
    const isMember = !isOwner && doc.members.some((m) => m.uid === currentUid);

    let role: FamilyRole = null;
    if (isOwner) role = 'owner';
    else if (isMember) role = 'member';

    // isFamilyPremium hesabı:
    //   - Owner ise: family status === 'active' (kendi sub'u zaten RC'de premium gösterir,
    //     ama family doc'ta status önemli — expired olursa anlık göster)
    //   - Member ise: family status === 'active' VE kendisi members'ta VE removedAt yok
    //     (member için familyRef listener ayrı tutuluyor, burası double-check)
    const isFamilyPremium =
      doc.status === 'active' && (isOwner || (isMember && get().familyRef?.removedAt == null));

    set({ familyDoc: doc, role, isFamilyPremium });
  },

  setFamilyRef: (ref) => {
    const doc = get().familyDoc;
    const role = get().role;
    // Owner premium'u kendi family doc'undan (setFamilyDoc) yönetilir; familyRef'i yok.
    if (role === 'owner') {
      set({ familyRef: ref });
      return;
    }
    // Üye premium'u: familyRef AKTİF (removedAt == null) + aile (biliniyorsa) aktif.
    // ⚠️ STICKY OR KALDIRILDI: üye aileden AYRILINCA (removedAt set) premium DÜŞMELİ.
    // Eskiden `isFamilyPremium || get().isFamilyPremium` true'da kilitliyordu →
    // ayrılan kişi premium kalıyor + ensureFamilyOwner ile owner olup davet ediyordu.
    const isFamilyPremium =
      !!ref && ref.removedAt == null && (doc == null || doc.status === 'active');
    set({ familyRef: ref, isFamilyPremium });
  },

  clearFamily: () => {
    set({
      familyDoc: null,
      familyRef: null,
      role: null,
      isFamilyPremium: false,
    });
  },
}));

// ─────────────────────────────────────────────────────────────
// Selector helper'lar (component'lerde granular kullanılır)
// ─────────────────────────────────────────────────────────────

export const selectIsFamilyOwner = (s: FamilyState) => s.role === 'owner';
export const selectIsFamilyMember = (s: FamilyState) => s.role === 'member';
export const selectFamilyMembers = (s: FamilyState) =>
  s.familyDoc?.members ?? [];
export const selectFamilyStatus = (s: FamilyState) =>
  s.familyDoc?.status ?? null;
export const selectInviteCode = (s: FamilyState) =>
  s.familyDoc?.currentInviteCode ?? null;
export const selectInviteExpiresAt = (s: FamilyState) =>
  s.familyDoc?.currentInviteExpiresAt ?? null;
export const selectIsFamilyPremium = (s: FamilyState) => s.isFamilyPremium;
