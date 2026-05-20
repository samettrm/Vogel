import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { radius, spacing, textStyles, useThemeColors } from '../../theme';

// ════════════════════════════════════════════════════════════════
// CONFIRM DIALOG — Tema uyumlu özel modal
// Native Alert.alert yerine kullanılır:
//  - Dark/light tema otomatik
//  - Nunito font (textStyles)
//  - Neon renkler + glass kart
//  - i18n metinleri (component dışından gelir)
//  - destructive=true → confirm butonu kırmızı, ikon uyarı
// ════════════════════════════════════════════════════════════════

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  destructive?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false,
  icon,
}: ConfirmDialogProps) {
  const c = useThemeColors();
  const styles = makeStyles(c);

  const accentColor = destructive ? c.red : c.neon;
  const iconName: keyof typeof Ionicons.glyphMap =
    icon ?? (destructive ? 'warning' : 'help-circle');

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      {/* Backdrop — tıklanırsa cancel */}
      <Animated.View
        entering={FadeIn.duration(180)}
        style={styles.backdrop}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />

        {/* Dialog kartı */}
        <Animated.View
          entering={FadeInDown.springify().damping(15).stiffness(200).duration(260)}
          style={styles.dialogWrap}
          pointerEvents="box-none"
        >
          <View style={styles.dialog}>
            {/* Üst parlak çizgi (cam efekti) */}
            <View style={styles.topHighlight} pointerEvents="none" />

            {/* İkon dairesi */}
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: destructive ? c.redBg : c.neonBg, borderColor: accentColor },
              ]}
            >
              <Ionicons name={iconName} size={28} color={accentColor} />
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            <View style={styles.buttonRow}>
              <Pressable
                onPress={onCancel}
                style={({ pressed }) => [
                  styles.button,
                  styles.cancelButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </Pressable>

              <Pressable
                onPress={onConfirm}
                style={({ pressed }) => [
                  styles.button,
                  destructive ? styles.destructiveButton : styles.confirmButton,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
              >
                <Text
                  style={
                    destructive ? styles.destructiveText : styles.confirmText
                  }
                >
                  {confirmLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
    },
    dialogWrap: {
      width: '100%',
      maxWidth: 380,
      alignItems: 'center',
    },
    dialog: {
      width: '100%',
      backgroundColor: c.surfaceElevated,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.glassBorderStrong,
      padding: spacing.lg,
      gap: spacing.md,
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 20,
      elevation: 16,
    },
    topHighlight: {
      position: 'absolute',
      top: 0,
      left: spacing.md,
      right: spacing.md,
      height: 1,
      backgroundColor: c.glassHighlight,
    },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      marginTop: spacing.xs,
    },
    title: {
      ...textStyles.subheading,
      color: c.textHigh,
      fontSize: 19,
      textAlign: 'center',
    },
    message: {
      ...textStyles.body,
      color: c.textMed,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      paddingHorizontal: spacing.xs,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
      width: '100%',
    },
    button: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
    },
    cancelButton: {
      backgroundColor: c.glassBg,
      borderWidth: 1.5,
      borderColor: c.glassBorderStrong,
    },
    confirmButton: {
      backgroundColor: c.neon,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 12,
      elevation: 6,
    },
    destructiveButton: {
      backgroundColor: c.red,
      shadowColor: c.red,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.55,
      shadowRadius: 12,
      elevation: 6,
    },
    cancelText: {
      ...textStyles.button,
      color: c.textMed,
      fontSize: 14,
      letterSpacing: 0.5,
    },
    confirmText: {
      ...textStyles.button,
      color: c.textOnNeon,
      fontSize: 14,
      letterSpacing: 0.5,
    },
    destructiveText: {
      ...textStyles.button,
      color: c.white,
      fontSize: 14,
      letterSpacing: 0.5,
    },
    pressed: {
      opacity: 0.88,
      transform: [{ scale: 0.98 }],
    },
  });
}
