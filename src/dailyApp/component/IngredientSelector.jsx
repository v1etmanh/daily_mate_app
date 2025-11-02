import React, { useState } from 'react';
import DishplayDishs from './DisplaysDishComponent';

const IngredientSelector = ({ ingredients, onSubmit, onBack }) => {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDishDisplay, setShowDishDisplay] = useState(false);
  const [dishData, setDishData] = useState(null);

  const MAX_SELECTION = 8;

  // Xử lý chọn/bỏ chọn nguyên liệu
  const handleIngredientToggle = (index, ingredient) => {
    setSelectedIngredients(prev => {
      const isSelected = prev.some(item => item.index === index);
      
      if (isSelected) {
        // Bỏ chọn
        return prev.filter(item => item.index !== index);
      } else {
        // Kiểm tra giới hạn 15
        if (prev.length >= MAX_SELECTION) {
          alert(`Bạn chỉ có thể chọn tối đa ${MAX_SELECTION} nguyên liệu!`);
          return prev;
        }
        // Chọn
        return [...prev, { 
          index, 
          name: ingredient.name, 
          reason: ingredient.reason 
        }];
      }
    });
  };

  // Kiểm tra nguyên liệu có được chọn không
  const isSelected = (index) => {
    return selectedIngredients.some(item => item.index === index);
  };

  // Xử lý submit
  const handleSubmit = async () => {
    if (selectedIngredients.length === 0) {
      alert('Vui lòng chọn ít nhất một nguyên liệu!');
      return;
    }

    setLoading(true);
    try {
      // Gọi API postIngre với danh sách nguyên liệu đã chọn
      const response = await onSubmit(selectedIngredients);
      setDishData(response);
      setShowDishDisplay(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Có lỗi xảy ra khi gửi dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  // Chọn ngẫu nhiên 15 nguyên liệu
  const handleRandomSelect = () => {
    if (ingredients.length <= MAX_SELECTION) {
      // Nếu ít hơn hoặc bằng 15, chọn tất cả
      const allIngredients = ingredients.map((ingredient, index) => ({
        index,
        name: ingredient.name,
        reason: ingredient.reason
      }));
      setSelectedIngredients(allIngredients);
    } else {
      // Chọn ngẫu nhiên 15
      const shuffled = [...ingredients]
        .map((ingredient, index) => ({ ingredient, index }))
        .sort(() => Math.random() - 0.5)
        .slice(0, MAX_SELECTION);
      
      const randomSelected = shuffled.map(item => ({
        index: item.index,
        name: item.ingredient.name,
        reason: item.ingredient.reason
      }));
      
      setSelectedIngredients(randomSelected);
    }
  };

  // Xử lý quay lại từ DishDisplay
  const handleBackFromDish = () => {
    setShowDishDisplay(false);
    setDishData(null);
  };

  if (!ingredients || ingredients.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.noData}>
          <p>Không có dữ liệu nguyên liệu</p>
          <button onClick={onBack} style={styles.backButton}>
            ← Quay lại
          </button>
        </div>
      </div>
    );
  }

  // Hiển thị component DishDisplay nếu có dữ liệu
  if (showDishDisplay && dishData) {
    return (
      <DishplayDishs 
        dishs={dishData} 
        onBack={handleBackFromDish}
        onSubmit={(evaluateData) => {
          // Xử lý dữ liệu đánh giá
          console.log('Evaluate data:', evaluateData);
        }}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🥬 Chọn Nguyên Liệu</h2>
        <p style={styles.subtitle}>
          Đã tìm thấy {ingredients.length} nguyên liệu phù hợp với thời tiết
        </p>
        
        <div style={styles.actionButtons}>
          <button onClick={onBack} style={styles.backButton}>
            ← Quay lại
          </button>
          <button onClick={handleRandomSelect} style={styles.selectAllButton}>
            🎲 Chọn ngẫu nhiên {Math.min(MAX_SELECTION, ingredients.length)}
          </button>
        </div>
        
        <div style={styles.selectedCounter}>
          <span style={styles.counterText}>
            Đã chọn: {selectedIngredients.length}/{MAX_SELECTION}
          </span>
        </div>
      </div>

      <div style={styles.ingredientsList}>
        {ingredients.map((ingredient, index) => (
          <div 
            key={index} 
            style={{
              ...styles.ingredientCard,
              ...(isSelected(index) ? styles.selectedCard : {})
            }}
          >
            <div style={styles.ingredientInfo}>
              <h3 style={styles.ingredientName}>
                {ingredient.name}
              </h3>
              <p style={styles.ingredientReason}>
                {ingredient.reason}
              </p>
            </div>
            
            <div style={styles.selectButtonContainer}>
              <button
                onClick={() => handleIngredientToggle(index, ingredient)}
                disabled={!isSelected(index) && selectedIngredients.length >= MAX_SELECTION}
                style={{
                  ...styles.selectButton,
                  ...(isSelected(index) ? styles.selectedButton : styles.unselectedButton),
                  ...(!isSelected(index) && selectedIngredients.length >= MAX_SELECTION ? styles.disabledSelectButton : {})
                }}
              >
                {isSelected(index) ? '✓ Đã chọn' : '+ Chọn'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky submit button */}
      <div style={styles.submitContainer}>
        <button
          onClick={handleSubmit}
          disabled={selectedIngredients.length === 0 || loading}
          style={{
            ...styles.submitButton,
            ...(selectedIngredients.length === 0 ? styles.disabledButton : {})
          }}
        >
          {loading ? (
            <>
              <span style={styles.spinner}></span>
              Đang xử lý...
            </>
          ) : (
            `🍽️ Gửi ${selectedIngredients.length} nguyên liệu`
          )}
        </button>
      </div>
    </div>
  );
};

// Styles (thêm style cho disabled button)
const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f5f5f5',
    minHeight: '100vh'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#333',
    marginBottom: '5px'
  },
  subtitle: {
    color: '#666',
    fontSize: '14px',
    marginBottom: '15px'
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '10px',
    marginBottom: '15px'
  },
  backButton: {
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  selectAllButton: {
    padding: '8px 16px',
    backgroundColor: '#17a2b8',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  selectedCounter: {
    padding: '10px',
    backgroundColor: '#e9ecef',
    borderRadius: '5px'
  },
  counterText: {
    fontWeight: 'bold',
    color: '#495057'
  },
  ingredientsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '80px'
  },
  ingredientCard: {
    backgroundColor: 'white',
    padding: '15px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    border: '2px solid transparent'
  },
  selectedCard: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff9'
  },
  ingredientInfo: {
    flex: 1,
    marginRight: '15px'
  },
  ingredientName: {
    margin: '0 0 8px 0',
    color: '#333',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  ingredientReason: {
    margin: '0',
    color: '#666',
    fontSize: '14px',
    lineHeight: '1.4'
  },
  selectButtonContainer: {
    flexShrink: 0
  },
  selectButton: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'all 0.3s ease'
  },
  selectedButton: {
    backgroundColor: '#28a745',
    color: 'white'
  },
  unselectedButton: {
    backgroundColor: '#f8f9fa',
    color: '#495057',
    border: '1px solid #dee2e6'
  },
  disabledSelectButton: {
    backgroundColor: '#e9ecef',
    color: '#6c757d',
    cursor: 'not-allowed',
    opacity: 0.6
  },
  submitContainer: {
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '90%',
    maxWidth: '560px',
    zIndex: 1000
  },
  submitButton: {
    width: '100%',
    padding: '15px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    transition: 'all 0.3s ease'
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed'
  },
  spinner: {
    display: 'inline-block',
    width: '16px',
    height: '16px',
    border: '2px solid #ffffff',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px'
  },
  noData: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: 'white',
    borderRadius: '10px'
  }
};

// CSS cho spinner animation
if (typeof document !== 'undefined') {
  const spinnerStyle = document.createElement('style');
  spinnerStyle.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(spinnerStyle);
}

export default IngredientSelector;