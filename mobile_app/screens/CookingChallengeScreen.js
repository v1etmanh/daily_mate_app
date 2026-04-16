import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { C, R, F, shadow } from '../theme';
import {
  saveChallengeHistory, markChallengeCompleted,
  getChallengeDateRecord, computeStreak,
} from '../utils/database';

const DIFFICULTY_LABEL = { easy: '🟢 Dễ', medium: '🟡 Vừa', hard: '🔴 Khó' };
const NATION_FLAG = { Vietnam: '🇻🇳', Japan: '🇯🇵', Korea: '🇰🇷', Thailand: '🇹🇭', Italy: '🇮🇹' };

export default function CookingChallengeScreen({ navigation }) {
  const { location } = useAppStore();
  const [loading, setLoading]   = useState(true);
  const [challenge, setChallenge] = useState(null);
  const [streak, setStreak]     = useState(0);
  const [completed, setCompleted] = useState(false);
  const [todayKey, setTodayKey] = useState('');

  useFocusEffect(useCallback(() => { loadChallenge(); }, [location]));

  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
  };

  const loadChallenge = async () => {
    setLoading(true);
    try {
      const key = getTodayKey();
      setTodayKey(key);

      const lat = location?.lat || 16.047;
      const lon = location?.lon || 108.206;
      const res = await api.get(`/api/v1/challenge?lat=${lat}&lon=${lon}`);
      const data = res.data;
      setChallenge(data.challenge_dish);

      // Lưu vào local history nếu chưa có
      const existing = await getChallengeDateRecord(key);
      if (!existing) {
        await saveChallengeHistory({
          challenge_date: key,
          dish_id: data.challenge_dish.dish_id,
          dish_title: data.challenge_dish.title,
        });
      } else {
        setCompleted(existing.completed === 1);
      }

      const s = await computeStreak();
      setStreak(s);
    } catch (e) {
      console.error('[Challenge] load error:', e);
      Alert.alert('Lỗi', 'Không thể tải thử thách. Kiểm tra kết nối server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDone = async () => {
    if (completed) { navigation.navigate('DishDetail', { dish: challenge }); return; }
    await markChallengeCompleted(todayKey);
    setCompleted(true);
    const s = await computeStreak();
    setStreak(s + 1);
    Alert.alert('🎉 Tuyệt vời!', `Bạn đã hoàn thành thử thách hôm nay!${s > 0 ? `\n🔥 Chuỗi ${s + 1} ngày liên tiếp!` : ''}`, [
      { text: 'OK' },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Đang chọn thử thách cho bạn...</Text>
      </View>
    );
  }

  if (!challenge) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyIcon}>🍽️</Text>
        <Text style={styles.emptyText}>Chưa có thử thách hôm nay</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadChallenge}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const flag = NATION_FLAG[challenge.nation] || '🍴';
  const today = new Date();
  const dateLabel = `${today.toLocaleDateString('vi-VN', { weekday: 'long' })}, ${today.getDate()}/${today.getMonth()+1}`;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#1A5276', '#117A65']} style={styles.headerGrad}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <Text style={styles.headerLabel}>🏆 Thử thách hôm nay</Text>
        <Text style={styles.headerDate}>{dateLabel}</Text>
      </LinearGradient>

      {/* Hero Image */}
      <View style={styles.heroWrap}>
        {challenge.image_url
          ? <Image source={{ uri: challenge.image_url }} style={styles.heroImg} resizeMode="cover" />
          : <View style={styles.heroFallback}><Text style={styles.heroEmoji}>🍜</Text></View>
        }
        {completed && (
          <View style={styles.doneOverlay}>
            <Text style={styles.doneOverlayText}>✅ Đã hoàn thành!</Text>
          </View>
        )}
      </View>

      {/* Dish info */}
      <View style={styles.card}>
        <Text style={styles.dishTitle}>{challenge.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaChip}>{flag} {challenge.nation || 'Việt Nam'}</Text>
          <Text style={styles.metaChip}>⏱ {challenge.cook_time_min} phút</Text>
          <Text style={styles.metaChip}>{DIFFICULTY_LABEL[challenge.difficulty] || '🟡 Vừa'}</Text>
        </View>
      </View>

      {/* Why today */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>TẠI SAO HÔM NAY?</Text>
        <Text style={styles.whyText}>{challenge.why_today}</Text>
      </View>

      {/* Tips */}
      {challenge.tips?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MẸO NHỎ</Text>
          {challenge.tips.map((tip, i) => (
            <Text key={i} style={styles.tipItem}>• {tip}</Text>
          ))}
        </View>
      )}

      {/* Streak */}
      {streak > 0 && (
        <View style={styles.streakBanner}>
          <Text style={styles.streakText}>🔥 Chuỗi {streak} ngày liên tiếp!</Text>
        </View>
      )}

      {/* CTA Buttons */}
      <View style={styles.ctaRow}>
        <TouchableOpacity
          style={[styles.ctaBtn, styles.ctaPrimary, completed && styles.ctaDone]}
          onPress={handleDone}
          activeOpacity={0.85}>
          <Text style={styles.ctaPrimaryText}>
            {completed ? '👀 Xem chi tiết' : '✅ Tôi đã nấu xong!'}
          </Text>
        </TouchableOpacity>
        {!completed && (
          <TouchableOpacity
            style={[styles.ctaBtn, styles.ctaSecondary]}
            onPress={() => navigation.navigate('DishDetail', { dish: challenge })}
            activeOpacity={0.85}>
            <Text style={styles.ctaSecondaryText}>📖 Xem hướng dẫn đầy đủ</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  center:         { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  loadingText:    { marginTop: 12, color: C.textLight, fontSize: F.base },
  emptyIcon:      { fontSize: 48, marginBottom: 12 },
  emptyText:      { fontSize: F.lg, color: C.text, fontWeight: '600' },
  retryBtn:       { marginTop: 16, backgroundColor: C.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: R.pill },
  retryText:      { color: 'white', fontWeight: '700' },
  headerGrad:     { paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20 },
  backBtn:        { marginBottom: 12 },
  backText:       { color: 'rgba(255,255,255,0.8)', fontSize: F.sm },
  headerLabel:    { fontSize: F.h2, fontWeight: '800', color: 'white' },
  headerDate:     { fontSize: F.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  heroWrap:       { height: 240, position: 'relative', backgroundColor: '#e0e0e0' },
  heroImg:        { width: '100%', height: '100%' },
  heroFallback:   { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', backgroundColor: C.surfaceAlt },
  heroEmoji:      { fontSize: 72 },
  doneOverlay:    { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center' },
  doneOverlayText:{ fontSize: 28, fontWeight: '800', color: 'white' },
  card:           { margin: 16, backgroundColor: C.surface, borderRadius: R.lg, padding: 18, ...shadow(2) },
  dishTitle:      { fontSize: F.xl, fontWeight: '800', color: C.text, marginBottom: 10 },
  metaRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip:       { fontSize: F.sm, backgroundColor: C.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: R.pill, color: C.textMid, fontWeight: '600' },
  section:        { marginHorizontal: 16, marginBottom: 14, backgroundColor: C.surface, borderRadius: R.lg, padding: 16, ...shadow(1) },
  sectionTitle:   { fontSize: F.xs, fontWeight: '800', color: C.primary, letterSpacing: 1, marginBottom: 8 },
  whyText:        { fontSize: F.base, color: C.text, lineHeight: 22 },
  tipItem:        { fontSize: F.base, color: C.textMid, lineHeight: 24 },
  streakBanner:   { marginHorizontal: 16, marginBottom: 14, backgroundColor: '#FFF3E0', borderRadius: R.lg, padding: 14, alignItems: 'center' },
  streakText:     { fontSize: F.lg, fontWeight: '700', color: '#E65100' },
  ctaRow:         { marginHorizontal: 16, gap: 10 },
  ctaBtn:         { borderRadius: R.pill, paddingVertical: 15, alignItems: 'center' },
  ctaPrimary:     { backgroundColor: C.primary },
  ctaDone:        { backgroundColor: C.teal },
  ctaPrimaryText: { color: 'white', fontSize: F.base, fontWeight: '700' },
  ctaSecondary:   { backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  ctaSecondaryText: { color: C.primary, fontSize: F.base, fontWeight: '700' },
});
