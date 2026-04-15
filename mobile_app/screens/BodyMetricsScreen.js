import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, StatusBar, Alert, Dimensions,
} from 'react-native';
import { loadAllMetrics, saveBodyMetrics } from '../utils/database';
import { useAppStore } from '../store/useAppStore';
import { C, R, F, shadow } from '../theme';

const W = Dimensions.get('window').width;

const BMI_INFO = (bmi) => {
  if (!bmi) return { label: 'N/A', color: C.textLight, bg: C.bg };
  const b = parseFloat(bmi);
  if (b < 18.5) return { label: 'Thiếu cân',  color: C.teal,    bg: C.tealLight };
  if (b < 25)   return { label: 'Bình thường', color: C.primary, bg: C.primaryLight };
  if (b < 30)   return { label: 'Thừa cân',    color: C.amber,   bg: C.amberLight };
  return             { label: 'Béo phì',      color: C.danger,  bg: '#FFE5E5' };
};

const BodyMetricsScreen = ({ navigation }) => {
  const [metrics, setMetrics] = useState([]);
  const [height, setHeight]   = useState('');
  const [weight, setWeight]   = useState('');
  const [note, setNote]       = useState('');
  const { latestMetrics, setLatestMetrics } = useAppStore();

  useEffect(() => { loadMetrics(); }, []);

  const loadMetrics = async () => {
    try {
      const result = await loadAllMetrics();
      setMetrics(result);
      if (result.length > 0) {
        setLatestMetrics(result[0]);
        setHeight(String(result[0].height_cm));
        setWeight(String(result[0].weight_kg));
      }
    } catch (e) { console.error(e); }
  };

  const calcBMI = (h, w) => {
    if (!h || !w) return null;
    return (parseFloat(w) / ((parseFloat(h) / 100) ** 2)).toFixed(1);
  };

  const handleSave = async () => {
    const h = parseFloat(height), w = parseFloat(weight);
    if (isNaN(h) || isNaN(w) || h <= 0 || w <= 0) {
      Alert.alert('Lỗi', 'Chiều cao và cân nặng phải là số dương'); return;
    }
    try {
      await saveBodyMetrics({ height_cm: h, weight_kg: w, measured_at: new Date().toISOString(), note: note || '' });
      setNote('');
      await loadMetrics();
      Alert.alert('Đã lưu ✓', 'Chỉ số cơ thể đã được cập nhật.');
    } catch (e) { Alert.alert('Lỗi', 'Không thể lưu dữ liệu'); }
  };

  const bmi = calcBMI(latestMetrics?.height_cm, latestMetrics?.weight_kg);
  const bmiInfo = BMI_INFO(bmi);

  return (
    <View style={s.root}>
      <StatusBar barStyle="dark-content" backgroundColor={C.bg} />
      {/* Nav */}
      <View style={s.nav}>
        <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
          <Text style={s.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={s.navTitle}>Chỉ số cơ thể</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* BMI Hero Card */}
        <View style={[s.bmiCard, { backgroundColor: bmiInfo.bg, borderColor: bmiInfo.color }]}>
          <View style={s.bmiLeft}>
            <Text style={s.bmiNum}>{bmi ?? '–'}</Text>
            <Text style={s.bmiLabel}>BMI</Text>
          </View>
          <View style={s.bmiRight}>
            <View style={[s.bmiStatusPill, { backgroundColor: bmiInfo.color }]}>
              <Text style={s.bmiStatusText}>{bmiInfo.label}</Text>
            </View>
            <Text style={s.bmiSub}>
              {latestMetrics?.weight_kg ? `${latestMetrics.weight_kg} kg` : '–'} ·{' '}
              {latestMetrics?.height_cm ? `${latestMetrics.height_cm} cm` : '–'}
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={s.statsRow}>
          {[
            { label: 'Cân nặng', val: latestMetrics?.weight_kg, unit: 'kg', color: C.teal },
            { label: 'Chiều cao', val: latestMetrics?.height_cm, unit: 'cm', color: C.primary },
            { label: 'Lần đo', val: metrics.length, unit: 'lần', color: C.amber },
          ].map(({ label, val, unit, color }) => (
            <View key={label} style={[s.statCard, { borderTopColor: color }]}>
              <Text style={[s.statNum, { color }]}>{val ?? '–'}</Text>
              <Text style={s.statUnit}>{unit}</Text>
              <Text style={s.statLabel}>{label}</Text>
            </View>
          ))}
        </View>


        {/* Form nhập liệu */}
        <View style={s.formCard}>
          <Text style={s.formTitle}>Cập nhật chỉ số</Text>

          <View style={s.inputRow}>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Chiều cao</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input} value={height} onChangeText={setHeight}
                  keyboardType="decimal-pad" placeholder="cm" placeholderTextColor={C.textLight}
                />
                <Text style={s.inputUnit}>cm</Text>
              </View>
            </View>
            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>Cân nặng</Text>
              <View style={s.inputWrap}>
                <TextInput
                  style={s.input} value={weight} onChangeText={setWeight}
                  keyboardType="decimal-pad" placeholder="kg" placeholderTextColor={C.textLight}
                />
                <Text style={s.inputUnit}>kg</Text>
              </View>
            </View>
          </View>

          <View style={s.noteWrap}>
            <TextInput
              style={s.noteInput} value={note} onChangeText={setNote}
              placeholder="Ghi chú (tuỳ chọn)" placeholderTextColor={C.textLight}
              multiline maxLength={120}
            />
          </View>

          <TouchableOpacity style={s.saveBtn} onPress={handleSave} activeOpacity={0.85}>
            <Text style={s.saveBtnText}>Lưu chỉ số ✓</Text>
          </TouchableOpacity>
        </View>

        {/* Lịch sử gần đây */}
        {metrics.length > 0 && (
          <View style={s.historyCard}>
            <Text style={s.formTitle}>Lịch sử đo</Text>
            {metrics.slice(0, 6).map((m, i) => {
              const d = new Date(m.measured_at);
              const b = calcBMI(m.height_cm, m.weight_kg);
              const bi = BMI_INFO(b);
              return (
                <View key={i} style={[s.histRow, i < metrics.slice(0, 6).length - 1 && s.histDivider]}>
                  <View>
                    <Text style={s.histDate}>{d.getDate()}/{d.getMonth()+1}/{d.getFullYear()}</Text>
                    {m.note ? <Text style={s.histNote}>{m.note}</Text> : null}
                  </View>
                  <View style={s.histRight}>
                    <Text style={s.histWeight}>{m.weight_kg} kg</Text>
                    <View style={[s.histBmiPill, { backgroundColor: bi.bg }]}>
                      <Text style={[s.histBmiText, { color: bi.color }]}>BMI {b}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: C.bg },
  nav:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                   paddingHorizontal: 16, paddingVertical: 12, backgroundColor: C.surface,
                   borderBottomWidth: 1, borderBottomColor: C.borderLight },
  back:          { width: 40, height: 40, justifyContent: 'center' },
  backArrow:     { fontSize: 28, color: C.primary, fontWeight: '300', lineHeight: 34 },
  navTitle:      { fontSize: F.lg, fontWeight: '700', color: C.text },
  scroll:        { padding: 16 },
  bmiCard:       { borderRadius: R.lg, borderWidth: 1.5, padding: 20, flexDirection: 'row',
                   alignItems: 'center', marginBottom: 14, ...shadow(1) },
  bmiLeft:       { alignItems: 'center', marginRight: 20 },
  bmiNum:        { fontSize: 48, fontWeight: '800', color: C.text, lineHeight: 52 },
  bmiLabel:      { fontSize: F.sm, color: C.textLight, fontWeight: '600', letterSpacing: 1 },
  bmiRight:      { flex: 1 },
  bmiStatusPill: { alignSelf: 'flex-start', borderRadius: R.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 8 },
  bmiStatusText: { fontSize: F.base, fontWeight: '700', color: '#fff' },
  bmiSub:        { fontSize: F.base, color: C.textMid },
  statsRow:      { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard:      { flex: 1, backgroundColor: C.surface, borderRadius: R.md, padding: 12,
                   alignItems: 'center', borderTopWidth: 3, ...shadow(1) },
  statNum:       { fontSize: F.xl, fontWeight: '800' },
  statUnit:      { fontSize: F.xs, color: C.textLight, marginTop: 1 },
  statLabel:     { fontSize: F.xs, color: C.textLight, marginTop: 4 },
  formCard:      { backgroundColor: C.surface, borderRadius: R.lg, padding: 20, marginBottom: 14, ...shadow(1) },
  formTitle:     { fontSize: F.lg, fontWeight: '700', color: C.text, marginBottom: 16 },
  inputRow:      { flexDirection: 'row', gap: 12, marginBottom: 14 },
  inputGroup:    { flex: 1 },
  inputLabel:    { fontSize: F.sm, color: C.textMid, fontWeight: '600', marginBottom: 6 },
  inputWrap:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bg,
                   borderRadius: R.md, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 12 },
  input:         { flex: 1, fontSize: F.xl, fontWeight: '700', color: C.text, paddingVertical: 10 },
  inputUnit:     { fontSize: F.sm, color: C.textLight, fontWeight: '600' },
  noteWrap:      { backgroundColor: C.bg, borderRadius: R.md, borderWidth: 1.5,
                   borderColor: C.border, paddingHorizontal: 12, marginBottom: 16 },
  noteInput:     { fontSize: F.base, color: C.text, paddingVertical: 10, minHeight: 44 },
  saveBtn:       { backgroundColor: C.primary, borderRadius: R.xl, paddingVertical: 15,
                   alignItems: 'center', ...shadow(2) },
  saveBtnText:   { fontSize: F.lg, fontWeight: '700', color: '#fff' },
  historyCard:   { backgroundColor: C.surface, borderRadius: R.lg, padding: 20, ...shadow(1) },
  histRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  histDivider:   { borderBottomWidth: 1, borderBottomColor: C.borderLight },
  histDate:      { fontSize: F.base, fontWeight: '600', color: C.text },
  histNote:      { fontSize: F.sm, color: C.textLight, marginTop: 2 },
  histRight:     { alignItems: 'flex-end', gap: 4 },
  histWeight:    { fontSize: F.lg, fontWeight: '700', color: C.text },
  histBmiPill:   { borderRadius: R.pill, paddingHorizontal: 10, paddingVertical: 3 },
  histBmiText:   { fontSize: F.xs, fontWeight: '700' },
});

export default BodyMetricsScreen;
