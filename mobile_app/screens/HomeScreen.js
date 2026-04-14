import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, FlatList, Alert
} from 'react-native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import {
  saveSession, saveDishesToSession, saveFeedback,
  loadSessions, loadDishesBySession,
  getWeatherCache, setWeatherCache, setSetting,
} from '../utils/database';

const HomeScreen = ({ navigation }) => {
  const [isLoading, setIsLoading]                     = useState(false);
  const [weatherData, setWeatherData]                 = useState(null);
  const [cuisineScope, setCuisineScope]               = useState('vietnam');
  const [marketBasketCTAVisible, setMarketBasketCTAVisible] = useState(true);
  const [refreshing, setRefreshing]                   = useState(false);
  const [currentSessionId, setCurrentSessionId]       = useState(null);

  const { profile, rankedDishes, setRankedDishes, location, setLocation, allergies } = useAppStore();

  useEffect(() => { loadRecommendation(); }, []);

  // ─── Location ──────────────────────────────────────────────────────────────
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Quyền vị trí', 'Ứng dụng cần quyền vị trí để gợi ý món phù hợp.');
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: loc.coords.latitude, lon: loc.coords.longitude };
    } catch (e) {
      console.error('getUserLocation:', e);
      return null;
    }
  };

  // ─── Weather cache (Firestore) ────────────────────────────────────────────
  const buildGridKey = (lat, lon) =>
    `${Math.round(lat * 10) / 10}:${Math.round(lon * 10) / 10}`;

  const fetchWeather = async (lat, lon) => {
    const gridKey = buildGridKey(lat, lon);
    const cached  = await getWeatherCache(gridKey);
    if (cached) return cached.weather_vector;

    try {
      const res = await api.get(`/api/weather?lat=${lat}&lon=${lon}`);
      const hour = new Date().getHours();
      const ttl  = (hour >= 6 && hour < 22) ? 30 : 60;
      await setWeatherCache(gridKey, res.data, ttl);
      return res.data;
    } catch {
      return {
        temperature: 30, condition: 'Sunny', humidity: 70,
        wind_speed: 10, aqi: 85,
        explanation: ['Không thể tải thời tiết — dùng dữ liệu mặc định'],
      };
    }
  };

  // ─── Load fallback từ Firestore history ───────────────────────────────────
  const loadFallbackDishes = async () => {
    try {
      const sessions = await loadSessions(1);
      if (!sessions.length) return [];
      const dishes = await loadDishesBySession(sessions[0].id);
      return dishes;
    } catch (e) {
      console.error('loadFallbackDishes:', e);
      return [];
    }
  };

  // ─── Lưu session + dishes vào Firestore ───────────────────────────────────
  const persistSession = async (result, params) => {
    try {
      const now = new Date().toISOString();
      const sid = await saveSession({
        created_at:    now,
        lat:           params.lat,
        lon:           params.lon,
        province:      params.province || '',
        food_region:   params.food_region || '',
        cuisine_scope: params.cuisineScope,
        basket_skipped: params.marketBasket.length === 0 ? 1 : 0,
      });
      setCurrentSessionId(sid);

      if (result.ranked_dishes?.length) {
        await saveDishesToSession(sid, result.ranked_dishes.map(d => ({
          dish_id:          d.dish_id,
          rank:             d.rank,
          final_score:      d.final_score,
          ingredient_boost: d.ingredient_boost || 0,
          title:            d.title,
          nation:           d.nation || '',
          cook_time_min:    d.cook_time_min || 0,
          explanation:      d.explanation || [],
        })));
      }
    } catch (e) {
      console.error('persistSession:', e);
    }
  };

  // ─── Main load ────────────────────────────────────────────────────────────
  const loadRecommendation = async () => {
    setIsLoading(true);
    try {
      // 1. GPS
      const gps = await getUserLocation();
      const currentLocation = gps || location || { lat: 21.0285, lon: 105.8542, province: 'Hà Nội' };
      setLocation(currentLocation);

      // Lưu vị trí vào settings
      if (gps) {
        await setSetting('last_known_lat',  String(gps.lat));
        await setSetting('last_known_lon',  String(gps.lon));
      }

      // 2. Weather (Firestore cache → API)
      const weather = await fetchWeather(currentLocation.lat, currentLocation.lon);
      setWeatherData(weather);

      // 3. Personal payload
      const personal = {
        age:            profile?.age || 25,
        gender:         profile?.gender || 'female',
        diet_type:      profile?.diet_type || 'omnivore',
        dietary_goal:   profile?.dietary_goal || 'maintenance',
        activity_level: profile?.activity_level || 'moderately_active',
        allergies:      allergies || [],
      };

      // 4. Gọi backend recommend
      try {
        const res = await api.post('/api/v1/recommend', {
          lat: currentLocation.lat, lon: currentLocation.lon,
          weather, personal,
          cuisine_scope: cuisineScope, selected_nation: null, market_basket: [],
        });
        setRankedDishes(res.data.ranked_dishes || []);
        await persistSession(res.data, { ...currentLocation, cuisineScope, marketBasket: [] });
      } catch (apiErr) {
        console.error('recommend API:', apiErr);
        const fallback = await loadFallbackDishes();
        if (fallback.length) {
          setRankedDishes(fallback);
          Alert.alert('Offline', 'Không thể kết nối server — đang hiển thị gợi ý cũ.');
        } else {
          Alert.alert('Lỗi', 'Không thể tải gợi ý. Kiểm tra kết nối mạng.');
        }
      }
    } catch (e) {
      console.error('loadRecommendation:', e);
      Alert.alert('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRecommendation();
    setRefreshing(false);
  };

  // ─── Feedback ────────────────────────────────────────────────────────────
  const handleQuickFeedback = async (dishId, action) => {
    try {
      if (!currentSessionId) return;
      await saveFeedback({
        session_id:  currentSessionId,
        dish_id:     dishId,
        action_type: action,
        feedback_at: new Date().toISOString(),
      });
    } catch (e) {
      console.error('handleQuickFeedback:', e);
    }
  };

  // ─── Helpers ─────────────────────────────────────────────────────────────
  const getWeatherGradient = (temperature, condition) => {
    if (condition?.toLowerCase().includes('rain')) return ['#1F3A4C', '#2C5364'];
    if (temperature < 20)  return ['#1E3A5F', '#2E86C1'];
    if (temperature <= 28) return ['#1A5276', '#117A65'];
    if (temperature <= 33) return ['#784212', '#E67E22'];
    return ['#7B241C', '#E74C3C'];
  };

  // ─── Render helpers ───────────────────────────────────────────────────────
  const renderDishCard = ({ item }) => (
    <View style={styles.dishCard}>
      <View style={styles.imagePlaceholder}>
        <Text style={styles.dishEmoji}>🍜</Text>
      </View>
      <Text style={styles.rankBadge}>#{item.rank}</Text>
      <Text style={styles.dishTitle}>{item.title}</Text>
      <Text style={styles.cookTime}>⏱ {item.cook_time_min} phút</Text>
      <Text style={styles.score}>★ {(item.final_score * 100).toFixed(0)}%</Text>
      <Text style={styles.nation}>🇻🇳 {item.nation || 'Việt Nam'}</Text>
      {item.explanation?.length > 1 && (
        <Text style={styles.explanation}>{item.explanation[1]}</Text>
      )}
      <View style={styles.quickFeedback}>
        <TouchableOpacity style={[styles.feedbackButton, styles.eatButton]}
          onPress={() => handleQuickFeedback(item.dish_id, 'eaten')}>
          <Text style={styles.feedbackText}>😋 Ăn</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.feedbackButton, styles.skipButton]}
          onPress={() => handleQuickFeedback(item.dish_id, 'skipped')}>
          <Text style={styles.feedbackText}>✕ Bỏ</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.province}>{location.province || 'Đang xác định...'}</Text>
        <Text style={styles.date}>Hôm nay, {new Date().toLocaleDateString('vi-VN')}</Text>
      </View>

      {/* Weather Card */}
      {weatherData && (
        <LinearGradient colors={getWeatherGradient(weatherData.temperature, weatherData.condition)}
          style={styles.weatherCard}>
          <Text style={styles.city}>{location.province || 'Địa điểm'}</Text>
          <Text style={styles.smallText}>Ngày hôm nay</Text>
          <View style={styles.temperatureContainer}>
            <Text style={styles.temperature}>{weatherData.temperature}°C</Text>
            <Text style={styles.weatherCondition}>{weatherData.condition}</Text>
          </View>
          <View style={styles.weatherDetails}>
            <Text style={styles.detailItem}>💧 {weatherData.humidity}%</Text>
            <Text style={styles.detailItem}>💨 {weatherData.wind_speed}km/h</Text>
            <Text style={styles.detailItem}>🌫️ AQI {weatherData.aqi}</Text>
          </View>
          <Text style={styles.weatherExplanation}>
            {weatherData.explanation?.[0] || 'Dự báo thời tiết cho gợi ý món ăn phù hợp'}
          </Text>
        </LinearGradient>
      )}

      {/* Cuisine Scope */}
      <View style={styles.scopeSelector}>
        {[
          { key: 'vietnam', label: '🇻🇳 Việt Nam' },
          { key: 'global',  label: '🌍 Toàn cầu' },
          { key: 'specific',label: '🔍 Chọn...' },
        ].map(({ key, label }) => (
          <TouchableOpacity key={key}
            style={[styles.scopeButton, cuisineScope === key && styles.selectedScope]}
            onPress={() => {
              if (key === 'specific') {
                Alert.alert('Chọn quốc gia', 'Tính năng sẽ có trong phiên bản tới');
                return;
              }
              setCuisineScope(key);
              setTimeout(loadRecommendation, 300);
            }}>
            <Text style={[styles.scopeText, cuisineScope === key && styles.selectedScopeText]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Market Basket CTA */}
      {marketBasketCTAVisible && (
        <View style={styles.marketBasketCTA}>
          <View style={styles.ctaContent}>
            <Text style={styles.ctaIcon}>🛒</Text>
            <View style={styles.ctaTextContainer}>
              <Text style={styles.ctaTitle}>Bạn đã mua gì hôm nay?</Text>
              <Text style={styles.ctaSubtitle}>Chọn nguyên liệu để ưu tiên món phù hợp</Text>
            </View>
            <TouchableOpacity style={styles.ctaButton}
              onPress={() => navigation.navigate('MarketBasket')}>
              <Text style={styles.ctaButtonText}>→</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.dismissButton}
            onPress={() => setMarketBasketCTAVisible(false)}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Gợi ý chính (ngang) */}
      <Text style={styles.sectionTitle}>Gợi ý cho bạn hôm nay</Text>
      <FlatList horizontal data={rankedDishes.slice(0, 3)} renderItem={renderDishCard}
        keyExtractor={item => item.dish_id || String(item.rank)}
        showsHorizontalScrollIndicator={false}
        style={styles.horizontalList}
        contentContainerStyle={styles.horizontalListContent} />

      {/* View more */}
      <TouchableOpacity style={styles.viewMoreButton}
        onPress={() => Alert.alert('Thông báo', 'Tính năng sẽ có trong phiên bản tới')}>
        <Text style={styles.viewMoreText}>Xem thêm gợi ý ↓</Text>
      </TouchableOpacity>

      {/* Danh sách dọc còn lại */}
      <FlatList data={rankedDishes.slice(3)}
        keyExtractor={item => item.dish_id || String(item.rank)}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.listItem}
            onPress={() => navigation.navigate('DishDetail', { dish: item })}>
            <Text style={styles.listRank}>{item.rank}</Text>
            <View style={styles.listContent}>
              <Text style={styles.listTitle}>{item.title}</Text>
              <View style={styles.listMeta}>
                <Text style={styles.metaItem}>⏱ {item.cook_time_min} phút</Text>
                <Text style={styles.metaItem}>🇻🇳 {item.nation || 'Việt Nam'}</Text>
                <Text style={styles.metaItem}>★ {(item.final_score * 100).toFixed(0)}%</Text>
              </View>
              <Text style={styles.listExplanation}>{item.explanation?.[0] || ''}</Text>
            </View>
            <View style={styles.listActions}>
              <TouchableOpacity style={[styles.miniFeedbackButton, styles.eatButton]}
                onPress={e => { e.stopPropagation(); handleQuickFeedback(item.dish_id, 'eaten'); }}>
                <Text style={styles.miniFeedbackText}>😋</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.miniFeedbackButton, styles.skipButton]}
                onPress={e => { e.stopPropagation(); handleQuickFeedback(item.dish_id, 'skipped'); }}>
                <Text style={styles.miniFeedbackText}>✕</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:             { flex: 1, backgroundColor: '#f5f5f5' },
  header:                { padding: 16, backgroundColor: 'white' },
  province:              { fontSize: 18, fontWeight: 'bold' },
  date:                  { fontSize: 14, color: '#666' },
  weatherCard:           { margin: 16, padding: 20, borderRadius: 16, elevation: 3 },
  city:                  { color: 'white', fontSize: 16, fontWeight: '600' },
  smallText:             { color: 'rgba(255,255,255,0.8)', fontSize: 12 },
  temperatureContainer:  { alignItems: 'center', marginVertical: 10 },
  temperature:           { fontSize: 48, fontWeight: 'bold', color: 'white' },
  weatherCondition:      { fontSize: 18, color: 'white', marginTop: -5 },
  weatherDetails:        { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  detailItem:            { color: 'white', fontSize: 14 },
  weatherExplanation:    { color: 'white', fontStyle: 'italic', textAlign: 'center', marginTop: 10 },
  scopeSelector:         { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
                           backgroundColor: 'white', borderRadius: 25, padding: 4, elevation: 2 },
  scopeButton:           { flex: 1, padding: 12, alignItems: 'center', borderRadius: 20 },
  selectedScope:         { backgroundColor: '#007AFF' },
  scopeText:             { fontSize: 14, fontWeight: '500' },
  selectedScopeText:     { color: 'white' },
  marketBasketCTA:       { flexDirection: 'row', marginHorizontal: 16, marginBottom: 16,
                           backgroundColor: 'white', borderRadius: 12, padding: 12, elevation: 2 },
  ctaContent:            { flex: 1, flexDirection: 'row', alignItems: 'center' },
  ctaIcon:               { fontSize: 20, marginRight: 8 },
  ctaTextContainer:      { flex: 1 },
  ctaTitle:              { fontWeight: '600', fontSize: 14 },
  ctaSubtitle:           { fontSize: 12, color: '#666' },
  ctaButton:             { padding: 8 },
  ctaButtonText:         { fontSize: 16, fontWeight: 'bold' },
  dismissButton:         { padding: 8 },
  dismissText:           { fontSize: 16, fontWeight: 'bold', color: '#666' },
  sectionTitle:          { fontSize: 18, fontWeight: 'bold', marginHorizontal: 16, marginTop: 8, marginBottom: 12 },
  horizontalList:        { height: 240 },
  horizontalListContent: { paddingLeft: 16 },
  dishCard:              { width: 270, height: 220, backgroundColor: 'white', borderRadius: 16,
                           marginRight: 12, padding: 16, elevation: 3 },
  imagePlaceholder:      { height: 80, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  dishEmoji:             { fontSize: 40 },
  rankBadge:             { position: 'absolute', top: 8, left: 8, backgroundColor: '#007AFF',
                           color: 'white', paddingHorizontal: 8, paddingVertical: 2,
                           borderRadius: 10, fontSize: 12, fontWeight: 'bold' },
  dishTitle:             { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cookTime:              { fontSize: 12, color: '#666', marginBottom: 2 },
  score:                 { fontSize: 12, color: '#666', marginBottom: 2 },
  nation:                { fontSize: 12, color: '#666', marginBottom: 8 },
  explanation:           { fontSize: 12, fontStyle: 'italic', color: '#666', marginBottom: 12 },
  quickFeedback:         { flexDirection: 'row', justifyContent: 'space-between' },
  feedbackButton:        { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  eatButton:             { backgroundColor: '#4CD964', marginRight: 4 },
  skipButton:            { backgroundColor: '#FF3B30', marginLeft: 4 },
  feedbackText:          { color: 'white', fontWeight: 'bold' },
  viewMoreButton:        { marginHorizontal: 16, marginVertical: 16, padding: 12,
                           backgroundColor: 'white', borderRadius: 8, alignItems: 'center', elevation: 2 },
  viewMoreText:          { fontSize: 16, fontWeight: 'bold', color: '#007AFF' },
  listItem:              { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 16,
                           marginBottom: 8, padding: 12, borderRadius: 8, elevation: 1 },
  listRank:              { width: 30, fontSize: 16, fontWeight: 'bold', color: '#666',
                           textAlign: 'center', alignSelf: 'center' },
  listContent:           { flex: 1, marginLeft: 8 },
  listTitle:             { fontSize: 16, fontWeight: 'bold' },
  listMeta:              { flexDirection: 'row', marginTop: 4 },
  metaItem:              { fontSize: 12, color: '#666', marginRight: 12 },
  listExplanation:       { fontSize: 12, color: '#666', marginTop: 4 },
  listActions:           { flexDirection: 'row', justifyContent: 'flex-end', width: 60 },
  miniFeedbackButton:    { width: 30, height: 30, borderRadius: 15, alignItems: 'center',
                           justifyContent: 'center', marginLeft: 4 },
  miniFeedbackText:      { fontSize: 14, color: 'white' },
});

export default HomeScreen;
