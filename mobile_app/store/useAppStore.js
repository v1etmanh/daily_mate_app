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
}));
