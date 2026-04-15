import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Linking, Image, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { saveFeedback, loadSessions } from '../utils/database';
import { C } from '../theme';

const DishDetailScreen = ({ route, navigation }) => {
  const { dish } = route.params;
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating]         = useState(0);
  const [ingredients, setIngredients]               = useState([]);
  const [loadingDetail, setLoadingDetail]           = useState(true);

  useEffect(() => { loadDetail(); }, []);

  // ✅ FIX: Load nguyên liệu thật từ API
  const loadDetail = async () => {
    try {
      const dishId = dish.dish_id || dish.id;
      if (!dishId) return;
      const res = await api.get(`/api/v1/dishes/${dishId}`);
      setIngredients(res.data.ingredients || []);
    } catch (e) {
      console.error('loadDetail:', e);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleFeedback = async (action, rating = null) => {
    try {
      const sessions = await loadSessions(1);
      if (sessions.length > 0) {
        await saveFeedback({
          session_id:  sessions[0].id,
          dish_id:     dish.dish_id || dish.id,
          action,
          rating,
          feedback_at: new Date().toISOString(),
        });
      }
      if (action === 'rated') setRatingModalVisible(false);
    } catch (e) { console.error('handleFeedback:', e); }
  };

  const ScoreBar = ({ label, value, color = '#4CAF50' }) => (
    <View style={styles.barRow}>
      <Text style={styles.barLabel}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.min(100, Math.round((value || 0) * 100))}%`, backgroundColor: color }]} />
      </View>
      <Text style={styles.barVal}>{Math.round((value || 0) * 100)}%</Text>
    </View>
  );

  const breakdown = dish.score_breakdown || {};
  const mainIngredients = ingredients.filter(i => i.is_main);
  const sideIngredients = ingredients.filter(i => !i.is_main);


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView style={styles.container}>
        {/* ✅ FIX: Back button thật */}
        <View style={styles.navBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>          <Text style={styles.navTitle} numberOfLines={1}>{dish.title}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Hero */}
        {dish.image_url
          ? <Image source={{ uri: dish.image_url }} style={styles.heroBanner} resizeMode="cover" />
          : <LinearGradient colors={['#7B241C', '#E74C3C']} style={styles.heroBanner}>
              <Text style={{ fontSize: 72 }}>🍜</Text>
            </LinearGradient>
        }

        <View style={styles.content}>
          {/* Title + Meta */}
          <Text style={styles.title}>{dish.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.chip}><Text style={styles.chipText}>🌏 {dish.nation || 'Việt Nam'}</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>⏱ {dish.cook_time_min} phút</Text></View>
            <View style={styles.chip}><Text style={styles.chipText}>★ {((dish.final_score || 0) * 100).toFixed(0)}%</Text></View>
          </View>

          {/* Lý do gợi ý */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TẠI SAO ĐƯỢC GỢI Ý</Text>
            {(dish.explanation || []).map((exp, i) => (
              <Text key={i} style={styles.explanationItem}>• {exp}</Text>
            ))}
          </View>

          {/* Điểm phù hợp — dùng dữ liệu thật từ score_breakdown */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ĐIỂM PHÙ HỢP</Text>
            <ScoreBar label="Tổng thể"  value={dish.final_score}      color={C.primary} />
            {breakdown.hydration > 0 && <ScoreBar label="Hydration"  value={breakdown.hydration} color={C.teal} />}
            {breakdown.warming   > 0 && <ScoreBar label="Giữ ấm"    value={breakdown.warming}   color={C.orange} />}
            {breakdown.cooling   > 0 && <ScoreBar label="Làm mát"   value={breakdown.cooling}   color={C.success} />}
            {breakdown.boost     > 0 && <ScoreBar label="Nguyên liệu" value={breakdown.boost}   color={C.primaryMid} />}
          </View>

          {/* Nguyên liệu — ✅ FIX: Load thật từ API */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NGUYÊN LIỆU</Text>
            {loadingDetail ? (
              <ActivityIndicator color={C.primary} style={{ marginVertical: 12 }} />
            ) : ingredients.length === 0 ? (
              <Text style={styles.noData}>Không có dữ liệu nguyên liệu</Text>
            ) : (
              <>
                {mainIngredients.length > 0 && (
                  <>
                    <Text style={styles.ingGroupTitle}>Chính</Text>
                    <View style={styles.ingGrid}>
                      {mainIngredients.map(ing => (
                        <View key={ing.id} style={styles.ingChip}>
                          <Text style={styles.ingText}>{ing.name}</Text>
                          {ing.quantity_g > 0 && <Text style={styles.ingQty}>{ing.quantity_g}g</Text>}
                        </View>
                      ))}
                    </View>
                  </>
                )}
                {sideIngredients.length > 0 && (
                  <>
                    <Text style={[styles.ingGroupTitle, { marginTop: 10 }]}>Gia vị & phụ</Text>
                    <View style={styles.ingGrid}>
                      {sideIngredients.map(ing => (
                        <View key={ing.id} style={[styles.ingChip, styles.ingChipSide]}>
                          <Text style={[styles.ingText, { color: '#888' }]}>{ing.name}</Text>
                        </View>
                      ))}
                    </View>
                  </>
                )}
              </>
            )}
          </View>

          {/* Gợi ý phục vụ */}
          {dish.serving_suggestion ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>GỢI Ý PHỤC VỤ</Text>
              <Text style={styles.servingText}>{dish.serving_suggestion}</Text>
            </View>
          ) : null}

          {/* Xem công thức */}
          {dish.url ? (
            <TouchableOpacity style={styles.recipeBtn}
              onPress={() => Linking.openURL(dish.url)}>
              <Text style={styles.recipeBtnText}>📖 Xem công thức đầy đủ</Text>
            </TouchableOpacity>
          ) : null}

          {/* Feedback */}
          <View style={styles.feedbackSection}>
            <Text style={styles.feedbackQ}>Bạn có muốn ăn món này không?</Text>
            <View style={styles.feedbackRow}>
              <TouchableOpacity style={[styles.fbBig, { backgroundColor: C.success }]}
                onPress={() => handleFeedback('eaten')}>
                <Text style={styles.fbBigText}>😋 Đã ăn</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.fbBig, { backgroundColor: C.amber }]}
                onPress={() => setRatingModalVisible(true)}>
                <Text style={[styles.fbBigText, { color: '#333' }]}>⭐ Đánh giá</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.fbBig, { backgroundColor: C.danger }]}
                onPress={() => handleFeedback('skipped')}>
                <Text style={styles.fbBigText}>✕ Bỏ qua</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Rating Modal */}
      <Modal animationType="slide" transparent visible={ratingModalVisible}
        onRequestClose={() => setRatingModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bạn thích món này đến đâu?</Text>
            <View style={{ flexDirection: 'row', marginBottom: 24 }}>
              {[1,2,3,4,5].map(n => (
                <TouchableOpacity key={n} onPress={() => setSelectedRating(n)} style={{ padding: 6 }}>
                  <Text style={{ fontSize: 32, color: n <= selectedRating ? '#FFCC00' : '#ddd' }}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setRatingModalVisible(false)}>
                <Text style={{ color: '#666', fontWeight: '600' }}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSubmit, !selectedRating && { opacity: 0.4 }]}
                onPress={() => handleFeedback('rated', selectedRating)} disabled={!selectedRating}>
                <Text style={{ color: 'white', fontWeight: '600' }}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};


const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f2f2f7' },
  navBar:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 12, paddingVertical: 10, backgroundColor: 'white',
                    borderBottomWidth: 0.5, borderBottomColor: '#e0e0e0' },
  backBtn:        { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  backIcon:       { fontSize: 32, color: '#007AFF', lineHeight: 38, marginTop: -4 },
  navTitle:       { flex: 1, fontSize: 16, fontWeight: '600', textAlign: 'center', color: '#111', marginHorizontal: 8 },
  heroBanner:     { width: '100%', height: 220, justifyContent: 'center', alignItems: 'center' },
  content:        { padding: 16 },
  title:          { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 10 },
  metaRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip:           { backgroundColor: '#f0f0f5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipText:       { fontSize: 12, color: '#444', fontWeight: '500' },
  section:        { backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12,
                    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  sectionTitle:   { fontSize: 12, fontWeight: '700', color: '#999', letterSpacing: 0.5, marginBottom: 12 },
  explanationItem:{ fontSize: 14, color: '#444', lineHeight: 22, marginBottom: 6 },
  barRow:         { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  barLabel:       { width: 82, fontSize: 13, color: '#555' },
  barTrack:       { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden' },
  barFill:        { height: '100%', borderRadius: 4 },
  barVal:         { width: 38, textAlign: 'right', fontSize: 12, color: '#888' },
  ingGroupTitle:  { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 },
  ingGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingChip:        { backgroundColor: '#e8f0ff', borderRadius: 20, paddingVertical: 5, paddingHorizontal: 12 },
  ingChipSide:    { backgroundColor: '#f5f5f5' },
  ingText:        { fontSize: 13, color: '#1a56e0', fontWeight: '500' },
  ingQty:         { fontSize: 11, color: '#888', marginTop: 1 },
  noData:         { fontSize: 14, color: '#aaa', fontStyle: 'italic' },
  servingText:    { fontSize: 14, color: '#555', fontStyle: 'italic', lineHeight: 22 },
  recipeBtn:      { backgroundColor: '#f0f6ff', borderRadius: 12, padding: 14, alignItems: 'center',
                    marginBottom: 12, borderWidth: 1, borderColor: '#c7deff' },
  recipeBtnText:  { fontSize: 15, color: '#007AFF', fontWeight: '600' },
  feedbackSection:{ backgroundColor: 'white', borderRadius: 14, padding: 16, marginBottom: 12 },
  feedbackQ:      { fontSize: 15, fontWeight: '600', color: '#111', textAlign: 'center', marginBottom: 14 },
  feedbackRow:    { flexDirection: 'row', gap: 8 },
  fbBig:          { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  fbBigText:      { color: 'white', fontWeight: '700', fontSize: 13 },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard:      { backgroundColor: 'white', borderRadius: 18, padding: 28, width: '80%', alignItems: 'center' },
  modalTitle:     { fontSize: 17, fontWeight: '700', marginBottom: 20, textAlign: 'center', color: '#111' },
  modalCancel:    { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#f0f0f0', alignItems: 'center' },
  modalSubmit:    { flex: 1, padding: 12, borderRadius: 10, backgroundColor: '#007AFF', alignItems: 'center' },
});

export default DishDetailScreen;
