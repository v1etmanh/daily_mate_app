import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Dimensions } from 'react-native';
import { C, R, F, shadow } from '../../theme';

const { width } = Dimensions.get('window');

const Leaf = ({ size = 40, color, rotate = '0deg', x = 0, y = 0 }) => (
  <View style={{
    position: 'absolute', left: x, top: y,
    width: size, height: size * 1.4,
    borderRadius: size / 2, backgroundColor: color,
    transform: [{ rotate }], opacity: 0.85,
  }} />
);

const OnboardingWelcome = ({ navigation }) => {
  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />

      {/* Illustration area */}
      <View style={s.illustrationWrap}>
        <View style={s.circle3} />
        <View style={s.circle2} />
        <View style={s.circle1} />
        <Leaf size={48} color={C.primary}       rotate="-20deg" x={60}  y={20} />
        <Leaf size={32} color={C.primaryLight}  rotate="30deg"  x={190} y={60} />
        <Leaf size={24} color={C.orange}        rotate="-50deg" x={40}  y={110} />
        <Leaf size={36} color={C.teal}          rotate="15deg"  x={220} y={20} />
        {/* Bowl icon */}
        <View style={s.bowlWrap}>
          <View style={s.bowlBase} />
          <View style={s.bowlTop} />
          <Text style={s.bowlEmoji}>🍜</Text>
        </View>
      </View>

      {/* Content */}
      <View style={s.content}>
        <View style={s.badge}>
          <Text style={s.badgeText}>🌿 Ăn đúng · Sống khoẻ</Text>
        </View>
        <Text style={s.title}>Daily Mate</Text>
        <Text style={s.subtitle}>
          Gợi ý món ăn thông minh theo thời tiết,{'\n'}sức khoẻ và khẩu vị của bạn
        </Text>

        {/* Feature pills */}
        <View style={s.pills}>
          {[
            { icon: '🌤', label: 'Theo thời tiết' },
            { icon: '💪', label: 'Cá nhân hoá' },
            { icon: '🛒', label: 'Tận dụng nguyên liệu' },
          ].map(({ icon, label }) => (
            <View key={label} style={s.pill}>
              <Text style={s.pillIcon}>{icon}</Text>
              <Text style={s.pillLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={s.bottom}>
        <TouchableOpacity style={s.btn}
          onPress={() => navigation.navigate('OnboardingPersonal')}
          activeOpacity={0.88}>
          <Text style={s.btnText}>Bắt đầu ngay</Text>
          <Text style={s.btnArrow}>→</Text>
        </TouchableOpacity>
        <Text style={s.skip}>Mất khoảng 1 phút để thiết lập</Text>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: C.bg },
  illustrationWrap: { height: 260, backgroundColor: C.primaryLight, overflow: 'hidden',
                      alignItems: 'center', justifyContent: 'center' },
  circle1:        { position: 'absolute', width: 220, height: 220, borderRadius: 110,
                    backgroundColor: C.primary, opacity: 0.12 },
  circle2:        { position: 'absolute', width: 160, height: 160, borderRadius: 80,
                    backgroundColor: C.primary, opacity: 0.18 },
  circle3:        { position: 'absolute', width: 300, height: 300, borderRadius: 150,
                    backgroundColor: C.primaryLight, opacity: 0.6,
                    top: -60, right: -60 },
  bowlWrap:       { alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  bowlBase:       { width: 100, height: 52, borderRadius: 50, backgroundColor: C.surface,
                    ...shadow(2), position: 'absolute', bottom: -8 },
  bowlTop:        { width: 100, height: 52, borderTopLeftRadius: 50, borderTopRightRadius: 50,
                    backgroundColor: C.surface, ...shadow(1), marginBottom: 4 },
  bowlEmoji:      { fontSize: 52, position: 'absolute', top: -30 },
  content:        { flex: 1, padding: 28, paddingTop: 32 },
  badge:          { alignSelf: 'flex-start', backgroundColor: C.primaryLight,
                    borderRadius: R.pill, paddingHorizontal: 14, paddingVertical: 6,
                    marginBottom: 16, borderWidth: 1, borderColor: C.border },
  badgeText:      { fontSize: F.sm, color: C.primaryDark, fontWeight: '600' },
  title:          { fontSize: 40, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  subtitle:       { fontSize: F.lg, color: C.textMid, lineHeight: 26, marginTop: 10 },
  pills:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 24 },
  pill:           { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
                    borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 8,
                    ...shadow(1), gap: 6 },
  pillIcon:       { fontSize: 15 },
  pillLabel:      { fontSize: F.sm, color: C.textMid, fontWeight: '500' },
  bottom:         { padding: 28, paddingTop: 0 },
  btn:            { backgroundColor: C.primary, borderRadius: R.xl, paddingVertical: 17,
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                    gap: 8, ...shadow(2) },
  btnText:        { fontSize: F.lg, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  btnArrow:       { fontSize: F.xl, color: '#fff', fontWeight: '300' },
  skip:           { textAlign: 'center', fontSize: F.sm, color: C.textLight, marginTop: 12 },
});

export default OnboardingWelcome;
