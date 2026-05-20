import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { spacing, textStyles, useThemeColors } from '../../theme';
import { useT } from '../../i18n';

// Tab meta — sadece icon bilgisi, label i18n'den gelir
const TAB_META: Record<string, {
  labelKey: 'tabs.map' | 'tabs.lessons' | 'tabs.profile' | 'tabs.shop';
  iconActive: keyof typeof Ionicons.glyphMap;
  iconInactive: keyof typeof Ionicons.glyphMap;
}> = {
  index: { labelKey: 'tabs.map', iconActive: 'map', iconInactive: 'map-outline' },
  lessons: { labelKey: 'tabs.lessons', iconActive: 'book', iconInactive: 'book-outline' },
  profile: { labelKey: 'tabs.profile', iconActive: 'person', iconInactive: 'person-outline' },
  shop: { labelKey: 'tabs.shop', iconActive: 'bag', iconInactive: 'bag-outline' },
};

const TAB_ORDER = ['index', 'lessons', 'profile', 'shop'] as const;

export function BottomNav({ state, navigation }: BottomTabBarProps) {
  const c = useThemeColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, 6);

  const visibleRoutes = state.routes.filter((r) => r.name in TAB_META);
  const sortedRoutes = [...visibleRoutes].sort((a, b) => {
    const ai = TAB_ORDER.indexOf(a.name as (typeof TAB_ORDER)[number]);
    const bi = TAB_ORDER.indexOf(b.name as (typeof TAB_ORDER)[number]);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const styles = makeStyles(c);

  return (
    <View style={[styles.container, { paddingBottom: safeBottom }]}>
      <View style={styles.topHairline} />
      <View style={styles.row}>
        {sortedRoutes.map((route) => {
          const meta = TAB_META[route.name];
          const label = t(meta.labelKey);
          const originalIndex = state.routes.findIndex((r) => r.key === route.key);
          const isFocused = state.index === originalIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={label}
              style={styles.tab}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Ionicons
                  name={isFocused ? meta.iconActive : meta.iconInactive}
                  size={22}
                  color={isFocused ? c.neon : c.textLow}
                />
              </View>
              <Text
                style={[
                  styles.label,
                  isFocused ? styles.labelActive : styles.labelInactive,
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useThemeColors>) {
  return StyleSheet.create({
    container: { backgroundColor: c.bg, paddingTop: spacing.xs },
    topHairline: { height: 1, backgroundColor: c.divider, marginHorizontal: 0 },
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-around',
      paddingTop: spacing.xs,
    },
    tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs, gap: 2 },
    iconWrap: {
      width: 44,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: c.neonBg,
      shadowColor: c.neon,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.4,
      shadowRadius: 6,
      elevation: 4,
    },
    label: {
      ...textStyles.label,
      fontSize: 10,
      letterSpacing: 0.6,
    },
    labelActive: { color: c.neon },
    labelInactive: { color: c.textLow },
  });
}
