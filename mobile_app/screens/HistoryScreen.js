import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, FlatList
} from 'react-native';
import { loadSessions, loadDishesBySession, loadFeedbackBySession } from '../utils/database';

const HistoryScreen = ({ navigation }) => {
  const [historySessions, setHistorySessions] = useState([]);

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const sessions = await loadSessions(20);

      const sessionsWithDishes = await Promise.all(
        sessions.map(async (session) => {
          const [dishes, feedback] = await Promise.all([
            loadDishesBySession(session.id),
            loadFeedbackBySession(session.id),
          ]);
          const eatenIds = new Set(
            feedback.filter(f => f.action_type === 'eaten').map(f => f.dish_id)
          );
          return {
            ...session,
            dishes: dishes.slice(0, 3),
            eatenDishes: dishes.filter(d => eatenIds.has(d.dish_id)).map(d => d.title),
          };
        })
      );

      setHistorySessions(sessionsWithDishes);
    } catch (e) {
      console.error('loadHistory:', e);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString())
      return 'Hôm nay, ' + date.toLocaleDateString('vi-VN');
    if (date.toDateString() === yesterday.toDateString())
      return 'Hôm qua, ' + date.toLocaleDateString('vi-VN');
    return date.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric' });
  };

  const renderSession = ({ item }) => (
    <TouchableOpacity style={styles.sessionCard}
      onPress={() => navigation.navigate('HistoryDetail', { sessionId: item.id })}>
      <View style={styles.weatherInfo}>
        <Text style={styles.weatherEmoji}>🌤️</Text>
        <Text style={styles.temp}>{formatDate(item.created_at)} · {item.province || ''}</Text>
      </View>
      <Text style={styles.sessionDetails}>
        Gợi ý {item.dishes.length} món · {new Date(item.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
      </Text>
      {item.eatenDishes.length > 0 && (
        <Text style={styles.eatenInfo}>Đã ăn: {item.eatenDishes.join(', ')}</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử gợi ý</Text>
      </View>
      <FlatList data={historySessions} renderItem={renderSession}
        keyExtractor={item => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent} />
      <View style={styles.analyticsSection}>
        <Text style={styles.analyticsTitle}>THÁNG NÀY</Text>
        <Text style={styles.analyticsItem}>Đã nhận gợi ý: {historySessions.length} lần</Text>
        <Text style={styles.analyticsItem}>
          Đã ăn: {historySessions.reduce((s, sess) => s + sess.eatenDishes.length, 0)} món
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#f5f5f5' },
  header:           { backgroundColor: 'white', paddingHorizontal: 16, paddingVertical: 16 },
  title:            { fontSize: 20, fontWeight: 'bold' },
  listContent:      { padding: 16 },
  sessionCard:      { backgroundColor: 'white', borderRadius: 12, padding: 16,
                      marginBottom: 12, elevation: 2 },
  weatherInfo:      { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  weatherEmoji:     { fontSize: 20, marginRight: 8 },
  temp:             { fontSize: 14, fontWeight: '600', flex: 1 },
  sessionDetails:   { fontSize: 14, color: '#666', marginBottom: 4 },
  eatenInfo:        { fontSize: 14, color: '#007AFF', fontStyle: 'italic' },
  analyticsSection: { backgroundColor: 'white', margin: 16, padding: 16, borderRadius: 12 },
  analyticsTitle:   { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#333' },
  analyticsItem:    { fontSize: 14, color: '#666', marginBottom: 8 },
});

export default HistoryScreen;
