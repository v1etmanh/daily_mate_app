// store/useAppStore.js
import { create } from 'zustand';
import { loadProfile, loadLatestMetrics, loadAllergies, getSetting } from '../utils/database';

export const useAppStore = create((set, get) => ({
  profile:          null,
  latestMetrics:    null,
  allergies:        [],
  currentSession:   null,
  currentSessionId: null,
  rankedDishes:     [],
  isLoading:        false,
  error:            null,
  location:         { lat: null, lon: null, province: '', food_region: '' },
  maxPrepTime:      60,   // F02: thời gian nấu tối đa (phút). 999 = không giới hạn
  costPreference:   2,    // F03: 1=Tiết kiệm | 2=Vừa phải | 3=Thoải mái

  // MarketBasket — giỏ nguyên liệu của phiên hiện tại
  marketBasket: {
    selectedIngredients: [],  // Array<number> ingredient_id
    isSkipped:           true,
    boostStrategy:       'strict',
  },

  setProfile:          (profile)   => set({ profile }),
  setLatestMetrics:    (metrics)   => set({ latestMetrics: metrics }),
  setAllergies:        (allergies) => set({ allergies: [...allergies] }),
  setCurrentSession:   (session)   => set({ currentSession: session }),
  setCurrentSessionId: (id)        => set({ currentSessionId: id }),
  setRankedDishes:     (dishes)    => set({ rankedDishes: [...dishes] }),
  setLoading:          (loading)   => set({ isLoading: loading }),
  setError:            (error)     => set({ error }),
  setLocation:         (location)  => set({ location }),
  setMaxPrepTime:      (val)       => set({ maxPrepTime: Number(val) }),
  setCostPreference:   (val)       => set({ costPreference: Number(val) }),  // F03

  setMarketBasket: (basket) => set({
    marketBasket: {
      selectedIngredients: basket.selectedIngredients ?? [],
      isSkipped:           basket.isSkipped ?? false,
      boostStrategy:       basket.boostStrategy ?? 'strict',
    },
  }),

  clearMarketBasket: () => set({
    marketBasket: { selectedIngredients: [], isSkipped: true, boostStrategy: 'strict' },
  }),

  loadProfile: async () => {
    try {
      const profile = await loadProfile();
      if (profile) set({ profile });
      return profile;
    } catch (e) { console.error('loadProfile:', e); return null; }
  },

  loadLatestMetrics: async () => {
    try {
      const metrics = await loadLatestMetrics();
      if (metrics) set({ latestMetrics: metrics });
      return metrics;
    } catch (e) { console.error('loadLatestMetrics:', e); return null; }
  },

  loadAllergies: async () => {
    try {
      const rows = await loadAllergies();
      const allergies = rows.map(r => r.allergy_key);
      set({ allergies });
      return allergies;
    } catch (e) { console.error('loadAllergies:', e); return []; }
  },

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
    } catch (e) { console.error('initializeLocation:', e); return { lat: null, lon: null, province: '', food_region: '' }; }
  },

  // F02: load max_prep_time từ settings_kv khi app khởi động
  initializeMaxPrepTime: async () => {
    try {
      const val = await getSetting('max_cook_time');
      console.log('initializeMaxPrepTime:', val);
      const parsed = val ? parseInt(val, 10) : 60;
      set({ maxPrepTime: isNaN(parsed) ? 60 : parsed });
    } catch (e) { console.error('initializeMaxPrepTime:', e); }
  },

  // F03: load cost_preference từ settings_kv khi app khởi động
  initializeCostPreference: async () => {
    try {
      const val = await getSetting('cost_preference');
      console.log('initializeCostPreference:', val);
      const parsed = val ? parseInt(val, 10) : 2;
      set({ costPreference: isNaN(parsed) ? 2 : parsed });
    } catch (e) { console.error('initializeCostPreference:', e); }
  },
}));
