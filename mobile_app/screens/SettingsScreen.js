import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Picker
} from 'react-native';
import { db } from '../utils/database';
import { useAppStore } from '../store/useAppStore';

const SettingsScreen = () => {
  const [cuisinePreference, setCuisinePreference] = useState('vietnam');
  const [maxCookTime, setMaxCookTime] = useState('60');
  const [language, setLanguage] = useState('vi');
  const [unitSystem, setUnitSystem] = useState('metric');
  
  const { location, setLocation } = useAppStore();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // Load all settings from the database
      const settingsResult = await db.getAllAsync(
        `SELECT key, value FROM settings_kv`
      );
      
      const settingsMap = {};
      settingsResult.forEach(setting => {
        settingsMap[setting.key] = setting.value;
      });
      
      // Update states with loaded values
      setCuisinePreference(settingsMap['default_cuisine'] || 'vietnam');
      setMaxCookTime(settingsMap['max_cook_time'] || '60');
      setLanguage(settingsMap['language'] || 'vi');
      setUnitSystem(settingsMap['unit_system'] || 'metric');
      
      // Update location if stored
      if (settingsMap['last_known_lat'] && settingsMap['last_known_lon']) {
        const updatedLocation = {
          ...location,
          lat: parseFloat(settingsMap['last_known_lat']),
          lon: parseFloat(settingsMap['last_known_lon']),
          province: settingsMap['last_known_province'] || location.province
        };
        setLocation(updatedLocation);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSetting = async (key, value) => {
    try {
      await db.runAsync(
        `INSERT OR REPLACE INTO settings_kv (key, value) VALUES (?, ?)`,
        [key, value]
      );
    } catch (error) {
      console.error('Error saving setting:', error);
      Alert.alert('Lỗi', 'Không thể lưu cài đặt');
    }
  };

  const handleCuisineChange = async (value) => {
    setCuisinePreference(value);
    await saveSetting('default_cuisine', value);
  };

  const handleMaxCookTimeChange = async (value) => {
    setMaxCookTime(value);
    await saveSetting('max_cook_time', value);
  };

  const handleLanguageChange = async (value) => {
    setLanguage(value);
    await saveSetting('language', value);
  };

  const handleUnitSystemChange = async (value) => {
    setUnitSystem(value);
    await saveSetting('unit_system', value);
  };

  const syncIngredients = async () => {
    try {
      // In a real implementation, this would call the API to sync ingredients
      Alert.alert('Thông báo', 'Đang đồng bộ nguyên liệu...');
      
      // Simulate API call
      setTimeout(() => {
        Alert.alert('Thành công', 'Nguyên liệu đã được cập nhật');
      }, 1000);
    } catch (error) {
      console.error('Error syncing ingredients:', error);
      Alert.alert('Lỗi', 'Không thể đồng bộ nguyên liệu');
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa toàn bộ lịch sử? Hành động này không thể hoàn tác.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete all recommendation sessions and related data
              await db.runAsync(`DELETE FROM dish_feedback`);
              await db.runAsync(`DELETE FROM recommended_dishes`);
              await db.runAsync(`DELETE FROM recommendation_sessions`);
              
              Alert.alert('Thành công', 'Lịch sử đã được xóa');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Lỗi', 'Không thể xóa lịch sử');
            }
          }
        }
      ]
    );
  };

  const exportData = async () => {
    Alert.alert(
      'Xuất dữ liệu',
      'Tính năng xuất dữ liệu sẽ được triển khai trong phiên bản tới',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GỢI Ý MẶC ĐỊNH</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Phạm vi ẩm thực</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={cuisinePreference}
              onValueChange={handleCuisineChange}
              style={styles.picker}
            >
              <Picker.Item label="Việt Nam" value="vietnam" />
              <Picker.Item label="Toàn cầu" value="global" />
              <Picker.Item label="Nhật Bản" value="japan" />
              <Picker.Item label="Thái Lan" value="thailand" />
              <Picker.Item label="Ý" value="italy" />
              <Picker.Item label="Hàn Quốc" value="korea" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Thời gian nấu tối đa</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={maxCookTime}
              onValueChange={handleMaxCookTimeChange}
              style={styles.picker}
            >
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
            <Picker
              selectedValue={language}
              onValueChange={handleLanguageChange}
              style={styles.picker}
            >
              <Picker.Item label="Tiếng Việt" value="vi" />
              <Picker.Item label="English" value="en" />
            </Picker>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Đơn vị</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={unitSystem}
              onValueChange={handleUnitSystemChange}
              style={styles.picker}
            >
              <Picker.Item label="Metric (kg, cm)" value="metric" />
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: 'white',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  settingLabel: {
    flex: 1,
    fontSize: 16,
  },
  settingValue: {
    fontSize: 16,
    color: '#007AFF',
  },
  pickerContainer: {
    width: '50%',
  },
  picker: {
    height: 50,
  },
  buttonLabel: {
    flex: 1,
    fontSize: 16,
  },
  buttonAction: {
    fontSize: 16,
    color: '#007AFF',
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
  },
  footer: {
    marginTop: 24,
    alignItems: 'center',
    paddingBottom: 24,
  },
  version: {
    fontSize: 14,
    color: '#666',
  },
  server: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
});

export default SettingsScreen;