import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';
import { C, R, F, shadow } from '../theme';

const DIET_LABEL = { omnivore:'Ăn tất cả', vegetarian:'Chay', vegan:'Thuần chay', pescatarian:'Ăn cá' };
const ACTIVITY_LABEL = { sedentary:'Ít vận động', lightly_active:'Nhẹ nhàng', moderately_active:'Vừa phải', very_active:'Nhiều vận động' };
const GENDER_ICON = { male:'👨', female:'👩', other:'🧑' };

const StatCard = ({ label, value, unit, color }) => (
  <View style={[s.statCard, { borderTopColor: color, borderTopWidth: 3 }]}>
    <Text style={[s.statValue, { color }]}>{value}</Text>
    {unit ? <Text style={s.statUnit}>{unit}</Text> : null}
    <Text style={s.statLabel}>{label}</Text>
  </View>
);

const MenuItem = ({ icon, label, sub, onPress, danger }) => (
  <TouchableOpacity style={s.menuRow} onPress={onPress} activeOpacity={0.75}>
    <View style={[s.menuIcon, { backgroundColor: danger ? C.orangeLight : C.primaryLight }]}>
      <Text style={{ fontSize: 18 }}>{icon}</Text>
    </View>
    <View style={{ flex: 1, marginLeft: 14 }}>
      <Text style={[s.menuLabel, danger && { color: C.danger }]}>{label}</Text>
      {sub ? <Text style={s.menuSub}>{sub}</Text> : null}
    </View>
    <Text style={s.menuArrow}>›</Text>
  </TouchableOpacity>
);

const ProfileScreen = ({ navigation }) => {
  const { profile, latestMetrics } = useAppStore();

  let bmi = null, bmiColor = C.primary, bmiLabel = 'N/A';
  if (latestMetrics?.height_cm && latestMetrics?.weight_kg) {
    const h = latestMetrics.height_cm / 100;
    bmi = (latestMetrics.weight_kg / (h * h)).toFixed(1);
    if (bmi < 18.5)      { bmiColor = '#2196B0'; bmiLabel = 'Thiếu cân'; }
    else if (bmi < 25)   { bmiColor = C.primary; bmiLabel = 'Bình thường'; }
    else if (bmi < 30)   { bmiColor = C.amber;   bmiLabel = 'Thừa cân'; }
    else                 { bmiColor = C.danger;  bmiLabel = 'Béo phì'; }
  }

  return (
    <View style={s.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* Hero card */}
      <LinearGradient colors={[C.primaryDark, C.primaryMid, C.primary]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.hero}>
        <View style={s.avatarWrap}>
          <Text style={s.avatarEmoji}>{GENDER_ICON[profile?.gender] || '👤'}</Text>
        </View>
        <Text style={s.heroAge}>{profile?.age ? `${profile.age} tuổi` : 'Chưa thiết lập'}</Text>
        <View style={s.heroPills}>
          {profile?.diet_type && (
            <View style={s.heroPill}><Text style={s.heroPillText}>{DIET_LABEL[profile.diet_type]}</Text></View>
          )}
          {profile?.activity_level && (
            <View style={s.heroPill}><Text style={s.heroPillText}>{ACTIVITY_LABEL[profile.activity_level]}</Text></View>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {/* Stats row */}
        <View style={s.statsRow}>
          <StatCard label="Cân nặng" value={latestMetrics?.weight_kg ?? '–'} unit="kg" color={C.teal} />
          <StatCard label="Chiều cao" value={latestMetrics?.height_cm ?? '–'} unit="cm" color={C.primary} />
          <StatCard label={bmiLabel} value={bmi ?? '–'} unit="" color={bmiColor} />
        </View>

        {/* Menu */}
        <View style={s.menuSection}>
          <Text style={s.sectionTitle}>Hồ sơ</Text>
          <View style={s.menuCard}>
            <MenuItem icon="👤" label="Thông tin cá nhân"
              sub={profile ? `${profile.age} tuổi · ${DIET_LABEL[profile.diet_type]||''}` : 'Chưa có dữ liệu'}
              onPress={() => navigation.navigate('EditPersonal')} />
            <View style={s.divider} />
            <MenuItem icon="⚖️" label="Chỉ số cơ thể"
              sub={latestMetrics ? `${latestMetrics.weight_kg} kg · BMI ${bmi}` : 'Chưa có dữ liệu'}
              onPress={() => navigation.navigate('BodyMetrics')} />
            <View style={s.divider} />
            <MenuItem icon="⚠️" label="Dị ứng & Chế độ ăn"
              sub="Quản lý thực phẩm cần tránh"
              onPress={() => navigation.navigate('Allergy')} />
          </View>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: C.bg },
  hero:         { paddingTop: 40, paddingBottom: 28, alignItems: 'center' },
  avatarWrap:   { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.25)',
                  justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarEmoji:  { fontSize: 44 },
  heroAge:      { fontSize: F.xl, fontWeight: '800', color: '#fff' },
  heroPills:    { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center', paddingHorizontal: 24 },
  heroPill:     { backgroundColor: 'rgba(255,255,255,0.22)', borderRadius: R.pill,
                  paddingHorizontal: 12, paddingVertical: 5 },
  heroPillText: { fontSize: F.sm, color: '#fff', fontWeight: '600' },
  statsRow:     { flexDirection: 'row', gap: 10, margin: 16 },
  statCard:     { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: 14,
                  alignItems: 'center', ...shadow(1) },
  statValue:    { fontSize: F.xl, fontWeight: '800' },
  statUnit:     { fontSize: F.sm, color: C.textLight, marginTop: 1 },
  statLabel:    { fontSize: F.xs, color: C.textLight, marginTop: 4, textAlign: 'center' },
  menuSection:  { marginHorizontal: 16 },
  sectionTitle: { fontSize: F.sm, fontWeight: '700', color: C.textLight,
                  textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10, marginLeft: 4 },
  menuCard:     { backgroundColor: C.surface, borderRadius: R.lg, overflow: 'hidden', ...shadow(1) },
  menuRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
  menuIcon:     { width: 40, height: 40, borderRadius: R.md, justifyContent: 'center', alignItems: 'center' },
  menuLabel:    { fontSize: F.base, fontWeight: '600', color: C.text },
  menuSub:      { fontSize: F.sm, color: C.textLight, marginTop: 2 },
  menuArrow:    { fontSize: 22, color: C.border, fontWeight: '300' },
  divider:      { height: 1, backgroundColor: C.borderLight, marginLeft: 70 },
});

export default ProfileScreen;
