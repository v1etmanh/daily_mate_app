import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { loadAllMetrics, saveBodyMetrics } from '../utils/database';
import { useAppStore } from '../store/useAppStore';

const BodyMetricsScreen = () => {
  const [metrics, setMetrics] = useState([]);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [note, setNote] = useState('');
  const [chartData, setChartData] = useState(null);
  
  const { latestMetrics, setLatestMetrics } = useAppStore();

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      // Lấy toàn bộ metrics từ Firestore, sắp xếp desc theo measured_at
      const result = await loadAllMetrics();

      setMetrics(result);

      if (result.length > 0) {
        setLatestMetrics(result[0]);
        setHeight(result[0].height_cm.toString());
        setWeight(result[0].weight_kg.toString());
      }

      prepareChartData(result);
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  const prepareChartData = (metricsData) => {
    // Take the last 7 entries or all if less than 7
    const recentMetrics = metricsData.slice(0, 7).reverse(); // Reverse to have oldest first
    
    if (recentMetrics.length === 0) {
      setChartData(null);
      return;
    }
    
    // Format data for the chart
    const labels = recentMetrics.map(m => {
      const date = new Date(m.measured_at);
      return `${date.getDate()}/${date.getMonth()+1}`;
    });
    
    const weights = recentMetrics.map(m => parseFloat(m.weight_kg));
    
    setChartData({
      labels: labels,
      datasets: [{
        data: weights,
        strokeWidth: 2
      }]
    });
  };

  const calculateBMI = (heightCm, weightKg) => {
    if (!heightCm || !weightKg) return null;
    
    const heightM = heightCm / 100;
    return (weightKg / (heightM * heightM)).toFixed(1);
  };

  const saveNewMetrics = async () => {
    if (!height || !weight) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ chiều cao và cân nặng');
      return;
    }
    
    const heightNum = parseFloat(height);
    const weightNum = parseFloat(weight);
    
    if (isNaN(heightNum) || isNaN(weightNum) || heightNum <= 0 || weightNum <= 0) {
      Alert.alert('Lỗi', 'Chiều cao và cân nặng phải là số dương');
      return;
    }
    
    try {
      const now = new Date().toISOString();

      await saveBodyMetrics({
        height_cm: heightNum,
        weight_kg: weightNum,
        measured_at: now,
        note: note || '',
      });

      // Reload metrics
      loadMetrics();

      // Clear form
      setNote('');

      Alert.alert('Thành công', 'Dữ liệu chỉ số đã được lưu');
    } catch (error) {
      console.error('Error saving metrics:', error);
      Alert.alert('Lỗi', 'Không thể lưu dữ liệu chỉ số');
    }
  };

  const getBMICategory = (bmiValue) => {
    if (!bmiValue) return '';
    const bmiNum = parseFloat(bmiValue);
    if (bmiNum < 18.5) return { label: 'Thiếu cân', color: '#2196F3' };
    if (bmiNum < 25)   return { label: 'Bình thường', color: '#4CAF50' };
    if (bmiNum < 30)   return { label: 'Thừa cân', color: '#FFC107' };
    return { label: 'Béo phì', color: '#F44336' };
  };

  const bmi = latestMetrics ? calculateBMI(latestMetrics.height_cm, latestMetrics.weight_kg) : null;
  const bmiCategory = getBMICategory(bmi);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chỉ số cơ thể</Text>
      </View>
      
      {/* Current Metrics */}
      <View style={styles.currentMetrics}>
        <Text style={styles.sectionTitle}>Hiện tại</Text>
        <Text style={styles.metricItem}>Cân nặng: {latestMetrics ? `${latestMetrics.weight_kg} kg` : 'N/A'}</Text>
        <Text style={styles.metricItem}>Chiều cao: {latestMetrics ? `${latestMetrics.height_cm} cm` : 'N/A'}</Text>
        
        {bmi ? (
          <Text style={[styles.bmi, { color: getBMICategory(bmi)?.color || '#333' }]}>
            BMI: {bmi} ({getBMICategory(bmi)?.label} ✓)
          </Text>
        ) : (
          <Text style={styles.bmi}>BMI: N/A</Text>
        )}
      </View>
      
      {/* Add New Metrics Form */}
      <View style={styles.addMetricsForm}>
        <Text style={styles.sectionTitle}>+ Cập nhật chỉ số mới</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Chiều cao (cm)</Text>
          <TextInput
            style={styles.input}
            value={height}
            onChangeText={setHeight}
            placeholder="Ví dụ: 165"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Cân nặng (kg)</Text>
          <TextInput
            style={styles.input}
            value={weight}
            onChangeText={setWeight}
            placeholder="Ví dụ: 60"
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Ghi chú (tuỳ chọn)</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={setNote}
            placeholder="Ví dụ: Sau khi tập thể dục"
          />
        </View>
        
        <TouchableOpacity style={styles.addButton} onPress={saveNewMetrics}>
          <Text style={styles.addButtonText}>Lưu chỉ số</Text>
        </TouchableOpacity>
      </View>
      
      {/* Chart Section */}
      {chartData && (
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Lịch sử 7 ngày</Text>
          <LineChart
            data={chartData}
            width={350}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#fbfbfb',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 1,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#007AFF'
              }
            }}
            bezier
            style={styles.chart}
          />
        </View>
      )}
      
      {/* Full History */}
      <View style={styles.historySection}>
        <Text style={styles.sectionTitle}>Lịch sử đầy đủ</Text>
        {metrics.length > 0 ? (
          metrics.map((metric, index) => {
            const date = new Date(metric.measured_at);
            const bmiValue = calculateBMI(metric.height_cm, metric.weight_kg);
            return (
              <View key={index} style={styles.historyItem}>
                <View style={styles.historyDate}>
                  <Text style={styles.historyDateText}>
                    {date.toLocaleDateString('vi-VN')}{' '}
                    <Text style={styles.historyTime}>
                      {date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </Text>
                </View>
                <View style={styles.historyValues}>
                  <Text style={styles.historyValue}>{metric.weight_kg} kg</Text>
                  <Text style={styles.historyValue}>BMI {bmiValue}</Text>
                  {metric.note ? <Text style={styles.historyNote}>{metric.note}</Text> : null}
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.noHistoryText}>Chưa có dữ liệu</Text>
        )}
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
  },
  currentMetrics: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  metricItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#666',
  },
  bmi: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 8,
  },
  addMetricsForm: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  chartSection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  historySection: {
    backgroundColor: 'white',
    margin: 16,
    padding: 16,
    borderRadius: 8,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  historyDate: {},
  historyDateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  historyTime: {
    color: '#666',
    fontWeight: 'normal',
  },
  historyValues: {
    alignItems: 'flex-end',
  },
  historyValue: {
    fontSize: 14,
    color: '#333',
  },
  historyNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});

export default BodyMetricsScreen;