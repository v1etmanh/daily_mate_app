import React, { useState, useCallback,useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image, Alert, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../services/api';
import { useAppStore } from '../store/useAppStore';
import { C, R, F, shadow } from '../theme';
import {
  saveSession, saveDishesToSession, saveFeedback,
  loadSessions, loadDishesBySession,
  getWeatherCache, setWeatherCache, setSetting,
} from '../utils/database';

const HomeScreen = ({ navigation }) => {
  const isLoadingRef = React.useRef(false);
  const [isLoading, setIsLoading]         = useState(false);
  const [weatherData, setWeatherData]     = useState(null);
  const [cuisineScope, setCuisineScope]   = useState('vietnam');
  const [dishTypeFilter, setDishTypeFilter] = useState('all'); // 'all' | 'soup' | 'main_dish'
  const [refreshing, setRefreshing]       = useState(false);
  const [basketBadge, setBasketBadge]     = useState(0);
  const [challengeTitle, setChallengeTitle] = useState('');
const isFirstRender = React.useRef(true);
useEffect(() => {
  if (isFirstRender.current) {
    isFirstRender.current = false;
    return; // ← bỏ qua lần mount đầu, tránh double-call với useFocusEffect
  }
  loadRecommendation();
}, [cuisineScope, dishTypeFilter]); // ← re-fetch mỗi khi filter thay đổi
  const {
    profile, latestMetrics, rankedDishes, setRankedDishes,
    location, setLocation, allergies, currentSessionId,
    setCurrentSessionId, marketBasket, maxPrepTime,costPreference
  } = useAppStore();

  // Tự động re-fetch khi màn hình được focus lại (sau khi quay từ MarketBasket)
  useFocusEffect(
    useCallback(() => {
      const count = marketBasket?.selectedIngredients?.length ?? 0;
      setBasketBadge(count);
      // Fetch challenge title để hiển thị banner
      const lat = location?.lat || 16.047;
      const lon = location?.lon || 108.206;
      api.get(`/api/v1/challenge?lat=${lat}&lon=${lon}`)
        .then(r => setChallengeTitle(r.data?.challenge_dish?.title || ''))
        .catch(() => {});
      // Re-fetch nếu basket vừa được cập nhật (không phải lần đầu)
      if (!marketBasket.isSkipped && count > 0 && rankedDishes.length > 0) {
        loadRecommendation();
      } else if (rankedDishes.length === 0) {
        loadRecommendation();
      }
    }, [marketBasket])
  );

  // ─── Location ────────────────────────────────────────────────────────────────
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return null;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return { lat: loc.coords.latitude, lon: loc.coords.longitude };
    } catch { return null; }
  };

  const buildGridKey = (lat, lon) =>
    `${Math.round(lat * 10) / 10}:${Math.round(lon * 10) / 10}`;

  const fetchWeather = async (lat, lon) => {
    const gridKey = buildGridKey(lat, lon);
    const cached  = await getWeatherCache(gridKey);
    if (cached) {
      // ✅ Set weatherData từ cache nếu có flat fields
      const flatFromCache = cached.weather_vector ? cached : null;
      if (flatFromCache && flatFromCache.temperature != null) setWeatherData(flatFromCache);
      return cached.weather_vector ?? cached;
    }
    try {
      const res = await api.get(`/api/weather?lat=${lat}&lon=${lon}`);
      const hour = new Date().getHours();
      await setWeatherCache(gridKey, res.data, hour >= 6 && hour < 22 ? 30 : 60);
      setWeatherData(res.data); // ✅ res.data có đủ temperature, condition, humidity, wind_speed, aqi
      return res.data;
    } catch {
      const fallback = { temperature: 30, condition: 'Không rõ (offline)', humidity: 70, wind_speed: 10, aqi: 85 };
      setWeatherData(fallback); // ✅ Luôn set weatherData dù lỗi
      return fallback;
    }
  };

  const loadFallbackDishes = async () => {
    try {
      const sessions = await loadSessions(1);
      if (!sessions.length) return [];
      return await loadDishesBySession(sessions[0].id);
    } catch { return []; }
  };

  const persistSession = async (result, params) => {
    try {
      const sid = await saveSession({
        created_at:     new Date().toISOString(),
        lat:            params.lat,
        lon:            params.lon,
        province:       params.province || '',
        food_region:    params.food_region || '',
        cuisine_scope:  params.cuisineScope,
        basket_skipped: params.marketBasket.isSkipped ? 1 : 0,
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
          image_url:        d.image_url || '',
          url:              d.url || '',
          score_breakdown:  d.score_breakdown || {},
        })));
      }
    } catch (e) { console.error('persistSession:', e); }
  };


  // ─── Main load ───────────────────────────────────────────────────────────────
  const loadRecommendation = async () => {
    if (isLoadingRef.current) return; // ✅ Guard chống double-call
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const gps = await getUserLocation();
      const currentLocation = gps || location || { lat: 16.047, lon: 108.206, province: 'Đà Nẵng' };
      setLocation(currentLocation);
      if (gps) {
        await setSetting('last_known_lat', String(gps.lat));
        await setSetting('last_known_lon', String(gps.lon));
      }

      const weather = await fetchWeather(currentLocation.lat, currentLocation.lon);

      // ✅ FIX: Gửi đầy đủ personal payload bao gồm height/weight/health
      const personal = {
        age:              profile?.age || 25,
        gender:           profile?.gender || 'female',
        height:           latestMetrics?.height_cm || 160,
        weight:           latestMetrics?.weight_kg || 55,
        diet_type:        profile?.diet_type || 'omnivore',
        dietary_goal:     profile?.dietary_goal || 'maintenance',
        activity_level:   profile?.activity_level || 'moderately_active',
        health_condition: profile?.health_condition || [],
        taste_preference: profile?.taste_preference || [],
        allergies:        allergies || [],
        max_prep_time:    maxPrepTime ?? 60,   // F02
        cost_preference: costPreference.toString() || '2',   // F03
      };

      // ✅ FIX: Truyền marketBasket vào API
      const basket = marketBasket.isSkipped
        ? { is_skipped: true, selected_ingredient_ids: [], boost_strategy: 'none' }
        : {
            is_skipped: false,
            selected_ingredient_ids: marketBasket.selectedIngredients,
            boost_strategy: marketBasket.boostStrategy,
          };

      try {
        const res = await api.post('/api/v1/recommend', {
          lat: currentLocation.lat, lon: currentLocation.lon,
          weather, personal,
          cuisine_scope:    cuisineScope,
          selected_nation:  null,
          dish_type_filter: dishTypeFilter,
          market_basket:    basket,
          

        });
        setRankedDishes(res.data.ranked_dishes || []);
        await persistSession(res.data, { ...currentLocation, cuisineScope, marketBasket });
      } catch (apiErr) {
        console.error('recommend API:', apiErr);
        const fallback = await loadFallbackDishes();
        if (fallback.length) {
          setRankedDishes(fallback);
          Alert.alert('Offline', 'Không thể kết nối server — đang hiển thị gợi ý cũ.');
        } else {
          Alert.alert('Lỗi kết nối', 'Kiểm tra IP server trong services/api.js và đảm bảo server đang chạy.');
        }
      }
    } catch (e) {
      console.error('loadRecommendation:', e);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadRecommendation(); setRefreshing(false); };

  const handleQuickFeedback = async (dishId, action) => {
    try {
      if (!currentSessionId) return;
      await saveFeedback({ session_id: currentSessionId, dish_id: dishId, action_type: action, feedback_at: new Date().toISOString() });
    } catch (e) { console.error('handleQuickFeedback:', e); }
  };

  const getWeatherGradient = (temperature, condition) => {
    if (!temperature) return ['#2C3E50', '#3498DB'];
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('rain') || cond.includes('mưa')) return ['#1F3A4C', '#2C5364'];
    if (temperature < 20) return ['#1E3A5F', '#2E86C1'];
    if (temperature <= 28) return ['#1A5276', '#117A65'];
    if (temperature <= 33) return ['#784212', '#E67E22'];
    return ['#7B241C', '#E74C3C'];
  };


  // ─── Dish Card (Horizontal) ───────────────────────────────────────────────
  const renderDishCardH = (item) => (
    <TouchableOpacity key={item.dish_id || item.rank}
      style={styles.dishCard}
      onPress={() => navigation.navigate('DishDetail', { dish: item })}
      activeOpacity={0.85}>
      <View style={styles.cardImageWrap}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
          : <View style={styles.imagePlaceholder}><Text style={styles.dishEmoji}>🍜</Text></View>
        }
        <View style={styles.rankBadge}><Text style={styles.rankText}>#{item.rank}</Text></View>
        {item.ingredient_boost > 0 && (
          <View style={styles.boostBadge}><Text style={styles.boostText}>🛒 {Math.round(item.ingredient_boost * 100)}%</Text></View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.dishTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.metaChip}>⏱ {item.cook_time_min}p</Text>
          <Text style={styles.metaChip}>★ {(item.final_score * 100).toFixed(0)}%</Text>
        </View>
        {item.explanation?.length > 0 && (
          <Text style={styles.cardHint} numberOfLines={2}>{item.explanation[0]}</Text>
        )}
        <View style={styles.quickFeedback}>
          <TouchableOpacity style={[styles.fbBtn, styles.eatBtn]}
            onPress={() => handleQuickFeedback(item.dish_id, 'eaten')}>
            <Text style={styles.fbText}>😋 Ăn</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.fbBtn, styles.skipBtn]}
            onPress={() => handleQuickFeedback(item.dish_id, 'skipped')}>
            <Text style={styles.fbText}>✕ Bỏ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  // ─── List Row (Vertical) ──────────────────────────────────────────────────
  const renderListRow = (item) => (
    <TouchableOpacity key={item.dish_id || item.rank}
      style={styles.listItem}
      onPress={() => navigation.navigate('DishDetail', { dish: item })}
      activeOpacity={0.85}>
      <View style={styles.listImageWrap}>
        {item.image_url
          ? <Image source={{ uri: item.image_url }} style={styles.listImage} resizeMode="cover" />
          : <View style={styles.listImageFallback}><Text style={{ fontSize: 22 }}>🍜</Text></View>
        }
      </View>
      <View style={styles.listContent}>
        <Text style={styles.listTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.listMetaRow}>
          <Text style={styles.listMeta}>⏱ {item.cook_time_min}p</Text>
          <Text style={styles.listMeta}>★ {(item.final_score * 100).toFixed(0)}%</Text>
          <Text style={styles.listMeta}>{item.nation || 'Việt Nam'}</Text>
        </View>
        {item.explanation?.[0] && (
          <Text style={styles.listHint} numberOfLines={1}>{item.explanation[0]}</Text>
        )}
      </View>
      <View style={styles.listActions}>
        <TouchableOpacity style={[styles.miniFb, styles.eatBtn]}
          onPress={() => handleQuickFeedback(item.dish_id, 'eaten')}>
          <Text style={{ fontSize: 14 }}>😋</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.miniFb, styles.skipBtn]}
          onPress={() => handleQuickFeedback(item.dish_id, 'skipped')}>
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 12 }}>✕</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );


  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    // ✅ FIX: Chỉ dùng ScrollView, không dùng FlatList lồng nhau
    <ScrollView style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />}>

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.province}>{location?.province || 'Đang xác định...'}</Text>
          <Text style={styles.date}>Hôm nay, {new Date().toLocaleDateString('vi-VN')}</Text>
        </View>
        {isLoading && <ActivityIndicator color={C.primary} />}
      </View>

      {/* Weather Card */}
      <LinearGradient colors={getWeatherGradient(weatherData?.temperature, weatherData?.condition)}
        style={styles.weatherCard}>
        <Text style={styles.weatherCity}>{location?.province || 'Vị trí'}</Text>
        {weatherData ? (
          <>
            <Text style={styles.weatherTemp}>{weatherData.temperature}°C</Text>
            <Text style={styles.weatherCond}>{weatherData.condition}</Text>
            <View style={styles.weatherDetails}>
              <Text style={styles.weatherDetail}>💧 {weatherData.humidity}%</Text>
              <Text style={styles.weatherDetail}>💨 {weatherData.wind_speed} km/h</Text>
              <Text style={styles.weatherDetail}>🌫️ AQI {Math.round(weatherData.aqi)}</Text>
            </View>
          </>
        ) : (
          <ActivityIndicator color="white" style={{ marginVertical: 20 }} />
        )}
      </LinearGradient>

      {/* Cuisine Scope */}
      <View style={styles.scopeRow}>
        {[
          { key: 'vietnam', label: '🇻🇳 Việt Nam' },
          { key: 'global',  label: '🌍 Toàn cầu' },
        ].map(({ key, label }) => (
          <TouchableOpacity key={key}
            style={[styles.scopeBtn, cuisineScope === key && styles.scopeBtnActive]}
            onPress={() => setCuisineScope(key)}>
            <Text style={[styles.scopeText, cuisineScope === key && styles.scopeTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Dish Type Filter */}
      <View style={styles.dishTypeRow}>
        {[
          { key: 'all',       label: '🍽️ Tất cả' },
          { key: 'soup',      label: '🥣 Canh / Súp' },
          { key: 'main_dish', label: '🍖 Món mặn' },
        ].map(({ key, label }) => (
          <TouchableOpacity key={key}
            style={[styles.dishTypeBtn, dishTypeFilter === key && styles.dishTypeBtnActive]}
            onPress={() => setDishTypeFilter(key)}
            >
            <Text style={[styles.dishTypeText, dishTypeFilter === key && styles.dishTypeTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Challenge Banner */}
      {challengeTitle !== '' && (
        <TouchableOpacity style={styles.challengeBanner}
          onPress={() => navigation.navigate('CookingChallenge')}
          activeOpacity={0.85}>
          <Text style={styles.challengeIcon}>🏆</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.challengeLabel}>Thử thách hôm nay</Text>
            <Text style={styles.challengeTitle} numberOfLines={1}>{challengeTitle}</Text>
          </View>
          <Text style={styles.challengeArrow}>›</Text>
        </TouchableOpacity>
      )}

      {/* Market Basket CTA */}
      <TouchableOpacity style={styles.basketCTA}
        onPress={() => navigation.navigate('MarketBasket')} activeOpacity={0.85}>
        <Text style={styles.basketIcon}>🛒</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.basketTitle}>
            {basketBadge > 0 ? `Đã chọn ${basketBadge} nguyên liệu` : 'Bạn đã mua gì hôm nay?'}
          </Text>
          <Text style={styles.basketSub}>Tap để cập nhật giỏ hàng</Text>
        </View>
        {basketBadge > 0 && (
          <View style={styles.basketBadge}><Text style={styles.basketBadgeText}>{basketBadge}</Text></View>
        )}
        <Text style={styles.basketArrow}>›</Text>
      </TouchableOpacity>

      {/* Horizontal Cards (top 3) */}
      {rankedDishes.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Gợi ý cho bạn hôm nay</Text>
          {/* ✅ FIX: ScrollView horizontal thay vì FlatList lồng ScrollView */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hListContent}>
            {rankedDishes.slice(0, 3).map(renderDishCardH)}
          </ScrollView>
        </>
      )}

      {/* Vertical List (4–10) */}
      {rankedDishes.length > 3 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Gợi ý khác</Text>
          {rankedDishes.slice(3).map(renderListRow)}
        </View>
      )}

      {/* Empty state */}
      {!isLoading && rankedDishes.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyTitle}>Chưa có gợi ý nào</Text>
          <Text style={styles.emptySub}>Kéo xuống để tải gợi ý</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
};


const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                     paddingHorizontal: 16, paddingVertical: 14, backgroundColor: C.surface },
  province:        { fontSize: 18, fontWeight: '700', color: C.text },
  date:            { fontSize: 13, color: C.textLight, marginTop: 2 },
  weatherCard:     { marginHorizontal: 16, marginTop: 12, padding: 20, borderRadius: 18, elevation: 3,
                     shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 6 },
  weatherCity:     { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontWeight: '600' },
  weatherTemp:     { fontSize: 52, fontWeight: '700', color: 'white', marginTop: 4 },
  weatherCond:     { fontSize: 16, color: 'rgba(255,255,255,0.9)', marginTop: -4 },
  weatherDetails:  { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  weatherDetail:   { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  scopeRow:        { flexDirection: 'row', marginHorizontal: 16, marginTop: 12,
                     backgroundColor: 'white', borderRadius: 25, padding: 4, elevation: 1 },
  scopeBtn:        { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 20 },
  scopeBtnActive:  { backgroundColor: C.primary },
  scopeText:       { fontSize: 14, fontWeight: '500', color: C.textMid },
  scopeTextActive: { color: 'white' },
  dishTypeRow:     { flexDirection: 'row', marginHorizontal: 16, marginTop: 8,
                     backgroundColor: 'white', borderRadius: 25, padding: 4, elevation: 1 },
  dishTypeBtn:     { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 20 },
  dishTypeBtnActive: { backgroundColor: '#E67E22' },
  dishTypeText:    { fontSize: 12, fontWeight: '500', color: C.textMid },
  dishTypeTextActive: { color: 'white', fontWeight: '700' },
  basketCTA:       { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12,
                     backgroundColor: 'white', borderRadius: 14, padding: 14, elevation: 2,
                     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 },
  basketIcon:      { fontSize: 22, marginRight: 10 },
  basketTitle:     { fontSize: 14, fontWeight: '600', color: C.text },
  basketSub:       { fontSize: 12, color: '#888', marginTop: 2 },
  basketBadge:     { backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, marginRight: 6 },
  basketBadgeText: { color: 'white', fontSize: 12, fontWeight: '600' },
  basketArrow:     { fontSize: 20, color: '#ccc', fontWeight: '300' },
  challengeBanner: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8,
                     backgroundColor: '#FFF3E0', borderRadius: 14, padding: 12, borderLeftWidth: 4, borderLeftColor: '#FF7640' },
  challengeIcon:   { fontSize: 22, marginRight: 10 },
  challengeLabel:  { fontSize: 11, fontWeight: '700', color: '#BF5800', letterSpacing: 0.5 },
  challengeTitle:  { fontSize: 14, fontWeight: '700', color: '#333', marginTop: 2 },
  challengeArrow:  { fontSize: 20, color: '#FF7640', fontWeight: '700' },
  sectionTitle:    { fontSize: 17, fontWeight: '700', marginHorizontal: 16, marginTop: 16, marginBottom: 10, color: C.text },
  hListContent:    { paddingLeft: 16, paddingRight: 8 },
  dishCard:        { width: 200, backgroundColor: 'white', borderRadius: 16, marginRight: 12,
                     elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6, overflow: 'hidden' },
  cardImageWrap:   { position: 'relative', height: 120 },
  cardImage:       { width: '100%', height: '100%' },
  imagePlaceholder:{ width: '100%', height: '100%', backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  dishEmoji:       { fontSize: 40 },
  rankBadge:       { position: 'absolute', top: 8, left: 8, backgroundColor: C.primary,
                     borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  rankText:        { color: 'white', fontSize: 11, fontWeight: '700' },
  boostBadge:      { position: 'absolute', top: 8, right: 8, backgroundColor: C.orange,
                     borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  boostText:       { color: 'white', fontSize: 10, fontWeight: '600' },
  cardBody:        { padding: 12 },
  dishTitle:       { fontSize: 14, fontWeight: '700', color: '#111', lineHeight: 20 },
  cardMeta:        { flexDirection: 'row', marginTop: 6, gap: 6 },
  metaChip:        { fontSize: 11, color: '#888', backgroundColor: '#f5f5f5', paddingHorizontal: 6,
                     paddingVertical: 2, borderRadius: 8 },
  cardHint:        { fontSize: 11, color: '#888', marginTop: 6, lineHeight: 16 },
  quickFeedback:   { flexDirection: 'row', gap: 6, marginTop: 10 },
  fbBtn:           { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  fbText:          { color: 'white', fontSize: 12, fontWeight: '600' },
  eatBtn:          { backgroundColor: C.success },
  skipBtn:         { backgroundColor: C.danger },
  listItem:        { flexDirection: 'row', backgroundColor: 'white', marginHorizontal: 16,
                     marginBottom: 8, borderRadius: 12, elevation: 1, overflow: 'hidden',
                     shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 3 },
  listImageWrap:   { width: 76, height: 76 },
  listImage:       { width: '100%', height: '100%' },
  listImageFallback: { width: '100%', height: '100%', backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  listContent:     { flex: 1, padding: 10, justifyContent: 'center' },
  listTitle:       { fontSize: 14, fontWeight: '700', color: '#111' },
  listMetaRow:     { flexDirection: 'row', marginTop: 4, gap: 8 },
  listMeta:        { fontSize: 11, color: '#888' },
  listHint:        { fontSize: 11, color: '#aaa', marginTop: 3 },
  listActions:     { width: 52, justifyContent: 'center', alignItems: 'center', gap: 6, padding: 8 },
  miniFb:          { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  emptyState:      { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:       { fontSize: 48, marginBottom: 12 },
  emptyTitle:      { fontSize: 18, fontWeight: '600', color: '#333' },
  emptySub:        { fontSize: 14, color: '#888', marginTop: 4 },
});

export default HomeScreen;
