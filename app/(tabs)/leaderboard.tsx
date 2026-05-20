import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '../../src/store/useUserStore';
import { colors, spacing, textStyles } from '../../src/theme';

type LeagueTab = 'daily' | 'weekly';

export default function LeaderboardScreen() {
  const currentLeague = useUserStore((s) => (s as any).currentLeague) || 'Bronz Lig';
  const competitors = useUserStore((s) => (s as any).leagueCompetitors) || [];
  const leagueEndDate = useUserStore((s) => (s as any).leagueEndDate) || 0;
  const checkLeagueStatus = useUserStore((s) => (s as any).checkLeagueStatus);

  // Aktif sekmeyi tutan state (Varsayılan olarak Günlük açılır)
  const [activeTab, setActiveTab] = useState<LeagueTab>('daily');
  
  // Sayaç state'leri
  const [weeklyTimeLeft, setWeeklyTimeLeft] = useState('7g 0s 0dk');
  const [dailyTimeLeft, setDailyTimeLeft] = useState('00s 00dk 00sn');

  useEffect(() => {
    if (checkLeagueStatus) checkLeagueStatus();
  }, []);

  // 1. HAFTALIK LİG SAYACI (Store verisine bağlı klasik geri sayım)
  useEffect(() => {
    if (leagueEndDate === 0) return;

    const updateWeeklyTimer = () => {
      const diff = leagueEndDate - Date.now();
      if (diff <= 0) {
        if (checkLeagueStatus) checkLeagueStatus();
        return;
      }
      const days = Math.floor(diff / (24 * 60 * 60 * 1000));
      const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));

      setWeeklyTimeLeft(`${days}g ${hours}s ${minutes}dk`);
    };

    updateWeeklyTimer();
    const interval = setInterval(updateWeeklyTimer, 60000);
    return () => clearInterval(interval);
  }, [leagueEndDate]);

  // 2. GÜNLÜK LİG SAYACI (Her gece yarısı 00:00'a göre saniyelik geri sayım)
  useEffect(() => {
    const updateDailyTimer = () => {
      const now = new Date();
      const nightTime = new Date();
      nightTime.setHours(23, 59, 59, 999);

      const diff = nightTime.getTime() - now.getTime();
      if (diff <= 0) {
        setDailyTimeLeft('00s 00dk 00sn');
        return;
      }

      const hours = Math.floor(diff / (60 * 60 * 1000));
      const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      const hStr = hours < 10 ? `0${hours}` : hours;
      const mStr = minutes < 10 ? `0${minutes}` : minutes;
      const sStr = seconds < 10 ? `0${seconds}` : seconds;

      setDailyTimeLeft(`${hStr}s ${mStr}dk ${sStr}sn`);
    };

    updateDailyTimer();
    const interval = setInterval(updateDailyTimer, 1000); // Saniyelik akış
    return () => clearInterval(interval);
  }, []);

  // Lig tipine ve sekmeye göre renk belirleme
  const getHeaderIconColor = () => {
    if (activeTab === 'daily') return '#FFD700'; // Günlük için parlak şimşek sarısı
    if (currentLeague.includes('Gümüş')) return '#B4C4D4';
    if (currentLeague.includes('Altın')) return '#FFD700';
    if (currentLeague.includes('Safir')) return '#1CB0F6';
    if (currentLeague.includes('Yakut')) return '#FF4B4B';
    return '#CD7F32'; // Varsayılan Bronz kupa rengi
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      
      {/* 👑 PROFESYONEL İKİLİ SEKME BUTONLARI (TAB BAR) */}
      <View style={styles.tabContainer}>
        <Pressable 
          style={[styles.tabButton, activeTab === 'daily' && styles.activeTabButton]} 
          onPress={() => setActiveTab('daily')}
        >
          <Ionicons name="flash" size={16} color={activeTab === 'daily' ? '#A349A4' : '#888'} />
          <Text style={[styles.tabButtonText, activeTab === 'daily' && styles.activeTabButtonText]}>
            Günlük Lig
          </Text>
        </Pressable>

        <Pressable 
          style={[styles.tabButton, activeTab === 'weekly' && styles.activeTabButton]} 
          onPress={() => setActiveTab('weekly')}
        >
          <Ionicons name="trophy" size={15} color={activeTab === 'weekly' ? '#A349A4' : '#888'} />
          <Text style={[styles.tabButtonText, activeTab === 'weekly' && styles.activeTabButtonText]}>
            Haftalık Lig
          </Text>
        </Pressable>
      </View>

      {/* DİNAMİK BAŞLIK KARTI */}
      <View style={styles.headerCard}>
        <Ionicons 
          name={activeTab === 'daily' ? 'flash' : 'trophy'} 
          size={50} 
          color={getHeaderIconColor()} 
        />
        <View style={styles.headerTextContainer}>
          <Text style={styles.leagueTitle}>
            {activeTab === 'daily' ? `Günlük Yıldırım` : currentLeague}
          </Text>
          <View style={styles.timerBadge}>
            <Ionicons name="time" size={14} color={activeTab === 'daily' ? '#FF4B4B' : '#AFAFAF'} />
            <Text style={[styles.timerText, activeTab === 'daily' && { color: '#FF4B4B', fontWeight: 'bold' }]}>
              {activeTab === 'daily' ? `Kapanışa: ${dailyTimeLeft}` : `Kalan Süre: ${weeklyTimeLeft}`}
            </Text>
          </View>
        </View>
      </View>

      {/* BİLGİLENDİRME ŞERİDİ */}
      <View style={[styles.infoBanner, activeTab === 'daily' && { backgroundColor: '#FFF0F0', borderBottomColor: '#FDD' }]}>
        <Text style={[styles.infoBannerText, activeTab === 'daily' && { color: '#D93838' }]}>
          {activeTab === 'daily' 
            ? '⚡ Bugün ilk 2 sıraya gir, bu gece yarısı ödülleri kap!' 
            : '💚 Haftayı ilk 2 sırada tamamla, bir üst lige yüksel!'}
        </Text>
      </View>

      {/* SIRALAMA LİSTESİ */}
      <FlatList
        data={competitors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const rank = index + 1;
          const isUser = item.isUser;
          const isTopTwo = rank <= 2;

          return (
            <View style={[styles.rankCard, isUser && styles.activeUserCard]}>
              <View style={styles.rankLeftSection}>
                <Text style={[styles.rankIndex, isTopTwo && styles.promotionRankIndex]}>
                  {rank}
                </Text>
                <Text style={styles.avatarEmoji}>{item.avatar}</Text>
              </View>

              <Text style={[styles.competitorName, isUser && styles.activeUserText]} numberOfLines={1}>
                {item.name} {isUser && '⭐'}
              </Text>

              <View style={styles.rankRightSection}>
                {/* Günlük sekmede rekabet hissi için XP'yi sembolik olarak biraz farklı simüle edebiliriz istersek */}
                <Text style={styles.xpScoreText}>{item.xp} XP</Text>
                {isTopTwo ? (
                  <Ionicons name="arrow-up-circle" size={20} color="#58CC02" style={styles.statusIcon} />
                ) : (
                  <Ionicons name="ellipse" size={8} color="#D1D1D1" style={styles.statusIconHorizontal} />
                )}
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    padding: 4,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 14,
    gap: 4
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 10,
    gap: 6
  },
  activeTabButton: {
    backgroundColor: colors.white,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabButtonText: {
    ...textStyles.bodyBold,
    fontSize: 14,
    color: '#666'
  },
  activeTabButtonText: {
    color: '#A349A4' // Uygulamanın asil mor tonu
  },
  headerCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 2, borderBottomColor: colors.borderLight },
  headerTextContainer: { marginLeft: spacing.base, flex: 1 },
  leagueTitle: { ...textStyles.heading, fontSize: 24, color: colors.textPrimary },
  timerBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  timerText: { ...textStyles.body, fontSize: 13, color: colors.textMuted },
  infoBanner: { backgroundColor: '#E5F9E0', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: '#D4F0CD' },
  infoBannerText: { ...textStyles.bodyBold, fontSize: 13, color: '#277814' },
  listContainer: { padding: spacing.md },
  rankCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, paddingVertical: spacing.base, paddingHorizontal: spacing.md, borderRadius: 16, borderWidth: 2, borderColor: colors.borderLight, marginBottom: spacing.xs },
  activeUserCard: { borderColor: '#FFD700', backgroundColor: '#FFFDF0' },
  rankLeftSection: { flexDirection: 'row', alignItems: 'center', width: 60 },
  rankIndex: { ...textStyles.bodyBold, fontSize: 16, color: colors.textMuted, width: 24, textAlign: 'center' },
  promotionRankIndex: { color: '#58CC02', fontSize: 18 },
  avatarEmoji: { fontSize: 22, marginLeft: 4 },
  competitorName: { ...textStyles.body, fontSize: 16, color: colors.textPrimary, flex: 1, paddingHorizontal: spacing.xs },
  activeUserText: { fontWeight: 'bold', color: '#E69A00' },
  rankRightSection: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  xpScoreText: { ...textStyles.bodyBold, fontSize: 14, color: colors.textSecondary },
  statusIcon: { marginLeft: 8 },
  statusIconHorizontal: { marginLeft: 14, marginRight: 6 },
});