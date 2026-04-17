import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getSetting, setSetting, clearAllHistory } from '../utils/database';
import { useAppStore } from '../store/useAppStore';

const COST_OPTIONS = [
  { label: '🌿 Tiết kiệm', value: '1' },
  { label: '💰 Vừa phải',  value: '2' },
  { label: '💎 Thoải mái', value: '3' },
];

// ─── Tiny icon components (no extra lib needed) ─────────────────────────────
const Icon = ({ emoji, bg }) => (
  <View style={[iconStyles.wrap, { backgroundColor: bg }]}>
    <Text style={iconStyles.emoji}>{emoji}</Text>
  </View>
);
const iconStyles = StyleSheet.create({
  wrap:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  emoji: { fontSize: 18 },
});

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader = ({ title }) => (
  <View style={sh.row}>
    <Text style={sh.text}>{title}</Text>
  </View>
);
const sh = StyleSheet.create({
  row:  { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 8 },
  text: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, color: '#6D9E6A', textTransform: 'uppercase' },
});

// ─── Picker row ──────────────────────────────────────────────────────────────
const PickerRow = ({ icon, iconBg, label, selectedValue, onValueChange, children }) => (
  <View style={pr.card}>
    <Icon emoji={icon} bg={iconBg} />
    <View style={pr.inner}>
      <Text style={pr.label}>{label}</Text>
      <View style={pr.pickerWrap}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={pr.picker}
          dropdownIconColor="#6D9E6A"
          itemStyle={pr.pickerItem}
        >
          {children}
        </Picker>
      </View>
    </View>
  </View>
);
const pr = StyleSheet.create({
  card:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
                paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F5EF' },
  inner:      { flex: 1 },
  label:      { fontSize: 14, color: '#3D5C3A', fontWeight: '600', marginBottom: 2 },
  pickerWrap: { marginLeft: -8 },
  picker:     { height: 44, color: '#5A7A57' },
  pickerItem: { fontSize: 14, color: '#5A7A57' },
});

// ─── Action row ──────────────────────────────────────────────────────────────
const ActionRow = ({ icon, iconBg, label, actionLabel, onPress, danger }) => (
  <TouchableOpacity style={ar.card} onPress={onPress} activeOpacity={0.7}>
    <Icon emoji={icon} bg={iconBg} />
    <Text style={ar.label}>{label}</Text>
    <View style={[ar.badge, danger && ar.badgeDanger]}>
      <Text style={[ar.badgeText, danger && ar.badgeTextDanger]}>{actionLabel}</Text>
    </View>
  </TouchableOpacity>
);
const ar = StyleSheet.create({
  card:            { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
                     paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F0F5EF' },
  label:           { flex: 1, fontSize: 15, color: '#3D5C3A', fontWeight: '500' },
  badge:           { backgroundColor: '#EAF4E8', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 },
  badgeDanger:     { backgroundColor: '#FDECEA' },
  badgeText:       { fontSize: 13, color: '#5A9C55', fontWeight: '600' },
  badgeTextDanger: { color: '#D94F4F' },
});

// ─── Card container ──────────────────────────────────────────────────────────
const Card = ({ children }) => <View style={card.wrap}>{children}</View>;
const card = StyleSheet.create({
  wrap: { backgroundColor: '#FFFFFF', borderRadius: 18, marginHorizontal: 16,
          overflow: 'hidden',
          shadowColor: '#4A7A46', shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.07, shadowRadius: 12, elevation: 3 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
const SettingsScreen = () => {
  const [cuisinePreference, setCuisinePreference] = useState('vietnam');
  const [maxCookTime, setMaxCookTime]             = useState('60');
  const [costPreference, setCostPreferenceLocal]  = useState('2');
  const [language, setLanguage]                   = useState('vi');
  const [unitSystem, setUnitSystem]               = useState('metric');

  const { location, setLocation, setCostPreference: setStoreCostPref } = useAppStore();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const [defaultCuisine, maxCook, costPref, lang, unitSys, lat, lon, province] = await Promise.all([
        getSetting('default_cuisine'),
        getSetting('max_cook_time'),
        getSetting('cost_preference'),
        getSetting('language'),
        getSetting('unit_system'),
        getSetting('last_known_lat'),
        getSetting('last_known_lon'),
        getSetting('last_known_province'),
      ]);
      setCuisinePreference(defaultCuisine || 'vietnam');
      setMaxCookTime(maxCook || '60');
      setCostPreferenceLocal(costPref || '2');
      setLanguage(lang || 'vi');
      setUnitSystem(unitSys || 'metric');
      if (lat && lon) {
        setLocation({ ...location, lat: parseFloat(lat), lon: parseFloat(lon), province: province || location.province });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      await setSetting(key, String(value));
    } catch (error) {
      console.error('Error saving setting:', error);
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
    }
  };

  const handleCuisineChange          = async (v) => { setCuisinePreference(v); await saveSetting('default_cuisine', v); };
  const handleMaxCookTimeChange      = async (v) => { setMaxCookTime(v);        await saveSetting('max_cook_time', v); };
  const handleLanguageChange         = async (v) => { setLanguage(v);           await saveSetting('language', v); };
  const handleUnitSystemChange       = async (v) => { setUnitSystem(v);         await saveSetting('unit_system', v); };
  const handleCostPreferenceChange   = async (v) => {
    setCostPreferenceLocal(v);
    setStoreCostPref(Number(v));
    await saveSetting('cost_preference', v);
  };

  const syncIngredients = () => {
    Alert.alert('Thông báo', 'Đang đồng bộ nguyên liệu...');
    setTimeout(() => Alert.alert('Thành công', 'Nguyên liệu đã được cập nhật'), 1000);
  };

  const clearHistory = () => {
    Alert.alert(
      'Xóa lịch sử',
      'Hành động này không thể hoàn tác. Bạn có chắc không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa hết', style: 'destructive',
          onPress: async () => {
            try {
              await clearAllHistory();
              Alert.alert('Xong rồi!', 'Lịch sử đã được xóa sạch 🌿');
            } catch {
              Alert.alert('Lỗi', 'Không thể xóa lịch sử');
            }
          },
        },
      ]
    );
  };

  const exportData = () => Alert.alert('Xuất dữ liệu', 'Tính năng sẽ có trong phiên bản tới 🚀', [{ text: 'OK' }]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>⚙️</Text>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <Text style={styles.headerSub}>Tuỳ chỉnh theo ý bạn</Text>
      </View>

      {/* ── Gợi ý mặc định ── */}
      <SectionHeader title="Gợi ý mặc định" />
      <Card>
        <PickerRow icon="🍜" iconBg="#FFF3E0" label="Phạm vi ẩm thực"
          selectedValue={cuisinePreference} onValueChange={handleCuisineChange}>
          <Picker.Item label="🇻🇳 Việt Nam"  value="vietnam" />
          <Picker.Item label="🌍 Toàn cầu"  value="global" />
          <Picker.Item label="🇯🇵 Nhật Bản"  value="japan" />
          <Picker.Item label="🇹🇭 Thái Lan"  value="thailand" />
          <Picker.Item label="🇮🇹 Ý"          value="italy" />
          <Picker.Item label="🇰🇷 Hàn Quốc"  value="korea" />
        </PickerRow>

        <PickerRow icon="💰" iconBg="#E8F5E9" label="Mức chi phí"
          selectedValue={costPreference} onValueChange={handleCostPreferenceChange}>
          {COST_OPTIONS.map(o => (
            <Picker.Item key={o.value} label={o.label} value={o.value} />
          ))}
        </PickerRow>

        <PickerRow icon="⏱️" iconBg="#E3F2FD" label="Thời gian nấu tối đa"
          selectedValue={maxCookTime} onValueChange={handleMaxCookTimeChange}>
          <Picker.Item label="15 phút"  value="15" />
          <Picker.Item label="30 phút"  value="30" />
          <Picker.Item label="45 phút"  value="45" />
          <Picker.Item label="60 phút"  value="60" />
          <Picker.Item label="75 phút"  value="75" />
          <Picker.Item label="90 phút"  value="90" />
          <Picker.Item label="115 phút" value="115" />
        </PickerRow>
      </Card>

      {/* ── Hiển thị ── */}
      <SectionHeader title="Hiển thị" />
      <Card>
        <PickerRow icon="🌐" iconBg="#F3E5F5" label="Ngôn ngữ"
          selectedValue={language} onValueChange={handleLanguageChange}>
          <Picker.Item label="🇻🇳 Tiếng Việt" value="vi" />
          <Picker.Item label="🇺🇸 English"     value="en" />
        </PickerRow>

        <PickerRow icon="📏" iconBg="#FBE9E7" label="Đơn vị đo lường"
          selectedValue={unitSystem} onValueChange={handleUnitSystemChange}>
          <Picker.Item label="Metric (kg, cm)"  value="metric" />
          <Picker.Item label="Imperial (lb, ft)" value="imperial" />
        </PickerRow>
      </Card>

      {/* ── Dữ liệu ── */}
      <SectionHeader title="Dữ liệu" />
      <Card>
        <ActionRow icon="🔄" iconBg="#E8F5E9" label="Đồng bộ nguyên liệu"
          actionLabel="Làm mới" onPress={syncIngredients} />
        <ActionRow icon="🗑️" iconBg="#FDECEA" label="Xóa lịch sử"
          actionLabel="Xóa" onPress={clearHistory} danger />
        <ActionRow icon="📤" iconBg="#E3F2FD" label="Xuất dữ liệu"
          actionLabel="Xuất" onPress={exportData} />
      </Card>

      {/* ── Footer ── */}
      <View style={styles.footer}>
        <View style={styles.footerBadge}>
          <Text style={styles.footerEmoji}>🌿</Text>
          <Text style={styles.version}>Phiên bản 1.0.0</Text>
        </View>
        <Text style={styles.server}>api.wafrs.app</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8F3',
  },
  content: {
    paddingBottom: 48,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 8,
  },
  headerEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#2D4A2A',
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 14,
    color: '#7AA876',
    marginTop: 4,
    fontWeight: '400',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 36,
    gap: 6,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  footerEmoji: { fontSize: 14 },
  version:     { fontSize: 13, color: '#5A7A57', fontWeight: '600' },
  server:      { fontSize: 12, color: '#A0B8A0' },
});

export default SettingsScreen;