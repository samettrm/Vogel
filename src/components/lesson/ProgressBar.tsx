import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors, spacing } from '../../theme';

interface ProgressBarProps {
  progress: number;
}

export default function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.fill, { width: `${progress}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 16,
    backgroundColor: '#E5E5E5',
    borderRadius: 999,
    overflow: 'hidden',
    marginHorizontal: spacing.md,
  },
  fill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
  },
});