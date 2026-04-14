import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert
} from 'react-native';
import { loadIngredientCategories, loadIngredientsByCategories } from '../utils/database';
import { useAppStore } from '../store/useAppStore';

const MarketBasketScreen = () => {
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [step, setStep] = useState(1); // Step 1: select category, Step 2: select ingredients
  
  const { setRankedDishes } = useAppStore(); // To trigger re-fetch of recommendations

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const result = await loadIngredientCategories();
      
      // Map to UI format based on the specification
      const categoryMap = {
        'vegetable': { display: 'Rau củ', emoji: '🥦' },
        'fruit': { display: 'Trái cây', emoji: '🍎' },
        'protein': { display: 'Protein', emoji: '🍖' },
        'grain': { display: 'Tinh bột', emoji: '🌾' },
        'dairy': { display: 'Sữa & Trứng', emoji: '🥛' },
        'spice': { display: 'Gia vị', emoji: '🧄' },
        'fat': { display: 'Dầu mỡ', emoji: '🫙' },
        'condiment': { display: 'Nước chấm', emoji: '🍶' },
      };
      
      const mappedCategories = result.map(cat => ({
        key: cat.category,
        ...categoryMap[cat.category] || { display: cat.category, emoji: '🥬' }
      }));
      
      setCategories(mappedCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadIngredientsByCategory = async (categoryKeys) => {
    if (!categoryKeys || categoryKeys.length === 0) { setIngredients([]); return; }
    try {
      const result = await loadIngredientsByCategories(categoryKeys);
      setIngredients(result);
    } catch (error) {
      console.error('Error loading ingredients:', error);
    }
  };

  const toggleCategory = (categoryKey) => {
    const newSelected = selectedCategories.includes(categoryKey)
      ? selectedCategories.filter(cat => cat !== categoryKey)
      : [...selectedCategories, categoryKey];
    
    setSelectedCategories(newSelected);
    
    if (newSelected.length > 0) {
      setStep(2); // Move to step 2 when categories are selected
      loadIngredientsByCategory(newSelected);
    } else {
      setStep(1); // Go back to step 1 if no categories selected
      setIngredients([]);
    }
  };

  const toggleIngredient = (ingredientId) => {
    const newSelected = selectedIngredients.includes(ingredientId)
      ? selectedIngredients.filter(id => id !== ingredientId)
      : [...selectedIngredients, ingredientId];
    
    setSelectedIngredients(newSelected);
  };

  const handleApply = () => {
    // In a real implementation, this would update the store with the basket
    // and trigger a refetch in HomeScreen
    Alert.alert(
      'Thành công',
      `Đã áp dụng ${selectedIngredients.length} nguyên liệu vào giỏ hàng. 
      Tính năng tích hợp với hệ thống gợi ý sẽ được hoàn thiện trong phiên bản tới.`,
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const handleSkip = () => {
    setSelectedIngredients([]);
    Alert.alert(
      'Đã bỏ qua',
      'Bạn đã bỏ qua việc chọn nguyên liệu. Gợi ý sẽ không được điều chỉnh.',
      [{ text: 'OK', onPress: () => {} }]
    );
  };

  const groupedIngredients = ingredients.reduce((acc, ingredient) => {
    if (!acc[ingredient.category]) {
      acc[ingredient.category] = [];
    }
    acc[ingredient.category].push(ingredient);
    return acc;
  }, {});

  const renderCategoryButton = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategories.includes(item.key) && styles.selectedCategory
      ]}
      onPress={() => toggleCategory(item.key)}
    >
      <Text style={styles.categoryEmoji}>{item.emoji}</Text>
      <Text style={[
        styles.categoryText,
        selectedCategories.includes(item.key) && styles.selectedCategoryText
      ]}>
        {item.display}
      </Text>
    </TouchableOpacity>
  );

  const renderIngredientItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.ingredientItem,
        selectedIngredients.includes(item.id) && styles.selectedIngredient
      ]}
      onPress={() => toggleIngredient(item.id)}
    >
      <Text style={[
        styles.ingredientText,
        selectedIngredients.includes(item.id) && styles.selectedIngredientText
      ]}>
        {item.name}
      </Text>
      {selectedIngredients.includes(item.id) && (
        <Text style={styles.checkmark}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>← Đi chợ hôm nay</Text>
        <Text style={styles.headerSubtitle}>Chọn những gì bạn đã mua</Text>
      </View>

      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>
          {step === 1 ? 'STEP 1: Chọn nhóm nguyên liệu' : 'STEP 2: Chọn nguyên liệu'}
        </Text>
      </View>

      {step === 1 ? (
        <View style={styles.categoriesContainer}>
          {categories.length > 0 ? (
            <FlatList
              data={categories}
              renderItem={renderCategoryButton}
              keyExtractor={item => item.key}
              numColumns={2}
              columnWrapperStyle={styles.categoryRow}
            />
          ) : (
            <View style={styles.loadingContainer}>
              <Text>Đang tải danh mục...</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.ingredientsContainer}>
          {Object.entries(groupedIngredients).length > 0 ? (
            Object.entries(groupedIngredients).map(([categoryKey, ingList]) => {
              const category = categories.find(cat => cat.key === categoryKey);
              return (
                <View key={categoryKey} style={styles.categorySection}>
                  <Text style={styles.categorySectionTitle}>
                    {category?.display || categoryKey} ({ingList.length})
                  </Text>
                  <View style={styles.ingredientsGrid}>
                    {ingList.map(ingredient => (
                      <TouchableOpacity
                        key={ingredient.id}
                        style={[
                          styles.ingredientChip,
                          selectedIngredients.includes(ingredient.id) && styles.selectedIngredientChip
                        ]}
                        onPress={() => toggleIngredient(ingredient.id)}
                      >
                        <Text style={[
                          styles.ingredientChipText,
                          selectedIngredients.includes(ingredient.id) && styles.selectedIngredientChipText
                        ]}>
                          {ingredient.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })
          ) : (
            <View style={styles.loadingContainer}>
              <Text>Không có nguyên liệu nào trong danh mục đã chọn</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.footer}>
        <View style={styles.selectedCount}>
          <Text>Đã chọn: {selectedIngredients.length} nguyên liệu</Text>
        </View>
        <View style={styles.buttonGroup}>
          <TouchableOpacity 
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipButtonText}>Bỏ qua</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.applyButton}
            onPress={handleApply}
            disabled={selectedIngredients.length === 0}
          >
            <Text style={styles.applyButtonText}>Áp dụng →</Text>
          </TouchableOpacity>
        </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  stepContainer: {
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 8,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  categoriesContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  categoryRow: {
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryButton: {
    flex: 0.48,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  categoryEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedCategoryText: {
    color: 'white',
  },
  ingredientsContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categorySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  ingredientChip: {
    backgroundColor: 'white',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 4,
    width: '48%',
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selectedIngredientChip: {
    backgroundColor: '#007AFF',
  },
  ingredientChipText: {
    fontSize: 14,
    color: '#333',
  },
  selectedIngredientChipText: {
    color: 'white',
  },
  footer: {
    flexDirection: 'column',
    backgroundColor: 'white',
    padding: 16,
    margin: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  selectedCount: {
    marginBottom: 12,
  },
  buttonGroup: {
    flexDirection: 'row',
  },
  skipButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
    fontWeight: 'bold',
    fontSize: 16,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MarketBasketScreen;