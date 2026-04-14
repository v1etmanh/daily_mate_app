import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,Linking ,
  Image,
  Slider
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { db } from '../utils/database';

const DishDetailScreen = ({ route, navigation }) => {
  const { dish } = route.params;
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);

  const handleFeedback = async (action, rating = null) => {
    try {
      const now = new Date().toISOString();
      
      // Find current session
      const sessionResult = await db.getFirstAsync(
        `SELECT id AS session_id FROM recommendation_sessions ORDER BY created_at DESC LIMIT 1`
      );
      
      if (sessionResult) {
        // Save feedback to local DB
        await db.runAsync(
          `INSERT INTO dish_feedback (session_id, dish_id, action, rating, feedback_at) 
           VALUES (?, ?, ?, ?, ?)`,
          [sessionResult.session_id, dish.dish_id, action, rating, now]
        );
        
        console.log(`Feedback saved for ${dish.dish_id}: ${action}, rating: ${rating}`);
      }
      
      // Close the modal if rating was submitted
      if (action === 'rated') {
        setRatingModalVisible(false);
      }
    } catch (error) {
      console.error('Error saving feedback:', error);
    }
  };

  const renderStars = (rating) => {
    let stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Text key={i} style={[styles.star, i <= rating ? styles.filledStar : styles.emptyStar]}>
          {i <= rating ? '★' : '☆'}
        </Text>
      );
    }
    return stars;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero Image/Gradient Banner */}
      <LinearGradient 
        colors={['#7B241C', '#E74C3C']} 
        style={styles.heroBanner}
      >
        <Text style={styles.dishEmoji}>🍜</Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>{dish.title}</Text>
        <View style={styles.metadata}>
          <Text style={styles.nation}>🇻🇳 Việt Nam</Text>
          <Text style={styles.time}>⏱ {dish.cook_time_min} phút</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TẠI SAO ĐƯỢC GỢI Ý</Text>
          {dish.explanation && dish.explanation.length > 0 ? (
            dish.explanation.map((exp, index) => (
              <Text key={index} style={styles.explanation}>{`• ${exp}`}</Text>
            ))
          ) : (
            <Text style={styles.explanation}>Không có giải thích cụ thể cho món này.</Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ĐIỂM PHÙ HỢP</Text>
          <View style={styles.barContainer}>
            <Text style={styles.barLabel}>Tổng thể</Text>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(dish.final_score || 0.7) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.barValue}>{Math.round((dish.final_score || 0.7) * 100)}%</Text>
          </View>
          
          <View style={styles.barContainer}>
            <Text style={styles.barLabel}>Hydration</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '74%' }]} />
            </View>
            <Text style={styles.barValue}>74%</Text>
          </View>
          
          <View style={styles.barContainer}>
            <Text style={styles.barLabel}>Nhiệt độ</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '91%' }]} />
            </View>
            <Text style={styles.barValue}>91%</Text>
          </View>
          
          <View style={styles.barContainer}>
            <Text style={styles.barLabel}>Khẩu vị</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '65%' }]} />
            </View>
            <Text style={styles.barValue}>65%</Text>
          </View>
          
          {dish.ingredient_boost && dish.ingredient_boost > 0 && (
            <View style={styles.barContainer}>
              <Text style={styles.barLabel}>Nguyên liệu</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(dish.ingredient_boost || 0) * 100}%` }]} />
              </View>
              <Text style={styles.barValue}>{Math.round((dish.ingredient_boost || 0) * 100)}%</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NGUYÊN LIỆU CHÍNH</Text>
          <View style={styles.ingredientsContainer}>
            <TouchableOpacity style={styles.ingredientTag}><Text style={styles.ingredientText}>Thịt bò</Text></TouchableOpacity>
            <TouchableOpacity style={styles.ingredientTag}><Text style={styles.ingredientText}>Bún</Text></TouchableOpacity>
            <TouchableOpacity style={styles.ingredientTag}><Text style={styles.ingredientText}>Sả</Text></TouchableOpacity>
            <TouchableOpacity style={styles.ingredientTag}><Text style={styles.ingredientText}>Ớt</Text></TouchableOpacity>
            <TouchableOpacity style={styles.ingredientTag}><Text style={styles.ingredientText}>Mắm ruốc</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GỢI Ý PHỤC VỤ</Text>
          <Text style={styles.servingSuggestion}>
            {dish.serving_suggestion || "Ăn nóng để phát huy tác dụng giữ ấm và tăng cường hương vị."}
          </Text>
        </View>
       {dish.image_url ? (
  <View style={styles.imageContainer}>
    <Image
      source={{ uri: dish.image_url }}
      style={styles.dishImage}
      resizeMode="contain"
      onError={(e) => console.log('Image error:', e.nativeEvent.error)}
    />
  </View>
) : null}
 <View style={styles.section}>
          <Text style={styles.sectionTitle}>CÁCH NẤU</Text>
          <Text style={styles.servingSuggestion} onPress={() => Linking.openURL(dish.url || "https://www.google.com")}>
            {dish.url || "Ăn nóng để phát huy tác dụng giữ ấm và tăng cường hương vị."}
          </Text>
        </View>

        <View style={styles.feedbackSection}>
          <Text style={styles.feedbackQuestion}>Bạn có muốn ăn món này không?</Text>
          <View style={styles.feedbackButtons}>
            <TouchableOpacity 
              style={[styles.feedbackButton, styles.eatButton]}
              onPress={() => handleFeedback('eaten')}
            >
              <Text style={styles.feedbackButtonText}>😋 Đã ăn</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.feedbackButton, styles.rateButton]}
              onPress={() => setRatingModalVisible(true)}
            >
              <Text style={styles.feedbackButtonText}>⭐ Đánh giá</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.feedbackButton, styles.skipButton]}
              onPress={() => handleFeedback('skipped')}
            >
              <Text style={styles.feedbackButtonText}>✕ Bỏ qua</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Rating Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={ratingModalVisible}
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Bạn thích món này đến đâu?</Text>
            
            <View style={styles.starsContainer}>
              {renderStars(selectedRating)}
            </View>
            
            <View style={styles.ratingControls}>
              {[1, 2, 3, 4, 5].map(num => (
                <TouchableOpacity 
                  key={num} 
                  style={[styles.ratingButton, selectedRating === num && styles.selectedRatingButton]}
                  onPress={() => setSelectedRating(num)}
                >
                  <Text style={[styles.ratingButtonText, selectedRating === num && styles.selectedRatingButtonText]}>
                    {num}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setRatingModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Hủy</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.submitButton, !selectedRating && styles.disabledButton]}
                onPress={() => handleFeedback('rated', selectedRating)}
                disabled={!selectedRating}
              >
                <Text style={styles.submitButtonText}>Gửi đánh giá</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  heroBanner: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dishEmoji: {
    fontSize: 80,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: -20,
    marginBottom: 8,
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  metadata: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  nation: {
    fontSize: 14,
    color: '#666',
    marginRight: 12,
  },
  time: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    backgroundColor: 'white',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  dishImage: {
  width: '100%',
  height: 220,
  borderRadius: 8,
  resizeMode: 'contain',
},
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  explanation: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  barLabel: {
    width: 80,
    fontSize: 14,
    color: '#333',
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
  barValue: {
    width: 40,
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  ingredientTag: {
    backgroundColor: '#f0f7ff',
    borderColor: '#007AFF',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  ingredientText: {
    color: '#007AFF',
    fontSize: 12,
  },
  servingSuggestion: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  feedbackSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  feedbackQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  feedbackButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  eatButton: {
    backgroundColor: '#4CD964',
  },
  rateButton: {
    backgroundColor: '#FFCC00',
  },
  skipButton: {
    backgroundColor: '#FF3B30',
  },
  feedbackButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  star: {
    fontSize: 30,
    marginHorizontal: 4,
  },
  filledStar: {
    color: '#FFCC00',
  },
  emptyStar: {
    color: '#ccc',
  },
  ratingControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  ratingButton: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  selectedRatingButton: {
    backgroundColor: '#007AFF',
  },
  ratingButtonText: {
    fontSize: 16,
    color: '#666',
  },
  selectedRatingButtonText: {
    color: 'white',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    alignItems: 'center',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
    marginLeft: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: 'bold',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DishDetailScreen;