import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// ✨ EFEKTSİZ VERSİYON
// Önceki versiyonda FadeInDown.springify() animasyonu + glow shadow'lar vardı.
// Android'de yavaşlatma yaratıyordu, bu yüzden:
//   - Animasyon kaldırıldı (artık instant görünür)
//   - Shadow/glow minimuma indirildi
//   - Sadece "doğru cevap" görselini gösterir, ek efekt yok

interface CorrectFeedbackProps {
  onContinue: () => void;
}

function CorrectFeedbackImpl({ onContinue }: CorrectFeedbackProps) {
  const c = useThemeColors();
  const t = useT();
  const styles = useMemo(() => makeStyles(c), [c]);

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark" size={24} color={c.textOnNeon} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{t('lesson.correct')}</Text>
          <Text style={styles.subtitle}>{t('lesson.correctKeepGoing')}</Text>
        </View>
      </View>

      <Pressable
        onPress={onContinue}
        style={({ pressed }) => [styles.continueButton, pressed && styles.pressed]}
        accessibilityRole="button"
      >
        <Text style={styles.continueButtonText}>{t('common.continue')}</Text>
      </Pressable>
    </View>
  );
}

export const CorrectFeedback = React.memo(CorrectFeedbackImpl);

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    panel: {
      backgroundColor: c.correctBg,
      borderWidth: 1, borderColor: c.neon,
      borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.base,
      paddingTop: spacing.lg, paddingBottom: spacing.lg,
      gap: spacing.base, overflow: 'hidden',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.neon,
    },
    textCol: { flex: 1, gap: 2 },
    title: { ...textStyles.subheading, color: c.neonLight },
    subtitle: { ...textStyles.body, color: c.textMed, fontSize: 13 },
    continueButton: {
      minHeight: 52, borderRadius: radius.md,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: c.neon,
    },
    continueButtonText: { ...textStyles.button, color: c.textOnNeon },
    pressed: { opacity: 0.92, transform: [{ translateY: 1 }] },
  });
}
