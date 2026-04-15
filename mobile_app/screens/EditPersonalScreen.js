import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert,
} from 'react-native';
import { loadProfile as loadProfileDB, saveProfile as saveProfileDB } from '../utils/database';
import { useAppStore } from '../store/useAppStore';
import { C, R, F, shadow } from '../theme';

const GENDER_OPTS   = [{ key:'male',icon:'👨',text:'Nam' },{ key:'female',icon:'👩',text:'Nữ' },{ key:'other',icon:'🧑',text:'Khác' }];
const DIET_OPTS     = [{ key:'omnivore',icon:'🍗',text:'Ăn tất cả' },{ key:'vegetarian',icon:'🥬',text:'Chay' },{ key:'vegan',icon:'🌱',text:'Thuần chay' },{ key:'pescatarian',icon:'🐟',text:'Ăn cá' }];
const GOAL_OPTS     = [{ key:'maintenance',icon:'⚖️',text:'Duy trì' },{ key:'weight_loss',icon:'📉',text:'Giảm cân' },{ key:'muscle_gain',icon:'💪',text:'Tăng cơ' },{ key:'detox',icon:'🌿',text:'Detox' }];
const ACTIVITY_OPTS = [{ key:'sedentary',text:'Ít vận động' },{ key:'lightly_active',text:'Nhẹ nhàng' },{ key:'moderately_active',text:'Vừa phải' },{ key:'very_active',text:'Nhiều' }];

const ChipGroup = ({ label, options, value, onChange }) => (
  <View style={s.block}>
    <Text style={s.label}>{label}</Text>
    <View style={s.chips}>
      {options.map(({ key, icon, text }) => {
        const active = value === key;
        return (
          <TouchableOpacity key={key}
            style={[s.chip, active && s.chipActive]}
            onPress={() => onChange(key)} activeOpacity={0.75}>
            {icon ? <Text style={{ fontSize: 15 }}>{icon}</Text> : null}
            <Text style={[s.chipText, active && s.chipTextActive]}>{text}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const EditPersonalScreen = ({ navigation }) => {
  const [age, setAge]           = useState('');
  const [gender, setGender]     = useState('female');
  const [dietType, setDietType] = useState('omnivore');
  const [goal, setGoal]         = useState('maintenance');
  const [activity, setActivity] = useState('moderately_active');
  const [saving, setSaving]     = useState(false);
  const { profile, setProfile } = useAppStore();

  useEffect(() => {
    const p = profile;
    if (p) {
      setAge(String(p.age || ''));
      setGender(p.gender || 'female');
      setDietType(p.diet_type || 'omnivore');
      setGoal(p.dietary_goal || 'maintenance');
      setActivity(p.activity_level || 'moderately_active');
    } else {
      loadProfileDB().then(r => {
        if (r) {
          setAge(String(r.age || ''));
          setGender(r.gender || 'female');
          setDietType(r.diet_type || 'omnivore');
          setGoal(r.dietary_goal || 'maintenance');
          setActivity(r.activity_level || 'moderately_active');
          setProfile(r);
        }
      }).catch(console.error);
    }
  }, []);

  const handleSave = async () => {
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      Alert.alert('Lỗi', 'Tuổi phải từ 10 đến 100'); return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const data = { age: ageNum, gender, diet_type: dietType, dietary_goal: goal, activity_level: activity, updated_at: now };
      await saveProfileDB(data);
      setProfile({ id: 1, ...data, created_at: now });
      Alert.alert('Đã lưu', 'Thông tin cá nhân đã được cập nhật.');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu. Thử lại nhé.');
    } finally { setSaving(false); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Thông tin cá nhân</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {/* Age stepper */}
        <View style={s.block}>
          <Text style={s.label}>Tuổi</Text>
          <View style={s.ageRow}>
            <TouchableOpacity style={s.stepper}
              onPress={() => setAge(a => String(Math.max(10, parseInt(a||25)-1)))}>
              <Text style={s.stepIcon}>−</Text>
            </TouchableOpacity>
            <TextInput style={s.ageInput} value={age} onChangeText={setAge}
              keyboardType="numeric" maxLength={3} textAlign="center" />
            <Text style={s.ageUnit}>tuổi</Text>
            <TouchableOpacity style={s.stepper}
              onPress={() => setAge(a => String(Math.min(100, parseInt(a||25)+1)))}>
              <Text style={s.stepIcon}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ChipGroup label="Giới tính"    options={GENDER_OPTS}   value={gender}   onChange={setGender} />
        <ChipGroup label="Chế độ ăn"   options={DIET_OPTS}     value={dietType} onChange={setDietType} />
        <ChipGroup label="Mục tiêu"     options={GOAL_OPTS}     value={goal}     onChange={setGoal} />
        <ChipGroup label="Mức vận động" options={ACTIVITY_OPTS} value={activity} onChange={setActivity} />

        <TouchableOpacity style={[s.btn, saving && { opacity: 0.7 }]}
          onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={s.btnText}>{saving ? 'Đang lưu...' : 'Lưu thông tin'}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  nav:            { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface,
                    borderBottomWidth: 1, borderBottomColor: C.borderLight },
  back:           { width: 40, height: 40, justifyContent: 'center' },
  backArrow:      { fontSize: 28, color: C.primary, fontWeight: '300', lineHeight: 34 },
  navTitle:       { fontSize: F.lg, fontWeight: '700', color: C.text },
  scroll:         { padding: 20 },
  block:          { marginBottom: 24 },
  label:          { fontSize: F.base, fontWeight: '700', color: C.text, marginBottom: 12 },
  chips:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:           { flexDirection: 'row', alignItems: 'center', gap: 5,
                    backgroundColor: C.surface, borderRadius: R.pill,
                    paddingHorizontal: 14, paddingVertical: 10,
                    borderWidth: 1.5, borderColor: C.border },
  chipActive:     { backgroundColor: C.primaryLight, borderColor: C.primary },
  chipText:       { fontSize: F.base, color: C.textMid, fontWeight: '500' },
  chipTextActive: { color: C.primaryDark, fontWeight: '700' },
  ageRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepper:        { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface,
                    justifyContent: 'center', alignItems: 'center',
                    borderWidth: 1.5, borderColor: C.border },
  stepIcon:       { fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 26 },
  ageInput:       { width: 72, height: 52, backgroundColor: C.surface, borderRadius: R.md,
                    borderWidth: 1.5, borderColor: C.border,
                    fontSize: 26, fontWeight: '800', color: C.text },
  ageUnit:        { fontSize: F.base, color: C.textLight },
  btn:            { backgroundColor: C.primary, borderRadius: R.xl, paddingVertical: 17,
                    alignItems: 'center', marginTop: 12, ...shadow(2) },
  btnText:        { fontSize: F.lg, fontWeight: '700', color: '#fff' },
});

export default EditPersonalScreen;
