import React, { useEffect, useState } from 'react';
import { getALlUser, getEvaluate } from '../api/ApiConnect';

const DishCard = ({ dish, showAdvice }) => {
  return (
    <div style={styles.ingredientCard}>
      <div style={styles.ingredientInfo}>
        <h3 style={styles.ingredientName}>{dish.name}</h3>

        {/* Hiển thị lý do nếu có */}
        {dish.reason && (
          <div style={styles.reasonSection}>
            <h4>📝 Lý do:</h4>
            <p>{dish.reason}</p>
          </div>
        )}

        {/* Hiển thị phương pháp nấu nướng nếu có */}
        {dish.cookingMethod && (
          <div style={styles.cookingMethodSection}>
            <h4>👨‍🍳 Phương pháp nấu:</h4>
            <p>{dish.cookingMethod}</p>
          </div>
        )}

        {/* Hiển thị URL công thức nếu có */}
        {dish.url && (
          <div style={styles.urlSection}>
            <h4>🔗 Công thức:</h4>
            <a href={dish.url} target="_blank" rel="noopener noreferrer" style={styles.urlLink}>
              Xem công thức
            </a>
          </div>
        )}

        {/* Hiển thị thông tin đánh giá nếu đã có và showAdvice = true */}
        {showAdvice && dish.familySuitabilityLevel && (
          <>
            <div style={styles.adviceSection}>
              <h4>💡 Phù hợp với gia đình:</h4>
              <span style={{
                ...styles.suitabilityBadge,
                backgroundColor: getSuitabilityColor(dish.familySuitabilityLevel)
              }}>
                {dish.familySuitabilityLevel}
              </span>
            </div>

            {dish.suggestionNote && (
              <div style={styles.adviceSection}>
                <h4>📌 Gợi ý điều chỉnh:</h4>
                <p>{dish.suggestionNote}</p>
              </div>
            )}

            {dish.userSuitability && dish.userSuitability.length > 0 && (
              <div style={styles.adviceSection}>
                <h4>👨‍👩‍👧‍👦 Đánh giá từng thành viên:</h4>
                {dish.userSuitability.map((user, idx) => (
                  <div key={idx} style={styles.userAdviceItem}>
                    <div style={styles.userAdviceHeader}>
                      <strong>{user.userName}:</strong>
                      <span style={{
                        ...styles.scoreBadge,
                        backgroundColor: getScoreColor(user.score)
                      }}>
                        {user.score}
                      </span>
                    </div>
                    <div style={styles.userAdviceContent}>
                      <span style={styles.suitabilityText}>{user.suitability}</span>
                      {user.shortNote && <span style={styles.noteText}> – {user.shortNote}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Component chọn thành viên
const MemberSelector = ({ userProfiles, selectedMembers, onMemberChange }) => {
  const handleMemberToggle = (userName) => {
    const isSelected = selectedMembers.includes(userName);
    
    if (isSelected) {
      // Bỏ chọn thành viên
      onMemberChange(selectedMembers.filter(name => name !== userName));
    } else {
      // Thêm thành viên (tối đa 3)
      if (selectedMembers.length < 3) {
        onMemberChange([...selectedMembers, userName]);
      }
    }
  };

  return (
    <div style={styles.memberSelector}>
      <h4 style={styles.memberSelectorTitle}>👥 Chọn thành viên để đánh giá (tối đa 3 người):</h4>
      <div style={styles.memberList}>
        {userProfiles.map((user, index) => (
          <label key={user.name || index} style={styles.memberItem}>
            <input
              type="checkbox"
              checked={selectedMembers.includes(user.name)}
              onChange={() => handleMemberToggle(user.name)}
              disabled={!selectedMembers.includes(user.name) && selectedMembers.length >= 3}
              style={styles.memberCheckbox} 
            />
            <span style={styles.memberName}>{user.name}</span>
            <span style={styles.memberAge}>({user.age} tuổi)</span>
            <span style={styles.memberGender}> - {user.gender}</span>
          </label>
        ))}
      </div>
      <p style={styles.memberCount}>
        Đã chọn: {selectedMembers.length}/3 thành viên
      </p>
    </div>
  );
};

const DishDisplayComponent = ({ dishs, onBack, date }) => {
  const [loading, setLoading] = useState(false);
  const [showAdvice, setShowAdvice] = useState(false);
  const [localDishes, setLocalDishes] = useState(dishs || []);
  const [userProfiles, setUserProfiles] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      
   
        // Tự động chọn thành viên đầu tiên nếu có
       
        try {
          const response = await getALlUser();
        
          setUserProfiles(response.data);
          // Tự động chọn thành viên đầu tiên nếu có
          if (response.data.length > 0) {
            setSelectedMembers([response.data[0].name]); // Dùng name thay vì id
          }
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      
    };

    fetchUsers();
  }, []);

 const handleSubmit = async () => {
    if (selectedMembers.length === 0) {
      alert('Vui lòng chọn ít nhất 1 thành viên để đánh giá!');
      return;
    }

    setLoading(true);
    try {
      // Lấy thông tin chi tiết của các thành viên được chọn
      const selectedUserProfiles = userProfiles.filter(user => 
        selectedMembers.includes(user.name)
      );
      
      const response = await getEvaluate(localDishes, date, selectedUserProfiles);
      setLocalDishes(response.data);
      setShowAdvice(true);
    } catch (error) {
      console.error('Submit error:', error);
      alert('Có lỗi xảy ra khi gửi dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra xem món ăn đã có đánh giá chưa
  const isAdviceEvaluated = dish =>
    dish.familySuitabilityLevel || 
    (dish.userSuitability && dish.userSuitability.length > 0);

  // Kiểm tra có nên hiển thị nút submit không
  const shouldShowSubmitButton = () =>
    localDishes.some(dish => !isAdviceEvaluated(dish));

  // Kiểm tra có món nào đã có đánh giá không để tự động hiển thị
  const hasExistingAdvice = localDishes.some(dish => isAdviceEvaluated(dish));

  // Tự động hiển thị advice nếu có dữ liệu đánh giá
  React.useEffect(() => {
    if (hasExistingAdvice && !showAdvice) {
      setShowAdvice(true);
    }
  }, [hasExistingAdvice, showAdvice]);

  if (!localDishes || localDishes.length === 0) {
    return (
      <div style={styles.container}>
        <p>Không có dữ liệu món ăn.</p>
        <button onClick={onBack} style={styles.backButton}>
          ← Quay lại
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🍽️ Danh Sách Món Ăn</h2>
        <p style={styles.subtitle}>Tổng cộng: {localDishes.length} món</p>
        <button onClick={onBack} style={styles.backButton}>← Quay lại</button>
      </div>

      {/* Thanh chọn thành viên */}
      {shouldShowSubmitButton() && userProfiles.length > 0 && (
        <MemberSelector
          userProfiles={userProfiles}
          selectedMembers={selectedMembers}
          onMemberChange={setSelectedMembers}
        />
      )}

      <div style={styles.ingredientsList}>
        {localDishes.map((dish, index) => (
          <DishCard key={dish.dishAdviceId || index} dish={dish} showAdvice={showAdvice} />
        ))}
      </div>

      {shouldShowSubmitButton() && (
        <div style={styles.submitContainer}>
          <button
            onClick={handleSubmit}
            disabled={loading || selectedMembers.length === 0}
            style={{
              ...styles.submitButton,
              ...(loading || selectedMembers.length === 0 ? styles.disabledButton : {})
            }}
          >
            {loading ? (
              <>
                <span style={styles.spinner}></span> Đang xử lý...
              </>
            ) : (
              '⭐ Đánh giá theo từng thành viên'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

// Helper functions
const getSuitabilityColor = (level) => {
  switch (level?.toUpperCase()) {
    case 'HIGH': return '#4CAF50';
    case 'MEDIUM': return '#FF9800';
    case 'LOW': return '#F44336';
    default: return '#9E9E9E';
  }
};

const getScoreColor = (score) => {
  if (score >= 8) return '#4CAF50';
  if (score >= 6) return '#FF9800';
  if (score >= 4) return '#FF5722';
  return '#F44336';
};

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  title: {
    color: '#2c3e50',
    fontSize: '28px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  subtitle: {
    color: '#7f8c8d',
    fontSize: '16px',
    marginBottom: '20px'
  },
  backButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.3s ease'
  },
  ingredientsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  ingredientCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    border: '1px solid #e9ecef',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  },
  ingredientInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  ingredientName: {
    color: '#2c3e50',
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '10px',
    borderBottom: '2px solid #3498db',
    paddingBottom: '8px'
  },
  reasonSection: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #e9ecef'
  },
  cookingMethodSection: {
    backgroundColor: '#fff3cd',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ffeaa7'
  },
  urlSection: {
    backgroundColor: '#e3f2fd',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #bbdefb'
  },
  urlLink: {
    color: '#1976d2',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s ease'
  },
  adviceSection: {
    backgroundColor: '#f1f8e9',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #c8e6c9'
  },
  suitabilityBadge: {
    color: 'white',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  userAdviceItem: {
    backgroundColor: 'white',
    padding: '12px',
    marginBottom: '8px',
    borderRadius: '8px',
    border: '1px solid #e0e0e0'
  },
  userAdviceHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '4px'
  },
  scoreBadge: {
    color: 'white',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  userAdviceContent: {
    fontSize: '14px',
    color: '#555'
  },
  suitabilityText: {
    fontWeight: '500',
    color: '#2c3e50'
  },
  noteText: {
    color: '#7f8c8d',
    fontStyle: 'italic'
  },
  submitContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '30px'
  },
  submitButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '15px 30px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  disabledButton: {
    backgroundColor: '#6c757d',
    cursor: 'not-allowed',
    opacity: '0.7'
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #ffffff',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  memberSelector: {
    backgroundColor: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e9ecef'
  },
  
  memberSelectorTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#333'
  },
  
  memberList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '15px'
  },
  
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px',
    backgroundColor: 'white',
    borderRadius: '5px',
    border: '1px solid #ddd',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  
  memberCheckbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer'
  },
  
  memberName: {
    fontWeight: '500',
    color: '#333'
  },
  
  memberAge: {
    color: '#666',
    fontSize: '14px'
  },
  
  memberCount: {
    margin: '0',
    fontSize: '14px',
    color: '#666',
    fontStyle: 'italic'
  }
};

// CSS animation cho spinner
const spinKeyframes = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Thêm keyframes vào head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = spinKeyframes;
  document.head.appendChild(style);
}

export default DishDisplayComponent;