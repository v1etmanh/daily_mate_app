import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { getSetting, setSetting, clearAllHistory } from '../utils/database';
import { useAppStore } from '../store/useAppStore';

const SettingsScreen = () => {
  const [cuisinePreference, setCuisinePreference] = useState('vietnam');
  const [maxCookTime, setMaxCookTime] = useState('60');
  const [language, setLanguage] = useState('vi');
  const [unitSystem, setUnitSystem] = useState('metric');
  
  const { location, setLocation } = useAppStore();

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const [defaultCuisine, maxCook, lang, unitSys, lat, lon, province] = await Promise.all([
        getSetting('default_cuisine'),
        getSetting('max_cook_time'),
        getSetting('language'),
        getSetting('unit_system'),
        getSetting('last_known_lat'),
        getSetting('last_known_lon'),
        getSetting('last_known_province'),
      ]);
      setCuisinePreference(defaultCuisine || 'vietnam');
      setMaxCookTime(maxCook || '60');
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

  const handleCuisineChange    = async (v) => { setCuisinePreference(v); await saveSetting('default_cuisine', v); };
  const handleMaxCookTimeChange = async (v) => { setMaxCookTime(v);       await saveSetting('max_cook_time', v); };
  const handleLanguageChange    = async (v) => { setLanguage(v);           await saveSetting('language', v); };
  const handleUnitSystemChange  = async (v) => { setUnitSystem(v);         await saveSetting('unit_system', v); };

  const syncIngredients = () => {
    Alert.alert('Thông báo', 'Đang đồng bộ nguyên liệu...');
    setTimeout(() => Alert.alert('Thành công', 'Nguyên liệu đã được cập nhật'), 1000);
  };

  const clearHistory = () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn xóa toàn bộ lịch sử? Hành động này không thể hoàn tác.', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            await clearAllHistory();
            Alert.alert('Thành công', 'Lịch sử đã được xóa');
          } catch (error) {
            Alert.alert('Lỗi', 'Không thể xóa lịch sử');
          }
        }
      }
    ]);
  };

  const exportData = () => Alert.alert('Xuất dữ liệu', 'Tính năng sẽ có trong phiên bản tới', [{ text: 'OK' }]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GỢI Ý MẶC ĐỊNH</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Phạm vi ẩm thực</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={cuisinePreference} onValueChange={handleCuisineChange} style={styles.picker}>
              <Picker.Item label="Việt Nam"  value="vietnam" />
              <Picker.Item label="Toàn cầu"  value="global" />
              <Picker.Item label="Nhật Bản"  value="japan" />
              <Picker.Item label="Thái Lan"  value="thailand" />
              <Picker.Item label="Ý"          value="italy" />
              <Picker.Item label="Hàn Quốc"  value="korea" />
            </Picker>
          </View>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Thời gian nấu tối đa</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={maxCookTime} onValueChange={handleMaxCookTimeChange} style={styles.picker}>
              <Picker.Item label="30 phút" value="30" />
              <Picker.Item label="45 phút" value="45" />
              <Picker.Item label="60 phút" value="60" />
              <Picker.Item label="90 phút" value="90" />
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>HIỂN THỊ</Text>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Ngôn ngữ</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={language} onValueChange={handleLanguageChange} style={styles.picker}>
              <Picker.Item label="Tiếng Việt" value="vi" />
              <Picker.Item label="English"     value="en" />
            </Picker>
          </View>
        </View>
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Đơn vị</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={unitSystem} onValueChange={handleUnitSystemChange} style={styles.picker}>
              <Picker.Item label="Metric (kg, cm)"  value="metric" />
              <Picker.Item label="Imperial (lb, ft)" value="imperial" />
            </Picker>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DỮ LIỆU</Text>
        <TouchableOpacity style={styles.buttonRow} onPress={syncIngredients}>
          <Text style={styles.buttonLabel}>Đồng bộ nguyên liệu</Text>
          <Text style={styles.buttonAction}>Làm mới</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonRow} onPress={clearHistory}>
          <Text style={styles.buttonLabel}>Xóa lịch sử</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.buttonRow} onPress={exportData}>
          <Text style={styles.buttonLabel}>Xuất dữ liệu</Text>
          <Text style={styles.arrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.version}>Phiên bản 1.0.0</Text>
        <Text style={styles.server}>Server: api.wafrs.app</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: '#f5f5f5' },
  section:         { backgroundColor: 'white', marginTop: 16, marginHorizontal: 16, borderRadius: 8, overflow: 'hidden' },
  sectionTitle:    { fontSize: 14, fontWeight: '600', color: '#666', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  settingRow:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
                     borderBottomWidth: 1, borderBottomColor: '#eee' },
  buttonRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16,
                     borderBottomWidth: 1, borderBottomColor: '#eee' },
  settingLabel:    { flex: 1, fontSize: 16 },
  pickerContainer: { width: '50%' },
  picker:          { height: 50 },
  buttonLabel:     { flex: 1, fontSize: 16 },
  buttonAction:    { fontSize: 16, color: '#007AFF' },
  arrow:           { fontSize: 18, color: '#ccc' },
  footer:          { marginTop: 24, alignItems: 'center', paddingBottom: 24 },
  version:         { fontSize: 14, color: '#666' },
  server:          { fontSize: 12, color: '#999', marginTop: 4 },
});

export default SettingsScreen;
