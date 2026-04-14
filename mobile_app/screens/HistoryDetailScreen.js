import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView
} from 'react-native';

const HistoryDetailScreen = ({ route }) => {
  const { sessionId } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Chi tiết phiên gợi ý #{sessionId}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.description}>
          Đây là màn hình chi tiết lịch sử gợi ý món ăn. 
          Trong phiên bản hoàn chỉnh, màn hình này sẽ hiển thị 
          danh sách các món đã được gợi ý trong phiên này 
          cùng với phản hồi từ người dùng.
        </Text>
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
  content: {
    padding: 16,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default HistoryDetailScreen;