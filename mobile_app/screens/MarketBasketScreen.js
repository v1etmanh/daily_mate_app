import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator,
} from 'react-native';
import { loadIngredientCategories, loadIngredientsByCategories } from '../utils/database';
import { useAppStore } from '../store/useAppStore';
import { C, R, F, shadow } from '../theme';

const CATEGORY_META = {
  vegetable:  { display: 'Rau củ',     emoji: '🥦' },
  fruit:      { display: 'Trái cây',   emoji: '🍎' },
  protein:    { display: 'Đạm',        emoji: '🍖' },
  grain:      { display: 'Tinh bột',   emoji: '🌾' },
  dairy:      { display: 'Sữa & Trứng',emoji: '🥛' },
  spice:      { display: 'Gia vị',     emoji: '🧄' },
  fat:        { display: 'Dầu mỡ',    emoji: '🫙' },
  condiment:  { display: 'Nước chấm',  emoji: '🍶' },
};

const MarketBasketScreen = ({ navigation }) => {
  const [categories, setCategories]         = useState([]);
  const [selectedCats, setSelectedCats]     = useState([]);
  const [ingredients, setIngredients]       = useState([]);
  const [selectedIds, setSelectedIds]       = useState([]);
  const [loading, setLoading]               = useState(true);
  const [step, setStep]                     = useState(1);

  const { setMarketBasket } = useAppStore();

  useEffect(() => { loadCats(); }, []);

  const loadCats = async () => {
    try {
      const result = await loadIngredientCategories();
      setCategories(result.map(r => ({
        key: r.category,
        ...CATEGORY_META[r.category] || { display: r.category, emoji: '🥬' },
      })));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleCat = async (key) => {
    const next = selectedCats.includes(key)
      ? selectedCats.filter(c => c !== key)
      : [...selectedCats, key];
    setSelectedCats(next);
    if (next.length > 0) {
      setStep(2);
      try {
        const res = await loadIngredientsByCategories(next);
        setIngredients(res);
      } catch (e) { console.error(e); }
    } else {
      setStep(1);
      setIngredients([]);
    }
  };

  const toggleId = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleApply = () => {
    setMarketBasket({
      isSkipped: false,
      selectedIngredients: selectedIds,
      boostStrategy: 'strict',
    });
    navigation.goBack();
  };

  const handleSkip = () => {
    setMarketBasket({ isSkipped: true, selectedIngredients: [], boostStrategy: 'none' });
    navigation.goBack();
  };

  const grouped = ingredients.reduce((acc, i) => {
    (acc[i.category] = acc[i.category] || []).push(i);
    return acc;
  }, {});

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>🛒 Đi chợ hôm nay</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={s.skipLink}>Bỏ qua</Text>
        </TouchableOpacity>
      </View>

      {/* Step indicators */}
      <View style={s.stepBar}>
        {[1, 2].map(n => (
          <View key={n} style={[s.stepDot, step >= n && s.stepDotActive]}>
            <Text style={[s.stepNum, step >= n && s.stepNumActive]}>{n}</Text>
          </View>
        ))}
        <View style={[s.stepLine, step >= 2 && s.stepLineActive]} />
        <Text style={s.stepHint}>
          {step === 1 ? 'Chọn nhóm nguyên liệu' : `Chọn nguyên liệu (${selectedIds.length} đã chọn)`}
        </Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {loading ? (
          <ActivityIndicator color={C.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Step 1: Categories */}
            <Text style={s.sectionTitle}>Nhóm nguyên liệu</Text>
            <View style={s.catGrid}>
              {categories.map(cat => {
                const active = selectedCats.includes(cat.key);
                return (
                  <TouchableOpacity key={cat.key}
                    style={[s.catCard, active && s.catCardActive]}
                    onPress={() => toggleCat(cat.key)} activeOpacity={0.8}>
                    <Text style={s.catEmoji}>{cat.emoji}</Text>
                    <Text style={[s.catText, active && s.catTextActive]}>{cat.display}</Text>
                    {active && <View style={s.catCheck}><Text style={{ color: '#fff', fontSize: 11 }}>✓</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Step 2: Ingredients by group */}
            {step === 2 && Object.entries(grouped).map(([catKey, ingList]) => {
              const meta = CATEGORY_META[catKey] || { display: catKey, emoji: '🥬' };
              return (
                <View key={catKey} style={s.ingSection}>
                  <Text style={s.ingGroupTitle}>{meta.emoji} {meta.display} ({ingList.length})</Text>
                  <View style={s.ingGrid}>
                    {ingList.map(ing => {
                      const sel = selectedIds.includes(ing.id);
                      return (
                        <TouchableOpacity key={ing.id}
                          style={[s.ingChip, sel && s.ingChipActive]}
                          onPress={() => toggleId(ing.id)} activeOpacity={0.75}>
                          <Text style={[s.ingChipText, sel && s.ingChipTextActive]}>{ing.name}</Text>
                          {sel && <Text style={{ color: C.primaryDark, fontSize: 11, marginLeft: 3 }}>✓</Text>}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              );
            })}
          </>
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer CTA */}
      <View style={s.footer}>
        <Text style={s.footerCount}>
          {selectedIds.length > 0 ? `Đã chọn ${selectedIds.length} nguyên liệu` : 'Chưa chọn nguyên liệu nào'}
        </Text>
        <TouchableOpacity style={[s.applyBtn, selectedIds.length === 0 && s.applyBtnDisabled]}
          onPress={handleApply} activeOpacity={0.85}>
          <Text style={s.applyBtnText}>
            {selectedIds.length > 0 ? `Áp dụng ${selectedIds.length} nguyên liệu →` : 'Áp dụng →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: C.bg },
  nav:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                     paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface,
                     borderBottomWidth: 1, borderBottomColor: C.borderLight },
  back:            { width: 40, height: 40, justifyContent: 'center' },
  backArrow:       { fontSize: 28, color: C.primary, fontWeight: '300', lineHeight: 34 },
  navTitle:        { fontSize: F.lg, fontWeight: '700', color: C.text },
  skipLink:        { fontSize: F.base, color: C.textLight, fontWeight: '500' },
  stepBar:         { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
                     paddingVertical: 14, backgroundColor: C.surface, gap: 8,
                     borderBottomWidth: 1, borderBottomColor: C.borderLight },
  stepDot:         { width: 26, height: 26, borderRadius: 13, backgroundColor: C.border,
                     justifyContent: 'center', alignItems: 'center' },
  stepDotActive:   { backgroundColor: C.primary },
  stepNum:         { fontSize: F.sm, fontWeight: '700', color: C.textLight },
  stepNumActive:   { color: '#fff' },
  stepLine:        { width: 16, height: 2, backgroundColor: C.border },
  stepLineActive:  { backgroundColor: C.primary },
  stepHint:        { fontSize: F.sm, color: C.textMid, flex: 1 },
  scroll:          { padding: 16 },
  sectionTitle:    { fontSize: F.base, fontWeight: '700', color: C.text, marginBottom: 12 },
  catGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  catCard:         { width: '47%', backgroundColor: C.surface, borderRadius: R.lg, padding: 16,
                     alignItems: 'center', borderWidth: 1.5, borderColor: C.border, ...shadow(1), position: 'relative' },
  catCardActive:   { borderColor: C.primary, backgroundColor: C.primaryLight },
  catEmoji:        { fontSize: 26, marginBottom: 6 },
  catText:         { fontSize: F.sm, fontWeight: '600', color: C.textMid, textAlign: 'center' },
  catTextActive:   { color: C.primaryDark },
  catCheck:        { position: 'absolute', top: 8, right: 8, width: 18, height: 18,
                     borderRadius: 9, backgroundColor: C.primary, justifyContent: 'center', alignItems: 'center' },
  ingSection:      { marginBottom: 20 },
  ingGroupTitle:   { fontSize: F.base, fontWeight: '700', color: C.text, marginBottom: 10 },
  ingGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingChip:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
                     borderRadius: R.pill, paddingVertical: 7, paddingHorizontal: 14,
                     borderWidth: 1.5, borderColor: C.border },
  ingChipActive:   { backgroundColor: C.primaryLight, borderColor: C.primary },
  ingChipText:     { fontSize: F.sm, color: C.textMid, fontWeight: '500' },
  ingChipTextActive:{ color: C.primaryDark, fontWeight: '700' },
  footer:          { position: 'absolute', bottom: 0, left: 0, right: 0,
                     backgroundColor: C.surface, paddingHorizontal: 16, paddingVertical: 14,
                     borderTopWidth: 1, borderTopColor: C.borderLight, ...shadow(3) },
  footerCount:     { fontSize: F.sm, color: C.textMid, marginBottom: 10, textAlign: 'center' },
  applyBtn:        { backgroundColor: C.primary, borderRadius: R.xl, paddingVertical: 15, alignItems: 'center' },
  applyBtnDisabled:{ backgroundColor: C.border },
  applyBtnText:    { fontSize: F.lg, fontWeight: '700', color: '#fff' },
});

export default MarketBasketScreen;
