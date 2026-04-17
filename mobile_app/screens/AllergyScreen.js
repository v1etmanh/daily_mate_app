import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  Modal, TextInput, FlatList, ActivityIndicator, StatusBar,
  KeyboardAvoidingView, Platform, Keyboard,
} from 'react-native';
import { loadAllergies, addAllergy, removeAllergy, loadAllIngredients } from '../utils/database';
import { useAppStore } from '../store/useAppStore';
import { C, R, F, shadow } from '../theme';

// ─── Hằng số ──────────────────────────────────────────────────────────────────
const CATEGORY_LIST = [
  { key: 'seafood', display: 'Hải sản', emoji: '🦐' },
  { key: 'dairy',   display: 'Sữa & Trứng', emoji: '🥛' },
  { key: 'gluten',  display: 'Gluten (lúa mì)', emoji: '🌾' },
  { key: 'nut',     display: 'Hạt / Đậu phộng', emoji: '🥜' },
  { key: 'egg',     display: 'Trứng', emoji: '🥚' },
  { key: 'soy',     display: 'Đậu nành', emoji: '🫘' },
  { key: 'meat',    display: 'Thịt đỏ', emoji: '🥩' },
  { key: 'pork',    display: 'Thịt heo', emoji: '🐷' },
];

const CATEGORY_LABELS = {
  vegetable: 'Rau củ', fruit: 'Trái cây', protein: 'Protein', grain: 'Ngũ cốc',
  dairy: 'Sữa', spice: 'Gia vị', fat: 'Chất béo', condiment: 'Gia vị nước',
  meat: 'Thịt', seafood: 'Hải sản', egg: 'Trứng', legume: 'Đậu',
};

// ─── Sub-components ────────────────────────────────────────────────────────────
const ModeToggle = ({ mode, onChange }) => (
  <View style={st.modeRow}>
    <TouchableOpacity
      style={[st.modeBtn, mode === 'category' && st.modeBtnActive]}
      onPress={() => onChange('category')} activeOpacity={0.8}>
      <Text style={[st.modeBtnText, mode === 'category' && st.modeBtnTextActive]}>
        Nhóm thực phẩm
      </Text>
    </TouchableOpacity>
    <TouchableOpacity
      style={[st.modeBtn, mode === 'ingredient' && st.modeBtnActive]}
      onPress={() => onChange('ingredient')} activeOpacity={0.8}>
      <Text style={[st.modeBtnText, mode === 'ingredient' && st.modeBtnTextActive]}>
        Nguyên liệu cụ thể
      </Text>
    </TouchableOpacity>
  </View>
);

const CategoryChip = ({ item, selected, onToggle }) => (
  <TouchableOpacity
    style={[st.catItem, selected && st.catItemActive]}
    onPress={() => onToggle(item.key)} activeOpacity={0.75}>
    <Text style={st.catEmoji}>{item.emoji}</Text>
    <Text style={[st.catText, selected && st.catTextActive]}>{item.display}</Text>
    <View style={[st.checkbox, selected && st.checkboxActive]}>
      {selected && <Text style={st.checkmark}>✓</Text>}
    </View>
  </TouchableOpacity>
);

const IngredientTag = ({ name, onRemove }) => (
  <View style={st.tag}>
    <Text style={st.tagText} numberOfLines={1}>{name}</Text>
    <TouchableOpacity onPress={onRemove} hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}>
      <Text style={st.tagX}>✕</Text>
    </TouchableOpacity>
  </View>
);


// ─── Search Modal ──────────────────────────────────────────────────────────────
const SearchModal = ({ visible, onClose, allIngredients, selectedIds, onToggle, loading }) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 200); }
  }, [visible]);

  const filtered = useMemo(() => {
    if (!query.trim()) return allIngredients.slice(0, 60);
    const q = query.toLowerCase().trim();
    return allIngredients.filter(i =>
      (i.name || '').toLowerCase().includes(q) ||
      (i.name_en || '').toLowerCase().includes(q)
    ).slice(0, 80);
  }, [query, allIngredients]);

  const renderItem = useCallback(({ item }) => {
    const sel = selectedIds.has(String(item.id));
    const catLabel = CATEGORY_LABELS[item.category] || item.category || '';
    return (
      <TouchableOpacity
        style={[st.srItem, sel && st.srItemActive]}
        onPress={() => onToggle(item)} activeOpacity={0.7}>
        <View style={{ flex: 1 }}>
          <Text style={[st.srName, sel && st.srNameActive]}>{item.name}</Text>
          {item.name_en ? <Text style={st.srSub}>{item.name_en}{catLabel ? ` · ${catLabel}` : ''}</Text> : null}
        </View>
        <View style={[st.checkbox, sel && st.checkboxActive]}>
          {sel && <Text style={st.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>
    );
  }, [selectedIds, onToggle]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        {/* Header */}
        <View style={st.modalHeader}>
          <TouchableOpacity onPress={onClose} style={st.modalBack}>
            <Text style={st.modalBackText}>← Xong</Text>
          </TouchableOpacity>
          <Text style={st.modalTitle}>Chọn nguyên liệu dị ứng</Text>
          <View style={{ width: 60 }} />
        </View>
        {/* Search bar */}
        <View style={st.searchWrap}>
          <Text style={st.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={st.searchInput}
            placeholder="Tìm theo tên (vd: tôm, cua, sữa...)"
            placeholderTextColor={C.textLight}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {query.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ color: C.textLight, fontSize: 18, paddingHorizontal: 8 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        {/* Hint */}
        {!query && (
          <Text style={st.searchHint}>
            {loading ? 'Đang tải danh sách...' : `${allIngredients.length} nguyên liệu · Gõ để tìm`}
          </Text>
        )}
        {loading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={C.primary} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={i => String(i.id)}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, paddingTop: 8 }}
            ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: C.borderLight }} />}
            ListEmptyComponent={
              <Text style={st.emptyText}>Không tìm thấy nguyên liệu "{query}"</Text>
            }
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ─── Main Screen ───────────────────────────────────────────────────────────────
const AllergyScreen = () => {
  const { setAllergies: setStoreAllergies } = useAppStore();

  // Mode: 'category' | 'ingredient'
  const [mode, setMode] = useState('category');

  // Category mode state
  const [categories, setCategories] = useState(
    CATEGORY_LIST.map(c => ({ ...c, selected: false }))
  );

  // Ingredient mode state
  const [selectedIngredients, setSelectedIngredients] = useState([]); // [{id, name, name_en}]
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingLoading, setIngLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // ── Load allergies on mount ──
  useEffect(() => { loadAllergiesFromDB(); }, []);

  // ── Pre-load ingredients when mode switches ──
  useEffect(() => {
    if (mode === 'ingredient' && allIngredients.length === 0) preloadIngredients();
  }, [mode]);

  const preloadIngredients = async () => {
    setIngLoading(true);
    try {
      const list = await loadAllIngredients();
      setAllIngredients(list);
    } catch (e) {
      console.error('preloadIngredients:', e);
      Alert.alert('Lỗi', 'Không tải được danh sách nguyên liệu');
    } finally {
      setIngLoading(false);
    }
  };

  const loadAllergiesFromDB = async () => {
    try {
      const rows = await loadAllergies();
      // allergy_key: chuỗi chữ = category; chuỗi số = ingredient_id
      const catKeys = rows.filter(r => isNaN(Number(r.allergy_key))).map(r => r.allergy_key);
      const ingRows = rows.filter(r => !isNaN(Number(r.allergy_key)));

      // Restore category selections
      setCategories(prev => prev.map(c => ({ ...c, selected: catKeys.includes(c.key) })));

      // Restore ingredient selections
      if (ingRows.length > 0) {
        setSelectedIngredients(ingRows.map(r => ({
          id: r.allergy_key,
          name: r.display_name,
          name_en: '',
        })));
        // Auto-switch mode if only ingredient allergies exist
        if (catKeys.length === 0 && ingRows.length > 0) setMode('ingredient');
      }

      // Sync store
      const allKeys = [
        ...catKeys,
        ...ingRows.map(r => r.allergy_key),
      ];
      setStoreAllergies(allKeys);
    } catch (e) {
      console.error('loadAllergiesFromDB:', e);
    }
  };

  // ── Sync store helper ──
  const syncStore = (cats, ings) => {
    const selectedCatKeys = cats.filter(c => c.selected).map(c => c.key);
    const selectedIngIds  = ings.map(i => String(i.id));
    setStoreAllergies([...selectedCatKeys, ...selectedIngIds]);
  };

  // ── Category toggle ──
  const toggleCategory = async (key) => {
    const idx = categories.findIndex(c => c.key === key);
    if (idx === -1) return;
    const isSelected = !categories[idx].selected;
    try {
      if (isSelected) await addAllergy(key, categories[idx].display);
      else            await removeAllergy(key);
      const updated = categories.map((c, i) => i === idx ? { ...c, selected: isSelected } : c);
      setCategories(updated);
      syncStore(updated, selectedIngredients);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật dị ứng');
    }
  };

  // ── Ingredient toggle (from modal) ──
  const toggleIngredient = useCallback(async (item) => {
    const idStr = String(item.id);
    const isSelected = !selectedIngredients.find(i => String(i.id) === idStr);
    try {
      if (isSelected) {
        await addAllergy(idStr, item.name);
        const updated = [...selectedIngredients, { id: idStr, name: item.name, name_en: item.name_en || '' }];
        setSelectedIngredients(updated);
        syncStore(categories, updated);
      } else {
        await removeAllergy(idStr);
        const updated = selectedIngredients.filter(i => String(i.id) !== idStr);
        setSelectedIngredients(updated);
        syncStore(categories, updated);
      }
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật dị ứng');
    }
  }, [selectedIngredients, categories]);

  const removeIngredient = useCallback(async (idStr) => {
    try {
      await removeAllergy(idStr);
      const updated = selectedIngredients.filter(i => String(i.id) !== idStr);
      setSelectedIngredients(updated);
      syncStore(categories, updated);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể xóa nguyên liệu');
    }
  }, [selectedIngredients, categories]);

  const selectedIdSet = useMemo(
    () => new Set(selectedIngredients.map(i => String(i.id))),
    [selectedIngredients]
  );

  // ── Render ──
  return (
    <View style={st.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={st.header}>
          <Text style={st.title}>Dị ứng & Kiêng kỵ</Text>
          <Text style={st.subtitle}>Chúng tôi sẽ loại bỏ các món chứa những thành phần này</Text>
        </View>

        {/* Mode toggle */}
        <ModeToggle mode={mode} onChange={setMode} />

        {/* ── CATEGORY MODE ── */}
        {mode === 'category' && (
          <View style={st.section}>
            <Text style={st.sectionHint}>Chọn nhóm thực phẩm cần tránh</Text>
            {categories.map(item => (
              <CategoryChip
                key={item.key} item={item}
                selected={item.selected}
                onToggle={toggleCategory}
              />
            ))}
          </View>
        )}

        {/* ── INGREDIENT MODE ── */}
        {mode === 'ingredient' && (
          <View style={st.section}>
            <Text style={st.sectionHint}>Thêm nguyên liệu cụ thể bạn không muốn ăn</Text>

            {/* Selected tags */}
            {selectedIngredients.length > 0 ? (
              <View style={st.tagsWrap}>
                {selectedIngredients.map(i => (
                  <IngredientTag
                    key={String(i.id)}
                    name={i.name}
                    onRemove={() => removeIngredient(String(i.id))}
                  />
                ))}
              </View>
            ) : (
              <View style={st.emptyState}>
                <Text style={st.emptyStateIcon}>🥗</Text>
                <Text style={st.emptyStateText}>Chưa có nguyên liệu nào được thêm</Text>
              </View>
            )}

            {/* Add button */}
            <TouchableOpacity
              style={st.addBtn}
              onPress={() => {
                if (allIngredients.length === 0) preloadIngredients();
                setModalVisible(true);
              }}
              activeOpacity={0.8}>
              {ingLoading && allIngredients.length === 0
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={st.addBtnText}>+ Thêm nguyên liệu</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Search Modal */}
      <SearchModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        allIngredients={allIngredients}
        selectedIds={selectedIdSet}
        onToggle={toggleIngredient}
        loading={ingLoading}
      />
    </View>
  );
};

// ─── Styles ────────────────────────────────────────────────────────────────────
const st = StyleSheet.create({
  root:        { flex: 1, backgroundColor: C.bg },
  header:      { backgroundColor: C.surface, padding: 20, paddingTop: 16 },
  title:       { fontSize: F.lg, fontWeight: '700', color: C.text },
  subtitle:    { fontSize: F.sm, color: C.textLight, marginTop: 4, lineHeight: 20 },

  // Mode toggle
  modeRow:     { flexDirection: 'row', margin: 16, backgroundColor: C.borderLight,
                 borderRadius: R.pill, padding: 3, ...shadow(0) },
  modeBtn:     { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: R.pill },
  modeBtnActive: { backgroundColor: C.surface, ...shadow(1) },
  modeBtnText: { fontSize: F.sm, fontWeight: '600', color: C.textLight },
  modeBtnTextActive: { color: C.primary },

  // Section
  section:     { paddingHorizontal: 16 },
  sectionHint: { fontSize: F.sm, color: C.textLight, marginBottom: 12 },

  // Category item
  catItem:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
                 padding: 16, borderRadius: R.lg, marginBottom: 10, ...shadow(1) },
  catItemActive: { backgroundColor: C.primaryLight, borderWidth: 1, borderColor: C.primary },
  catEmoji:    { fontSize: 22, marginRight: 12 },
  catText:     { flex: 1, fontSize: F.base, color: C.text, fontWeight: '500' },
  catTextActive: { color: C.primaryDark, fontWeight: '600' },

  // Checkbox
  checkbox:    { width: 24, height: 24, borderRadius: 12, borderWidth: 2,
                 borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: C.primary, borderColor: C.primary },
  checkmark:   { color: '#fff', fontWeight: 'bold', fontSize: 13 },

  // Ingredient tags
  tagsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  tag:         { flexDirection: 'row', alignItems: 'center', backgroundColor: C.primaryLight,
                 borderRadius: R.pill, paddingVertical: 6, paddingLeft: 12, paddingRight: 8,
                 borderWidth: 1, borderColor: C.primary },
  tagText:     { fontSize: F.sm, color: C.primaryDark, fontWeight: '600', maxWidth: 140 },
  tagX:        { fontSize: 13, color: C.primary, marginLeft: 6, fontWeight: '700' },

  // Empty state
  emptyState:  { alignItems: 'center', paddingVertical: 28 },
  emptyStateIcon: { fontSize: 40, marginBottom: 8 },
  emptyStateText: { fontSize: F.sm, color: C.textLight },

  // Add button
  addBtn:      { backgroundColor: C.primary, borderRadius: R.lg, paddingVertical: 14,
                 alignItems: 'center', marginTop: 4, ...shadow(2) },
  addBtnText:  { fontSize: F.base, color: '#fff', fontWeight: '700' },

  // Modal
  modalHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
                 paddingTop: Platform.OS === 'ios' ? 56 : 20, paddingBottom: 14,
                 paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  modalBack:   { width: 60 },
  modalBackText: { fontSize: F.base, color: C.primary, fontWeight: '600' },
  modalTitle:  { flex: 1, textAlign: 'center', fontSize: F.base, fontWeight: '700', color: C.text },

  // Search bar
  searchWrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
                 marginHorizontal: 16, marginTop: 14, marginBottom: 4, borderRadius: R.lg,
                 paddingHorizontal: 12, ...shadow(1) },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: F.base, color: C.text, paddingVertical: 12 },
  searchHint:  { fontSize: F.xs, color: C.textLight, textAlign: 'center', marginBottom: 8, marginTop: 2 },

  // Search result items
  srItem:      { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
                 paddingVertical: 13, paddingHorizontal: 12, borderRadius: R.md, marginVertical: 2 },
  srItemActive: { backgroundColor: C.primaryLight },
  srName:      { fontSize: F.base, color: C.text, fontWeight: '500' },
  srNameActive: { color: C.primaryDark, fontWeight: '600' },
  srSub:       { fontSize: F.xs, color: C.textLight, marginTop: 2 },

  emptyText:   { textAlign: 'center', color: C.textLight, marginTop: 40, fontSize: F.sm },
});

export default AllergyScreen;
