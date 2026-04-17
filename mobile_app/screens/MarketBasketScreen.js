import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar,
  Modal, TextInput, FlatList, KeyboardAvoidingView, Platform,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useAppStore } from '../store/useAppStore';
import { C, R, F, shadow } from '../theme';

// ── Helper ────────────────────────────────────────────────────────────────────
const chunk = (arr, size) => {
  const res = [];
  for (let i = 0; i < arr.length; i += size) res.push(arr.slice(i, i + size));
  return res;
};

// ── Category metadata ─────────────────────────────────────────────────────────
const CAT_META = {
  vegetable:           { display: 'Rau củ',            emoji: '🥦' },
  fruit:               { display: 'Trái cây',           emoji: '🍎' },
  protein:             { display: 'Đạm',                emoji: '🍖' },
  grain:               { display: 'Tinh bột',           emoji: '🌾' },
  dairy:               { display: 'Sữa & Trứng',        emoji: '🥛' },
  spice:               { display: 'Gia vị',             emoji: '🧄' },
  fat:                 { display: 'Dầu mỡ',             emoji: '🫙' },
  condiment:           { display: 'Nước chấm',          emoji: '🍶' },
  meat:                { display: 'Thịt',               emoji: '🥩' },
  seafood:             { display: 'Hải sản',            emoji: '🦐' },
  herb_spice:          { display: 'Thảo mộc & Gia vị',  emoji: '🌿' },
  beverage:            { display: 'Đồ uống',            emoji: '🥤' },
  egg:                 { display: 'Trứng',              emoji: '🥚' },
  legume:              { display: 'Đậu các loại',       emoji: '🫘' },
  nut_seed:            { display: 'Hạt',                emoji: '🥜' },
  processed:           { display: 'Đã chế biến',        emoji: '🥫' },
  processed_meat:      { display: 'Thịt chế biến',      emoji: '🌭' },
  fat_oil:             { display: 'Dầu mỡ',             emoji: '🫙' },
  greens:              { display: 'Rau xanh',           emoji: '🥬' },
  grains:              { display: 'Ngũ cốc',            emoji: '🌾' },
  aquatic_vegetables:  { display: 'Rau thủy sinh',      emoji: '🌊' },
  halophytes:          { display: 'Rau mặn',            emoji: '🌿' },
  leafy_greens:        { display: 'Rau lá',             emoji: '🥬' },
  marine_invertebrates:{ display: 'Hải sản không xương',emoji: '🦑' },
  dairy_poultry:       { display: 'Gia cầm & Sữa',      emoji: '🍗' },
  other:               { display: 'Khác',               emoji: '🫙' },
};
const getCatMeta = (key) =>
  CAT_META[key] || { display: key.replace(/_/g, ' '), emoji: '🥬' };

// ── IngredientSearchModal ─────────────────────────────────────────────────────
const IngredientSearchModal = ({
  visible, category, ingredients, selectedIds, onToggle, onClose,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const meta = getCatMeta(category);

  const filtered = useMemo(() => {
    if (!query.trim()) return ingredients;
    const q = query.toLowerCase().trim();
    return ingredients.filter(
      i =>
        (i.name || '').toLowerCase().includes(q) ||
        (i.name_en || '').toLowerCase().includes(q),
    );
  }, [query, ingredients]);

  const selectedInCat = useMemo(
    () => ingredients.filter(i => selectedIds.includes(i.id)).length,
    [ingredients, selectedIds],
  );

  const renderItem = useCallback(
    ({ item }) => {
      const sel = selectedIds.includes(item.id);
      return (
        <TouchableOpacity
          style={[ms.item, sel && ms.itemActive]}
          onPress={() => onToggle(item.id)}
          activeOpacity={0.7}
        >
          <View style={{ flex: 1 }}>
            <Text style={[ms.itemName, sel && ms.itemNameActive]}>{item.name}</Text>
            {item.name_en ? <Text style={ms.itemSub}>{item.name_en}</Text> : null}
          </View>
          <View style={[ms.checkbox, sel && ms.checkboxActive]}>
            {sel && <Text style={ms.checkmark}>✓</Text>}
          </View>
        </TouchableOpacity>
      );
    },
    [selectedIds, onToggle],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={ms.root}>
          <View style={ms.header}>
            <TouchableOpacity style={ms.closeBtn} onPress={onClose}>
              <Text style={ms.closeTxt}>✕</Text>
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={ms.headerTitle}>{meta.emoji} {meta.display}</Text>
              <Text style={ms.headerSub}>
                {ingredients.length} nguyên liệu · {selectedInCat} đã chọn
              </Text>
            </View>
            <TouchableOpacity style={ms.doneBtn} onPress={onClose}>
              <Text style={ms.doneTxt}>Xong</Text>
            </TouchableOpacity>
          </View>

          <View style={ms.searchWrap}>
            <Text style={ms.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={ms.searchInput}
              placeholder="Tìm nguyên liệu..."
              placeholderTextColor={C.textLight}
              value={query}
              onChangeText={setQuery}
              autoFocus
              returnKeyType="done"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Text style={ms.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={ms.resultCount}>
            {query
              ? `${filtered.length} kết quả`
              : `Tất cả ${filtered.length} nguyên liệu`}
          </Text>

          <FlatList
            data={filtered}
            keyExtractor={i => String(i.id)}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ── MarketBasketScreen ────────────────────────────────────────────────────────
const MarketBasketScreen = ({ navigation }) => {
  // useWindowDimensions để lấy chiều cao thực tế màn hình
  // → root có height tường minh → ScrollView bị bounded → scroll hoạt động
  const { height: screenHeight } = useWindowDimensions();

  const { allIngredients, setMarketBasket } = useAppStore();
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [modalCat,     setModalCat]     = useState(null);

  const categories = useMemo(() => {
    const catSet = new Set();
    allIngredients.forEach(i => { if (i.category) catSet.add(i.category); });
    return Array.from(catSet).sort().map(k => ({ key: k, ...getCatMeta(k) }));
  }, [allIngredients]);

  // Chunk 2 cột — tránh flexWrap bên trong ScrollView
  const categoryRows = useMemo(() => chunk(categories, 2), [categories]);

  const byCategory = useMemo(() => {
    return allIngredients.reduce((acc, i) => {
      if (i.category) (acc[i.category] = acc[i.category] || []).push(i);
      return acc;
    }, {});
  }, [allIngredients]);

  const isLoading = allIngredients.length === 0;

  const toggleId = useCallback(id => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const openModal = catKey => {
    if (!selectedCats.includes(catKey)) setSelectedCats(prev => [...prev, catKey]);
    setModalCat(catKey);
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

  const countInCat = catKey =>
    (byCategory[catKey] || []).filter(i => selectedIds.includes(i.id)).length;

  return (
    <View style={[s.root, { height: screenHeight }]}>
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

      {/* Info bar */}
      <View style={s.infoBar}>
        <Text style={s.infoTxt}>
          Chọn nhóm rồi bấm vào để tìm nguyên liệu cụ thể
        </Text>
        {selectedIds.length > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeTxt}>{selectedIds.length}</Text>
          </View>
        )}
      </View>

      {/*
        scrollArea: flex:1 → lấp đầy khoảng trống giữa infoBar và footer.
        Đây là điểm mấu chốt: ScrollView có parent bounded → scroll hoạt động.
      */}
      <View style={s.scrollArea}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={s.loadWrap}>
              <ActivityIndicator color={C.primary} size="large" />
              <Text style={s.loadTxt}>Đang tải danh sách nguyên liệu...</Text>
            </View>
          ) : (
            <>
              <Text style={s.sectionTitle}>
                Nhóm nguyên liệu ({categories.length})
              </Text>

              {categoryRows.map((row, rowIdx) => (
                <View key={rowIdx} style={s.catRow}>
                  {row.map(cat => {
                    const cnt    = countInCat(cat.key);
                    const total  = (byCategory[cat.key] || []).length;
                    const active = selectedCats.includes(cat.key);
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[s.catCard, active && s.catCardActive]}
                        onPress={() => openModal(cat.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={s.catEmoji}>{cat.emoji}</Text>
                        <Text style={[s.catText, active && s.catTextActive]}>
                          {cat.display}
                        </Text>
                        <Text style={s.catCount}>{total} loại</Text>
                        {cnt > 0 && (
                          <View style={s.catBadge}>
                            <Text style={s.catBadgeTxt}>{cnt}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  {row.length === 1 && <View style={s.catCardPlaceholder} />}
                </View>
              ))}

              {selectedIds.length > 0 && (
                <View style={s.summaryBox}>
                  <Text style={s.summaryTitle}>
                    ✅ Đã chọn {selectedIds.length} nguyên liệu
                  </Text>
                  <Text style={s.summarySub}>
                    {selectedCats
                      .filter(c => countInCat(c) > 0)
                      .map(c =>
                        `${getCatMeta(c).emoji} ${countInCat(c)} ${getCatMeta(c).display}`,
                      )
                      .join('  ·  ')}
                  </Text>
                </View>
              )}
            </>
          )}
          <View style={{ height: 20 }} />
        </ScrollView>
      </View>

      {/* Footer — KHÔNG position:absolute, là phần tử cuối của flex column */}
      <View style={s.footer}>
        <TouchableOpacity
          style={[s.applyBtn, selectedIds.length === 0 && s.applyBtnDisabled]}
          onPress={handleApply}
          activeOpacity={0.85}
        >
          <Text style={s.applyBtnText}>
            {selectedIds.length > 0
              ? `Áp dụng ${selectedIds.length} nguyên liệu →`
              : 'Tiếp tục không chọn nguyên liệu'}
          </Text>
        </TouchableOpacity>
      </View>

      {modalCat && (
        <IngredientSearchModal
          visible={!!modalCat}
          category={modalCat}
          ingredients={byCategory[modalCat] || []}
          selectedIds={selectedIds}
          onToggle={toggleId}
          onClose={() => setModalCat(null)}
        />
      )}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:              {
                       flexDirection: 'column',
                       backgroundColor: C.bg,
                       overflow: 'hidden',
                       // height inject inline từ useWindowDimensions
                     },

  nav:               {
                       flexDirection: 'row', alignItems: 'center',
                       justifyContent: 'space-between',
                       paddingHorizontal: 16, paddingVertical: 12,
                       backgroundColor: C.surface,
                       borderBottomWidth: 1, borderBottomColor: C.borderLight,
                     },
  back:              { width: 40, height: 40, justifyContent: 'center' },
  backArrow:         { fontSize: 28, color: C.primary, fontWeight: '300', lineHeight: 34 },
  navTitle:          { fontSize: F.lg, fontWeight: '700', color: C.text },
  skipLink:          { fontSize: F.base, color: C.textLight, fontWeight: '500' },

  infoBar:           {
                       flexDirection: 'row', alignItems: 'center',
                       paddingHorizontal: 16, paddingVertical: 10,
                       backgroundColor: C.primaryLight,
                       borderBottomWidth: 1, borderBottomColor: C.borderLight,
                     },
  infoTxt:           { flex: 1, fontSize: F.sm, color: C.primaryDark },
  badge:             {
                       backgroundColor: C.primary, borderRadius: R.pill,
                       paddingHorizontal: 8, paddingVertical: 2, marginLeft: 8,
                     },
  badgeTxt:          { fontSize: F.xs, color: '#fff', fontWeight: '700' },

  scrollArea:        { flex: 1 },           // bounded → ScrollView scroll được
  scroll:            { padding: 16 },

  loadWrap:          { alignItems: 'center', paddingTop: 60, gap: 12 },
  loadTxt:           { fontSize: F.sm, color: C.textLight },
  sectionTitle:      { fontSize: F.base, fontWeight: '700', color: C.text, marginBottom: 14 },

  catRow:            { flexDirection: 'row', gap: 12, marginBottom: 12 },
  catCard:           {
                       flex: 1,
                       backgroundColor: C.surface,
                       borderRadius: R.lg, padding: 16,
                       alignItems: 'center',
                       borderWidth: 1.5, borderColor: C.border,
                       ...shadow(1),
                       position: 'relative',
                       minHeight: 100, justifyContent: 'center',
                     },
  catCardActive:     { borderColor: C.primary, backgroundColor: C.primaryLight },
  catCardPlaceholder:{ flex: 1 },
  catEmoji:          { fontSize: 28, marginBottom: 6 },
  catText:           { fontSize: F.sm, fontWeight: '700', color: C.textMid, textAlign: 'center' },
  catTextActive:     { color: C.primaryDark },
  catCount:          { fontSize: F.xs, color: C.textLight, marginTop: 3 },
  catBadge:          {
                       position: 'absolute', top: 8, right: 8,
                       minWidth: 22, height: 22, borderRadius: 11,
                       backgroundColor: C.primary,
                       justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
                     },
  catBadgeTxt:       { fontSize: F.xs, color: '#fff', fontWeight: '800' },

  summaryBox:        {
                       backgroundColor: C.surface, borderRadius: R.lg, padding: 16,
                       borderLeftWidth: 4, borderLeftColor: C.primary, marginTop: 4,
                       ...shadow(1),
                     },
  summaryTitle:      { fontSize: F.base, fontWeight: '700', color: C.text, marginBottom: 6 },
  summarySub:        { fontSize: F.sm, color: C.textMid, lineHeight: 20 },

  // Footer KHÔNG còn position:'absolute'
  footer:            {
                       backgroundColor: C.surface,
                       paddingHorizontal: 16, paddingVertical: 14,
                       borderTopWidth: 1, borderTopColor: C.borderLight,
                       ...shadow(4),
                     },
  applyBtn:          {
                       backgroundColor: C.primary, borderRadius: R.xl,
                       paddingVertical: 15, alignItems: 'center',
                     },
  applyBtnDisabled:  { backgroundColor: C.border },
  applyBtnText:      { fontSize: F.base, fontWeight: '700', color: '#fff' },
});

// ── Modal Styles ──────────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  header:         {
                    flexDirection: 'row', alignItems: 'center',
                    paddingHorizontal: 12, paddingVertical: 14,
                    backgroundColor: C.surface,
                    borderBottomWidth: 1, borderBottomColor: C.borderLight,
                  },
  closeBtn:       { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeTxt:       { fontSize: F.base, color: C.textLight },
  headerTitle:    { fontSize: F.lg, fontWeight: '700', color: C.text },
  headerSub:      { fontSize: F.xs, color: C.textLight, marginTop: 2 },
  doneBtn:        {
                    paddingHorizontal: 12, paddingVertical: 6,
                    backgroundColor: C.primary, borderRadius: R.pill,
                  },
  doneTxt:        { fontSize: F.sm, fontWeight: '700', color: '#fff' },
  searchWrap:     {
                    flexDirection: 'row', alignItems: 'center', margin: 12,
                    backgroundColor: C.surface, borderRadius: R.lg, paddingHorizontal: 12,
                    borderWidth: 1.5, borderColor: C.border,
                  },
  searchIcon:     { fontSize: 16, marginRight: 8 },
  searchInput:    { flex: 1, fontSize: F.base, color: C.text, paddingVertical: 11 },
  clearBtn:       { fontSize: F.sm, color: C.textLight, paddingLeft: 8 },
  resultCount:    { fontSize: F.xs, color: C.textLight, marginHorizontal: 16, marginBottom: 8 },
  item:           {
                    flexDirection: 'row', alignItems: 'center',
                    paddingVertical: 13, paddingHorizontal: 16,
                    backgroundColor: C.surface,
                    borderBottomWidth: 1, borderBottomColor: C.borderLight,
                  },
  itemActive:     { backgroundColor: C.primaryLight },
  itemName:       { fontSize: F.base, color: C.text, fontWeight: '500' },
  itemNameActive: { color: C.primaryDark, fontWeight: '700' },
  itemSub:        { fontSize: F.xs, color: C.textLight, marginTop: 2 },
  checkbox:       {
                    width: 24, height: 24, borderRadius: 12,
                    borderWidth: 2, borderColor: C.border,
                    justifyContent: 'center', alignItems: 'center',
                  },
  checkboxActive: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark:      { fontSize: 13, color: '#fff', fontWeight: '700' },
});

export default MarketBasketScreen;