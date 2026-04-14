import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { db } from '../utils/database';
import { useAppStore } from '../store/useAppStore';

const AllergyScreen = () => {
  const [allergies, setAllergies] = useState([
    { key: 'seafood', display: 'Hải sản', selected: false },
    { key: 'dairy', display: 'Sữa & Trứng', selected: false },
    { key: 'gluten', display: 'Gluten', selected: false },
    { key: 'nut', display: 'Hạt / Đậu phộng', selected: false },
    { key: 'egg', display: 'Trứng', selected: false },
    { key: 'soy', display: 'Đậu nành', selected: false },
    { key: 'meat', display: 'Thịt đỏ', selected: false },
    { key: 'pork', display: 'Thịt heo', selected: false },
  ]);
  
  const { setAllergies: setStoreAllergies } = useAppStore();

  useEffect(() => {
    loadAllergiesFromDB();
  }, []);

  const loadAllergiesFromDB = async () => {
    try {
      const result = await db.getAllAsync(
        `SELECT allergy_key FROM allergy_list`
      );
      
      const selectedAllergyKeys = result.map(item => item.allergy_key);
      
      setAllergies(prev => prev.map(allergy => ({
        ...allergy,
        selected: selectedAllergyKeys.includes(allergy.key)
      })));
      
      setStoreAllergies(selectedAllergyKeys);
    } catch (error) {
      console.error('Error loading allergies:', error);
    }
  };

  const toggleAllergy = async (allergyKey) => {
    try {
      const allergyIndex = allergies.findIndex(a => a.key === allergyKey);
      if (allergyIndex === -1) return;

      const isSelected = !allergies[allergyIndex].selected;
      const now = new Date().toISOString();
      
      if (isSelected) {
        // Add to database
        await db.runAsync(
          `INSERT INTO allergy_list (allergy_key, display_name, added_at) VALUES (?, ?, ?)`,
          [allergyKey, allergies[allergyIndex].display, now]
        );
      } else {
        // Remove from database
        await db.runAsync(
          `DELETE FROM allergy_list WHERE allergy_key = ?`,
          [allergyKey]
        );
      }

      // Update state
      const updatedAllergies = [...allergies];
      updatedAllergies[allergyIndex].selected = isSelected;
      setAllergies(updatedAllergies);
      
      // Update store
      const selectedKeys = updatedAllergies
        .filter(a => a.selected)
        .map(a => a.key);
      setStoreAllergies(selectedKeys);
    } catch (error) {
      console.error('Error toggling allergy:', error);
      Alert.alert('Lỗi', 'Không thể cập nhật dị ứng');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Dị ứng & Kiêng kỵ</Text>
        <Text style={styles.subtitle}>
          Chúng tôi sẽ loại bỏ các món chứa những thành phần này
        </Text>
      </View>
      
      <View style={styles.allergyList}>
        {allergies.map((allergy) => (
          <TouchableOpacity
            key={allergy.key}
            style={[
              styles.allergyItem,
              allergy.selected && styles.selectedAllergy
            ]}
            onPress={() => toggleAllergy(allergy.key)}
          >
            <Text style={[
              styles.allergyText,
              allergy.selected && styles.selectedAllergyText
            ]}>
              {allergy.display}
            </Text>
            <View style={[
              styles.checkbox,
              allergy.selected && styles.selectedCheckbox
            ]}>
              {allergy.selected && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  allergyList: {
    padding: 16,
  },
  allergyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedAllergy: {
    backgroundColor: '#E3F2FD',
    borderColor: '#2196F3',
    borderWidth: 1,
  },
  allergyText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedAllergyText: {
    color: '#0D47A1',
    fontWeight: '500',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckbox: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default AllergyScreen;