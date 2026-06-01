import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemePalette, type ThemePalette } from '../../theme/useThemePalette';
import { useT } from '../../i18n';
import type { FamilyMember } from '../../services/family';

// ════════════════════════════════════════════════════════════════
// MemberListItem — aile listesindeki tek üye satırı.
//
// Owner için "Sen" rozeti gösterilir.
// Phase 2: onRemove prop'u eklenerek owner-kicker UI etkin olur.
// ════════════════════════════════════════════════════════════════

interface Props {
  member: FamilyMember;
  isCurrentUser: boolean;
  canRemove?: boolean;
  onRemove?: () => void;
}

export function MemberListItem({ member, isCurrentUser, canRemove, onRemove }: Props) {
  const c = useThemePalette();
  const styles = makeStyles(c);
  const t = useT();

  const initial = (member.displayName?.[0] || '?').toUpperCase();
  const isOwner = member.role === 'owner';

  return (
    <View style={styles.row}>
      <View style={[styles.avatar, isOwner && styles.avatarOwner]}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>
            {member.displayName}
          </Text>
          {isCurrentUser && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>{t('family.you')}</Text>
            </View>
          )}
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerBadgeText}>{t('family.owner')}</Text>
            </View>
          )}
        </View>
        {member.email && (
          <Text style={styles.email} numberOfLines={1}>
            {member.email}
          </Text>
        )}
      </View>

      {canRemove && !isOwner && !isCurrentUser && onRemove && (
        <Pressable style={styles.removeButton} onPress={onRemove}>
          <Ionicons name="close-circle" size={24} color={c.red} />
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (c: ThemePalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: c.surface,
      borderRadius: 12,
      marginVertical: 4,
      gap: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: c.bg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.border,
    },
    avatarOwner: {
      borderColor: c.neon,
      backgroundColor: c.neon + '15',
    },
    avatarText: {
      color: c.textHigh,
      fontSize: 18,
      fontWeight: '700',
    },
    info: {
      flex: 1,
      gap: 2,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    name: {
      color: c.textHigh,
      fontSize: 15,
      fontWeight: '600',
    },
    email: {
      color: c.textMed,
      fontSize: 12,
    },
    youBadge: {
      backgroundColor: c.neon + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    youBadgeText: {
      color: c.neon,
      fontSize: 11,
      fontWeight: '700',
    },
    ownerBadge: {
      backgroundColor: c.gold + '20',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },
    ownerBadgeText: {
      color: c.gold,
      fontSize: 11,
      fontWeight: '700',
    },
    removeButton: {
      padding: 4,
    },
  });
