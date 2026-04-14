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

// ─── PROFILE ──────────────────────────────────────────────────────────────────
export async function saveProfile(data) {
  const id = await getDeviceId();
  await setDoc(profileRef(id), { ...data, updated_at: new Date().toISOString() }, { merge: true });
}

export async function loadProfile() {
  const id = await getDeviceId();
  const snap = await getDoc(profileRef(id));
  return snap.exists() ? { id: 1, ...snap.data() } : null;
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
  const snap = await getDocs(q);
  if (snap.empty) return null;
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
  const snap = await getDocs(allergiesCol(id));
  return snap.docs.map(d => d.data());
}

// ─── SETTINGS KV ──────────────────────────────────────────────────────────────
export async function setSetting(key, value) {
  const id = await getDeviceId();
  await setDoc(settingsRef(id, key), { key, value: String(value) });
}

export async function getSetting(key) {
  const id = await getDeviceId();
  const snap = await getDoc(settingsRef(id, key));
  return snap.exists() ? snap.data().value : null;
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

// ─── WEATHER CACHE ────────────────────────────────────────────────────────────
export async function getWeatherCache(gridKey) {
  const snap = await getDoc(weatherRef(gridKey));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (new Date(data.expires_at) < new Date()) return null; // expired
  return data;
}

export async function setWeatherCache(gridKey, weatherVector, ttlMinutes = 30) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
  await setDoc(weatherRef(gridKey), {
    grid_key: gridKey,
    weather_vector: weatherVector,
    fetched_at: now.toISOString(),
    expires_at: expiresAt.toISOString(),
  });
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
