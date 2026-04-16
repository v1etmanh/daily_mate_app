// utils/database.js
// Firebase Firestore replacement cho expo-sqlite
// Giữ nguyên interface: initDB(), và db object với các method tương thích

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc,
  collection, query, where, orderBy, limit,
  getDocs, serverTimestamp,
} from 'firebase/firestore';
import { firestore } from './firebaseConfig';

// ─── Device ID (thay cho user auth) ───────────────────────────────────────────
// Mỗi máy có 1 deviceId duy nhất, dùng làm "user namespace" trên Firestore
let _deviceId = null;

export async function getDeviceId() {
  if (_deviceId) return _deviceId;
  let id = await AsyncStorage.getItem('device_id');
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    await AsyncStorage.setItem('device_id', id);
  }
  _deviceId = id;
  return id;
}

// ─── Cấu trúc collection trên Firestore ───────────────────────────────────────
// profiles/{deviceId}                          ← personal_profile
// body_metrics/{deviceId}/entries/{autoId}     ← body_metrics
// allergies/{deviceId}/items/{allergyKey}      ← allergy_list
// settings/{deviceId}/kv/{key}                 ← settings_kv
// sessions/{deviceId}/records/{autoId}         ← recommendation_sessions
// sessions/{deviceId}/records/{sessionId}/dishes/{autoId}  ← recommended_dishes
// feedback/{deviceId}/items/{autoId}           ← dish_feedback
// weather_cache/{gridKey}                      ← weather_cache_local (shared)

function profileRef(deviceId)      { return doc(firestore, 'profiles', deviceId); }
function metricsCol(deviceId)      { return collection(firestore, 'body_metrics', deviceId, 'entries'); }
function allergiesCol(deviceId)    { return collection(firestore, 'allergies', deviceId, 'items'); }
function allergyRef(deviceId, key) { return doc(firestore, 'allergies', deviceId, 'items', key); }
function settingsRef(deviceId, k)  { return doc(firestore, 'settings', deviceId, 'kv', k); }
function sessionsCol(deviceId)     { return collection(firestore, 'sessions', deviceId, 'records'); }
function sessionRef(deviceId, sid) { return doc(firestore, 'sessions', deviceId, 'records', sid); }
function dishesCol(deviceId, sid)  { return collection(firestore, 'sessions', deviceId, 'records', sid, 'dishes'); }
function feedbackCol(deviceId)     { return collection(firestore, 'feedback', deviceId, 'items'); }
function weatherRef(gridKey)       { return doc(firestore, 'weather_cache', gridKey); }

// ─── initDB  (không cần tạo table, Firestore tự tạo) ─────────────────────────
export async function initDB() {
  await getDeviceId(); // đảm bảo deviceId tồn tại
  console.log('[DB] Firebase Firestore ready. deviceId:', _deviceId);
}

// ─── Timeout helper — Firestore call không được block >5s ─────────────────────
function withTimeout(promise, ms = 5000, fallback = null) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => {
      console.warn('[DB] Firestore timeout — trả fallback');
      resolve(fallback);
    }, ms)),
  ]);
}

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export async function saveProfile(data) {
  const id = await getDeviceId();
  await setDoc(profileRef(id), { ...data, updated_at: new Date().toISOString() }, { merge: true });
}

export async function loadProfile() {
  const id = await getDeviceId();
  const snap = await withTimeout(getDoc(profileRef(id)), 5000, null);
  return snap && snap.exists() ? { id: 1, ...snap.data() } : null;
}

// ─── BODY METRICS ─────────────────────────────────────────────────────────────
export async function saveBodyMetrics(data) {
  const id = await getDeviceId();
  const ref = await addDoc(metricsCol(id), { ...data, measured_at: data.measured_at || new Date().toISOString() });
  return ref.id;
}

export async function loadLatestMetrics() {
  const id = await getDeviceId();
  const q = query(metricsCol(id), orderBy('measured_at', 'desc'), limit(1));
  const snap = await withTimeout(getDocs(q), 5000, null);
  if (!snap || snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function loadAllMetrics() {
  const id = await getDeviceId();
  const q = query(metricsCol(id), orderBy('measured_at', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── ALLERGIES ────────────────────────────────────────────────────────────────
export async function addAllergy(allergyKey, displayName) {
  const id = await getDeviceId();
  await setDoc(allergyRef(id, allergyKey), {
    allergy_key: allergyKey,
    display_name: displayName,
    added_at: new Date().toISOString(),
  });
}

export async function removeAllergy(allergyKey) {
  const id = await getDeviceId();
  await deleteDoc(allergyRef(id, allergyKey));
}

export async function loadAllergies() {
  const id = await getDeviceId();
  const snap = await withTimeout(getDocs(allergiesCol(id)), 5000, null);
  if (!snap) return [];
  return snap.docs.map(d => d.data());
}

// ─── SETTINGS KV ──────────────────────────────────────────────────────────────
export async function setSetting(key, value) {
  // 1. Lưu local ngay lập tức (không chờ network)
  console.log(`[DB] setSetting ${key} = ${value}`);
  await AsyncStorage.setItem(`setting_${key}`, String(value));
  // 2. Sync lên Firestore async (không block UI)
  const id = await getDeviceId();
  setDoc(settingsRef(id, key), { key, value: String(value) }).catch(e =>
    console.warn('[DB] setSetting Firestore sync failed:', e.code)
  );
}

export async function getSetting(key) {
   const local = await AsyncStorage.getItem(`setting_${key}`);
  if (local !== null) return local;
  // 2. Fallback lên Firestore
  const id = await getDeviceId();
  const snap = await withTimeout(getDoc(settingsRef(id, key)), 5000, null);
  return snap && snap.exists() ? snap.data().value : null;
}

// ─── RECOMMENDATION SESSIONS ──────────────────────────────────────────────────
export async function saveSession(sessionData) {
  const id = await getDeviceId();
  const ref = await addDoc(sessionsCol(id), {
    ...sessionData,
    created_at: sessionData.created_at || new Date().toISOString(),
    synced_to_server: 0,
  });
  return ref.id;
}

export async function loadSessions(limitCount = 20) {
  const id = await getDeviceId();
  const q = query(sessionsCol(id), orderBy('created_at', 'desc'), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function loadSessionById(sessionId) {
  const id = await getDeviceId();
  const snap = await getDoc(sessionRef(id, sessionId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── RECOMMENDED DISHES ───────────────────────────────────────────────────────
export async function saveDishesToSession(sessionId, dishes) {
  const id = await getDeviceId();
  const col = dishesCol(id, sessionId);
  const promises = dishes.map(dish => addDoc(col, dish));
  await Promise.all(promises);
}

export async function loadDishesBySession(sessionId) {
  const id = await getDeviceId();
  const q = query(dishesCol(id, sessionId), orderBy('rank', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ─── DISH FEEDBACK ────────────────────────────────────────────────────────────
export async function saveFeedback(feedbackData) {
  const id = await getDeviceId();
  const ref = await addDoc(feedbackCol(id), {
    ...feedbackData,
    feedback_at: feedbackData.feedback_at || new Date().toISOString(),
    synced_to_server: 0,
  });
  return ref.id;
}

export async function loadFeedbackBySession(sessionId) {
  const id = await getDeviceId();
  const q = query(feedbackCol(id), where('session_id', '==', sessionId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

/**
 * F04 — Anti-repetition: lấy danh sách dish_id đã xuất hiện trong n session gần nhất.
 * Trả về mảng dish_id (string), ordered gần nhất → xa nhất (tối đa 30 dishes).
 * @param {number} nSessions - số session gần nhất cần lookback (mặc định 3)
 */
export async function getRecentDishIds(nSessions = 3) {
  try {
    const id = await getDeviceId();
    // Lấy n session gần nhất
    const q = query(sessionsCol(id), orderBy('created_at', 'desc'), limit(nSessions));
    const sessSnap = await withTimeout(getDocs(q), 5000, null);
    if (!sessSnap || sessSnap.empty) return [];

    // Với mỗi session, lấy dishes đã được gợi ý (ordered by rank)
    const allDishIds = [];
    const seenIds = new Set();
    for (const sessionDoc of sessSnap.docs) {
      const dishQ = query(dishesCol(id, sessionDoc.id), orderBy('rank', 'asc'));
      const dishSnap = await withTimeout(getDocs(dishQ), 4000, null);
      if (!dishSnap) continue;
      for (const d of dishSnap.docs) {
        const dishId = String(d.data().dish_id || '');
        if (dishId && !seenIds.has(dishId)) {
          seenIds.add(dishId);
          allDishIds.push(dishId);
        }
      }
    }
    // Trả tối đa 30 dish_id, ordered gần nhất → xa nhất
    return allDishIds.slice(0, 30);
  } catch (e) {
    console.warn('[DB] getRecentDishIds error:', e);
    return [];
  }
}

// ─── WEATHER CACHE ────────────────────────────────────────────────────────────
// Dùng AsyncStorage làm primary cache (instant, offline-safe)
// Firestore chỉ dùng để sync nếu cần — không block pipeline chính

const WEATHER_CACHE_PREFIX = 'weather_cache_';

export async function getWeatherCache(gridKey) {
  try {
    // Ưu tiên AsyncStorage — không cần network, không hang
    const raw = await AsyncStorage.getItem(WEATHER_CACHE_PREFIX + gridKey);
    if (raw) {
      const data = JSON.parse(raw);
      if (new Date(data.expires_at) > new Date()) return data;
    }
  } catch (e) {
    console.warn('[WeatherCache] AsyncStorage read error:', e);
  }
  return null;
}

export async function setWeatherCache(gridKey, weatherData, ttlMinutes = 30) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  const payload = {
    grid_key:   gridKey,
    ...weatherData,
    fetched_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  };
  try {
    await AsyncStorage.setItem(WEATHER_CACHE_PREFIX + gridKey, JSON.stringify(payload));
  } catch (e) {
    console.warn('[WeatherCache] AsyncStorage write error:', e);
  }
}

// ─── INGREDIENTS REF (read-only — seed từ server, dùng cho MarketBasket) ─────
// Collection: ingredients_ref/{ingredientId}
function ingredientsCol() { return collection(firestore, 'ingredients_ref'); }

export async function loadIngredientCategories() {
  const snap = await getDocs(ingredientsCol());
  const cats = new Set();
  snap.docs.forEach(d => { if (d.data().category) cats.add(d.data().category); });
  return Array.from(cats).sort().map(c => ({ category: c }));
}

export async function loadIngredientsByCategories(categoryKeys) {
  if (!categoryKeys || categoryKeys.length === 0) return [];
  // Firestore 'in' max 10 giá trị — chunk nếu nhiều hơn
  const results = [];
  for (let i = 0; i < categoryKeys.length; i += 10) {
    const chunk = categoryKeys.slice(i, i + 10);
    const q = query(ingredientsCol(), where('category', 'in', chunk), orderBy('name'));
    const snap = await getDocs(q);
    snap.docs.forEach(d => results.push({ id: d.id, ...d.data() }));
  }
  return results;
}

// ─── CHALLENGE HISTORY ────────────────────────────────────────────────────────
// Lưu local bằng AsyncStorage (offline-safe). Firestore sync optional.
const CHALLENGE_PREFIX = 'challenge_history_';

export async function saveChallengeHistory({ challenge_date, dish_id, dish_title }) {
  const key = CHALLENGE_PREFIX + challenge_date;
  const record = { challenge_date, dish_id, dish_title, completed: 0, completed_at: null };
  await AsyncStorage.setItem(key, JSON.stringify(record));
  return record;
}

export async function markChallengeCompleted(challenge_date) {
  const key = CHALLENGE_PREFIX + challenge_date;
  try {
    const raw = await AsyncStorage.getItem(key);
    const record = raw ? JSON.parse(raw) : { challenge_date, dish_id: '', dish_title: '', completed: 0 };
    record.completed    = 1;
    record.completed_at = new Date().toISOString();
    await AsyncStorage.setItem(key, JSON.stringify(record));
    return record;
  } catch (e) {
    console.warn('[ChallengeHistory] markCompleted error:', e);
    return null;
  }
}

export async function loadChallengeHistory(limitCount = 30) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const challengeKeys = keys.filter(k => k.startsWith(CHALLENGE_PREFIX))
      .sort().reverse().slice(0, limitCount);
    if (!challengeKeys.length) return [];
    const pairs = await AsyncStorage.multiGet(challengeKeys);
    return pairs.map(([, v]) => v ? JSON.parse(v) : null).filter(Boolean);
  } catch (e) {
    console.warn('[ChallengeHistory] load error:', e);
    return [];
  }
}

export async function getChallengeDateRecord(challenge_date) {
  try {
    const raw = await AsyncStorage.getItem(CHALLENGE_PREFIX + challenge_date);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export async function computeStreak() {
  const history = await loadChallengeHistory(60);
  const completedSet = new Set(history.filter(r => r.completed).map(r => r.challenge_date));
  let streak = 0;
  const today = new Date();
  // Streak tính từ hôm qua trở về (không penalty nếu hôm nay chưa làm)
  for (let i = 1; i <= 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10).replace(/-/g, '');
    if (completedSet.has(dateStr)) { streak++; } else { break; }
  }
  return streak;
}

// ─── CLEAR ALL HISTORY (Firestore) ───────────────────────────────────────────
export async function clearAllHistory() {
  const id = await getDeviceId();
  const sessions = await getDocs(sessionsCol(id));
  const deletes = [];
  for (const sessionDoc of sessions.docs) {
    const dishSnap = await getDocs(dishesCol(id, sessionDoc.id));
    dishSnap.docs.forEach(d => deletes.push(deleteDoc(d.ref)));
    deletes.push(deleteDoc(sessionDoc.ref));
  }
  const feedbackSnap = await getDocs(feedbackCol(id));
  feedbackSnap.docs.forEach(d => deletes.push(deleteDoc(d.ref)));
  await Promise.all(deletes);
}

// ─── db object — chỉ còn dùng bởi useAppStore (load profile/metrics/location)
export const db = {
  getAllAsync: async (sql) => {
    if (sql.includes('personal_profile')) return [await loadProfile()].filter(Boolean);
    if (sql.includes('body_metrics'))     return await loadAllMetrics();
    if (sql.includes('allergy_list'))     return await loadAllergies();
    console.warn('[db.getAllAsync] unsupported:', sql);
    return [];
  },

  getFirstAsync: async (sql) => {
    if (sql.includes('body_metrics'))            return await loadLatestMetrics();
    if (sql.includes("'last_known_lat'"))        return { value: await getSetting('last_known_lat') };
    if (sql.includes("'last_known_lon'"))        return { value: await getSetting('last_known_lon') };
    if (sql.includes("'last_known_province'"))   return { value: await getSetting('last_known_province') };
    console.warn('[db.getFirstAsync] unsupported:', sql);
    return null;
  },

  runAsync: async () => ({ lastInsertRowId: null, changes: 0 }),
  execAsync: async () => {},
};
