import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { useAppStore } from '../store/useAppStore';

const ProfileScreen = ({ navigation }) => {
  const { profile, latestMetrics } = useAppStore();

  // Calculate BMI if we have metrics
  let bmi = null;
  let bmiCategory = '';
  if (latestMetrics && latestMetrics.height_cm && latestMetrics.weight_kg) {
    const heightInMeters = latestMetrics.height_cm / 100;
    bmi = (latestMetrics.weight_kg / (heightInMeters * heightInMeters)).toFixed(1);
    
    if (bmi < 18.5) {
      bmiCategory = 'Thiếu cân';
    } else if (bmi >= 18.5 && bmi <= 24.9) {
      bmiCategory = 'Bình thường';
    } else if (bmi >= 25 && bmi <= 29.9) {
      bmiCategory = 'Thừa cân';
    } else {
      bmiCategory = 'Béo phì';
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.gender === 'male' ? '👨' : profile?.gender === 'female' ? '👩' : '👤'}
          </Text>
        </View>
        <Text style={styles.name}>
          {profile ? `${profile.age} tuổi` : 'Chưa thiết lập'}
        </Text>
        <Text style={styles.gender}>
          {profile?.gender === 'male' ? 'Nam' : profile?.gender === 'female' ? 'Nữ' : 'Khác'}
        </Text>
        {bmi ? (
          <Text style={styles.bmi}>BMI: {bmi} · {bmiCategory}</Text>
        ) : (
          <Text style={styles.bmi}>Chưa có dữ liệu chỉ số</Text>
        )}
      </View>

      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionRow}
          onPress={() => navigation.navigate('EditPersonal')}
        >
          <Text style={styles.optionIcon}>👤</Text>
          <Text style={styles.optionText}>Thông tin cá nhân</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionRow}
          onPress={() => navigation.navigate('BodyMetrics')}
        >
          <Text style={styles.optionIcon}>⚖️</Text>
          <Text style={styles.optionText}>Chỉ số cơ thể</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.optionRow}
          onPress={() => navigation.navigate('Allergy')}
        >
          <Text style={styles.optionIcon}>⚠️</Text>
          <Text style={styles.optionText}>Dị ứng & Chế độ ăn</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
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
    padding: 24,
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 40,
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gender: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  bmi: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  optionsContainer: {
    marginTop: 16,
    backgroundColor: 'white',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  optionText: {
    flex: 1,
    fontSize: 16,
  },
  arrow: {
    fontSize: 18,
    color: '#ccc',
  },
});

export default ProfileScreen;