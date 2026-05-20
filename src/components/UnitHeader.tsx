import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, textStyles, radius } from '../theme';

// Her ünitenin tepesindeki renkli pankart.

interface UnitHeaderProps {
  unitNumber: number;
  title: string;
  color: string;
}

export function UnitHeader({ unitNumber, title, color }: UnitHeaderProps) {
  return (
    <View style={[styles.container, { backgroundColor: color }]}>
      <View>
        <Text style={styles.subtitle}>ÜNİTE {unitNumber}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    marginHorizontal: spacing.base,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.white,
    opacity: 0.85,
  },
  title: {
    ...textStyles.subheading,
    color: colors.white,
    marginTop: 2,
  },
});
