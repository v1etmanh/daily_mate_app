import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Picker,
  Alert
} from 'react-native';
import {
  loadProfile as loadProfileFromFirebase,
  saveProfile as saveProfileToFirebase,
} from '../utils/database';
import { useAppStore } from '../store/useAppStore';

const EditPersonalScreen = () => {
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('female');
  const [dietType, setDietType] = useState('omnivore');
  const [dietaryGoal, setDietaryGoal] = useState('maintenance');
  const [activityLevel, setActivityLevel] = useState('moderately_active');
  
  const { profile, setProfile } = useAppStore();

  useEffect(() => {
    if (profile) {
      setAge(profile.age.toString());
      setGender(profile.gender);
      setDietType(profile.diet_type);
      setDietaryGoal(profile.dietary_goal);
      setActivityLevel(profile.activity_level);
    } else {
      loadProfileFromDB();
    }
  }, []);

  const loadProfileFromDB = async () => {
    try {
      const result = await loadProfileFromFirebase();
      if (result) {
        setAge(result.age.toString());
        setGender(result.gender);
        setDietType(result.diet_type);
        setDietaryGoal(result.dietary_goal);
        setActivityLevel(result.activity_level);
        setProfile(result);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    if (!age) {
      Alert.alert('Lỗi', 'Vui lòng nhập tuổi');
      return;
    }

    const ageNum = parseInt(age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert('Lỗi', 'Tuổi phải là số từ 1 đến 120');
      return;
    }

    try {
      const now = new Date().toISOString();
      const profileData = {
        age: ageNum,
        gender,
        diet_type: dietType,
        dietary_goal: dietaryGoal,
        activity_level: activityLevel,
        updated_at: now,
      };

      // saveProfileToFirebase dùng merge:true — tự xử lý cả create lẫn update
      await saveProfileToFirebase(profileData);

      // Update the store
      const updatedProfile = { id: 1, ...profileData, created_at: now };
      setProfile(updatedProfile);

      Alert.alert('Thành công', 'Thông tin cá nhân đã được cập nhật');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Lỗi', 'Không thể lưu thông tin cá nhân');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tuổi</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            keyboardType="numeric"
            placeholder="Nhập tuổi"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={gender}
              onValueChange={setGender}
              style={styles.picker}
            >
              <Picker.Item label="Nam" value="male" />
              <Picker.Item label="Nữ" value="female" />
              <Picker.Item label="Khác" value="other" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Chế độ ăn</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={dietType}
              onValueChange={setDietType}
              style={styles.picker}
            >
              <Picker.Item label="Ăn tất cả" value="omnivore" />
              <Picker.Item label="Chay" value="vegetarian" />
              <Picker.Item label="Thuần chay" value="vegan" />
              <Picker.Item label="Ăn cá" value="pescatarian" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mục tiêu</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={dietaryGoal}
              onValueChange={setDietaryGoal}
              style={styles.picker}
            >
              <Picker.Item label="Duy trì cân nặng" value="maintenance" />
              <Picker.Item label="Giảm cân" value="weight_loss" />
              <Picker.Item label="Tăng cơ" value="muscle_gain" />
              <Picker.Item label="Detox" value="detox" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mức độ hoạt động</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={activityLevel}
              onValueChange={setActivityLevel}
              style={styles.picker}
            >
              <Picker.Item label="Ít vận động" value="sedentary" />
              <Picker.Item label="Nhẹ nhàng" value="lightly_active" />
              <Picker.Item label="Vừa phải" value="moderately_active" />
              <Picker.Item label="Nhiều vận động" value="very_active" />
              <Picker.Item label="Rất vận động" value="extra_active" />
            </Picker>
          </View>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveProfile}>
          <Text style={styles.saveButtonText}>Lưu thông tin</Text>
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
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EditPersonalScreen;