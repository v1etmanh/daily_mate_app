import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveProfile } from '../../utils/database';
import { useAppStore } from '../../store/useAppStore';
import { C, R, F, shadow } from '../../theme';

const ProgressDots = ({ current, total }) => (
  <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
    {Array.from({ length: total }).map((_, i) => (
      <View key={i} style={{
        width: i === current ? 20 : 7, height: 7, borderRadius: 4,
        backgroundColor: i === current ? C.primary : C.border,
      }} />
    ))}
  </View>
);

const ChipGroup = ({ label, options, value, onChange, multi = false }) => (
  <View style={s.fieldBlock}>
    <Text style={s.fieldLabel}>{label}</Text>
    <View style={s.chips}>
      {options.map(({ key, icon, text }) => {
        const active = multi ? value?.includes(key) : value === key;
        return (
          <TouchableOpacity key={key}
            style={[s.chip, active && s.chipActive]}
            onPress={() => {
              if (multi) {
                const next = value?.includes(key)
                  ? value.filter(v => v !== key)
                  : [...(value || []), key];
                onChange(next);
              } else onChange(key);
            }}
            activeOpacity={0.75}>
            {icon ? <Text style={s.chipIcon}>{icon}</Text> : null}
            <Text style={[s.chipText, active && s.chipTextActive]}>{text}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const GENDER_OPTS    = [{ key:'male',icon:'👨',text:'Nam' },{ key:'female',icon:'👩',text:'Nữ' },{ key:'other',icon:'🧑',text:'Khác' }];
const DIET_OPTS      = [{ key:'omnivore',icon:'🍗',text:'Ăn tất cả' },{ key:'vegetarian',icon:'🥬',text:'Chay' },{ key:'vegan',icon:'🌱',text:'Thuần chay' },{ key:'pescatarian',icon:'🐟',text:'Ăn cá' }];
const GOAL_OPTS      = [{ key:'maintenance',icon:'⚖️',text:'Duy trì' },{ key:'weight_loss',icon:'📉',text:'Giảm cân' },{ key:'muscle_gain',icon:'💪',text:'Tăng cơ' },{ key:'detox',icon:'🌿',text:'Detox' }];
const ACTIVITY_OPTS  = [{ key:'sedentary',text:'Ít vận động' },{ key:'lightly_active',text:'Nhẹ nhàng' },{ key:'moderately_active',text:'Vừa phải' },{ key:'very_active',text:'Nhiều' }];

const OnboardingPersonal = ({ navigation }) => {
  const [age, setAge]             = useState('25');
  const [gender, setGender]       = useState('female');
  const [dietType, setDietType]   = useState('omnivore');
  const [goal, setGoal]           = useState('maintenance');
  const [activity, setActivity]   = useState('moderately_active');
  const [saving, setSaving]       = useState(false);
  const { setProfile }            = useAppStore();

  const handleSave = async () => {
    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum) || ageNum < 10 || ageNum > 100) {
      Alert.alert('Lỗi', 'Vui lòng nhập tuổi hợp lệ (10–100)'); return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const profileData = {
        age: ageNum, gender,
        diet_type: dietType, dietary_goal: goal,
        activity_level: activity, updated_at: now,
      };
      await saveProfile(profileData);
      setProfile({ id: 1, ...profileData, created_at: now });
      navigation.navigate('OnboardingAllergy');
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể lưu thông tin. Thử lại nhé.');
    } finally { setSaving(false); }
  };

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      {/* Header */}
      <View style={s.header}>
        <ProgressDots current={1} total={3} />
        <Text style={s.step}>Bước 2 / 3</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <Text style={s.title}>Thông tin của bạn</Text>
        <Text style={s.sub}>Để gợi ý phù hợp hơn với nhu cầu dinh dưỡng</Text>

        {/* Age */}
        <View style={s.fieldBlock}>
          <Text style={s.fieldLabel}>Tuổi</Text>
          <View style={s.ageRow}>
            <TouchableOpacity style={s.ageStepper}
              onPress={() => setAge(a => String(Math.max(10, parseInt(a||25) - 1)))}>
              <Text style={s.ageStep}>−</Text>
            </TouchableOpacity>
            <TextInput style={s.ageInput} value={age} onChangeText={setAge}
              keyboardType="numeric" maxLength={3} textAlign="center" />
            <Text style={s.ageUnit}>tuổi</Text>
            <TouchableOpacity style={s.ageStepper}
              onPress={() => setAge(a => String(Math.min(100, parseInt(a||25) + 1)))}>
              <Text style={s.ageStep}>+</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ChipGroup label="Giới tính" options={GENDER_OPTS}   value={gender}   onChange={setGender} />
        <ChipGroup label="Chế độ ăn" options={DIET_OPTS}     value={dietType} onChange={setDietType} />
        <ChipGroup label="Mục tiêu"   options={GOAL_OPTS}    value={goal}     onChange={setGoal} />
        <ChipGroup label="Mức vận động" options={ACTIVITY_OPTS} value={activity} onChange={setActivity} />

        <TouchableOpacity style={[s.btn, saving && { opacity: 0.7 }]}
          onPress={handleSave} disabled={saving} activeOpacity={0.85}>
          <Text style={s.btnText}>{saving ? 'Đang lưu...' : 'Tiếp tục →'}</Text>
        </TouchableOpacity>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: C.bg },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                paddingHorizontal: 24, paddingTop: 16, paddingBottom: 10, backgroundColor: C.bg },
  step:       { fontSize: F.sm, color: C.textLight, fontWeight: '500' },
  scroll:     { padding: 24, paddingTop: 8 },
  title:      { fontSize: F.h2, fontWeight: '800', color: C.text, marginBottom: 6 },
  sub:        { fontSize: F.base, color: C.textMid, lineHeight: 22, marginBottom: 28 },
  fieldBlock: { marginBottom: 24 },
  fieldLabel: { fontSize: F.base, fontWeight: '700', color: C.text, marginBottom: 12 },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:       { flexDirection: 'row', alignItems: 'center', gap: 5,
                backgroundColor: C.surface, borderRadius: R.pill,
                paddingHorizontal: 14, paddingVertical: 10,
                borderWidth: 1.5, borderColor: C.border },
  chipActive: { backgroundColor: C.primaryLight, borderColor: C.primary },
  chipIcon:   { fontSize: 15 },
  chipText:   { fontSize: F.base, color: C.textMid, fontWeight: '500' },
  chipTextActive: { color: C.primaryDark, fontWeight: '700' },
  ageRow:     { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ageStepper: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.surface,
                justifyContent: 'center', alignItems: 'center',
                borderWidth: 1.5, borderColor: C.border },
  ageStep:    { fontSize: 22, color: C.primary, fontWeight: '600', lineHeight: 26 },
  ageInput:   { width: 72, height: 52, backgroundColor: C.surface, borderRadius: R.md,
                borderWidth: 1.5, borderColor: C.border,
                fontSize: 26, fontWeight: '800', color: C.text },
  ageUnit:    { fontSize: F.base, color: C.textLight },
  btn:        { backgroundColor: C.primary, borderRadius: R.xl, paddingVertical: 17,
                alignItems: 'center', marginTop: 8, ...shadow(2) },
  btnText:    { fontSize: F.lg, fontWeight: '700', color: '#fff' },
});

export default OnboardingPersonal;
