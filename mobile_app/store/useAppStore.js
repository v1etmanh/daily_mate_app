// store/useAppStore.js
import { create } from 'zustand';
import {
  loadProfile,
  loadLatestMetrics,
  loadAllergies,
  getSetting,
} from '../utils/database';

export const useAppStore = create((set, get) => ({
  // Profile
  profile: null,
  latestMetrics: null,
  allergies: [],

  // Session hiện tại
  currentSession: null,
  rankedDishes: [],

  // UI state
  isLoading: false,
  error: null,

  // Location
  location: { lat: null, lon: null, province: '', food_region: '' },

  // Actions
  setProfile:       (profile)   => set({ profile }),
  setLatestMetrics: (metrics)   => set({ latestMetrics: metrics }),
  setAllergies:     (allergies) => set({ allergies: [...allergies] }),
  setCurrentSession:(session)   => set({ currentSession: session }),
  setRankedDishes:  (dishes)    => set({ rankedDishes: [...dishes] }),
  setLoading:       (loading)   => set({ isLoading: loading }),
  setError:         (error)     => set({ error }),
  setLocation:      (location)  => set({ location }),

  // ── Load profile từ Firestore ──────────────────────────────────────────────
  loadProfile: async () => {
    try {
      const profile = await loadProfile();
      if (profile) set({ profile });
      return profile;
    } catch (e) {
      console.error('Error loading profile:', e);
      return null;
    }
  },

  // ── Load body metrics mới nhất ────────────────────────────────────────────
  loadLatestMetrics: async () => {
    try {
      const metrics = await loadLatestMetrics();
      if (metrics) set({ latestMetrics: metrics });
      return metrics;
    } catch (e) {
      console.error('Error loading latest metrics:', e);
      return null;
    }
  },

  // ── Load danh sách dị ứng ─────────────────────────────────────────────────
  loadAllergies: async () => {
    try {
      const rows = await loadAllergies();
      const allergies = rows.map(r => r.allergy_key);
      set({ allergies });
      return allergies;
    } catch (e) {
      console.error('Error loading allergies:', e);
      return [];
    }
  },

  // ── Load vị trí đã lưu từ settings ───────────────────────────────────────
  initializeLocation: async () => {
    try {
      const [lat, lon, province] = await Promise.all([
        getSetting('last_known_lat'),
        getSetting('last_known_lon'),
        getSetting('last_known_province'),
      ]);

      const location = {
        lat:         lat      ? parseFloat(lat) : null,
        lon:         lon      ? parseFloat(lon) : null,
        province:    province ?? '',
        food_region: '',
      };

      set({ location });
      return location;
    } catch (e) {
      console.error('Error initializing location:', e);
      return { lat: null, lon: null, province: '', food_region: '' };
    }
  },
}));
