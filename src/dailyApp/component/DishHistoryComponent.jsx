import React, { useState, useEffect } from 'react';
import './DishCreateList.css';
import { getALlDishCreate, updateDish } from '../api/ApiConnect';

const DishCreateList = () => {
  const [dishCreates, setDishCreates] = useState([]);
  const [selectedDishCreate, setSelectedDishCreate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch danh sách DishCreate
  useEffect(() => {
    fetchDishCreates();
  }, []);

  const fetchDishCreates = async () => {
    try {
      setLoading(true);
      const response = await getALlDishCreate();
      if (response.status!=200) throw new Error('Failed to fetch dish creates');
      const data =  response.data;
      setDishCreates(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý khi click vào một DishCreate
  const handleDishCreateClick = (dishCreate) => {
    setSelectedDishCreate(dishCreate);
    setHasChanges(false);
  };

  // Cập nhật điểm số cho món ăn
  const handleRatingChange = (dishId, rating) => {
    setSelectedDishCreate(prev => ({
      ...prev,
      listDish: prev.listDish.map(dish =>
        dish.dishAdviceId === dishId
          ? { ...dish, markFromUser: rating }
          : dish
      )
    }));
    setHasChanges(true);
  };

  // Cập nhật trạng thái được chọn
  const handleChosenChange = (dishId, isChosen) => {
    setSelectedDishCreate(prev => ({
      ...prev,
      listDish: prev.listDish.map(dish =>
        dish.dishAdviceId === dishId
          ? { ...dish, isChossen: isChosen }
          : dish
      )
    }));
    setHasChanges(true);
  };

  // Cập nhật ghi chú
  const handleNoteChange = (dishId, note) => {
    setSelectedDishCreate(prev => ({
      ...prev,
      listDish: prev.listDish.map(dish =>
        dish.dishAdviceId === dishId
          ? { ...dish, userNote: note }
          : dish
      )
    }));
    setHasChanges(true);
  };

  // Lưu thay đổi
  const handleSaveChanges = async () => {
    try {
      const updatedDishes = selectedDishCreate.listDish.map(dish => ({
        dishAdviceId: dish.dishAdviceId,
        markFromUser: dish.markFromUser || 0,
        isChossen: dish.isChossen || false,
        userNote: dish.userNote || ''
      }));

      const response = await updateDish(updatedDishes)

      if (response.status!=200) throw new Error('Failed to update dishes');
      
      alert('Cập nhật thành công!');
      
      // Cập nhật lại state local
      setDishCreates(prev => 
        prev.map(dc => 
          dc.dishCreateId === selectedDishCreate.dishCreateId 
            ? selectedDishCreate 
            : dc
        )
      );
      setHasChanges(false);
    } catch (err) {
      alert('Lỗi khi cập nhật: ' + err.message);
    }
  };

  // Reset về trạng thái ban đầu
  const handleResetChanges = () => {
    const originalDishCreate = dishCreates.find(dc => dc.dishCreateId === selectedDishCreate.dishCreateId);
    setSelectedDishCreate(originalDishCreate);
    setHasChanges(false);
  };

  // Component render star rating
  const StarRating = ({ rating, onRatingChange, readonly = false }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${readonly ? 'readonly' : ''}`}
            onClick={() => !readonly && onRatingChange(star)}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  // Component hiển thị status của món ăn
  const DishStatus = ({ dish }) => {
    const hasRating = dish.markFromUser && dish.markFromUser > 0;
    const hasNote = dish.userNote && dish.userNote.trim() !== '';
    const isChosen = dish.isChossen;

    return (
      <div className="dish-status">
        {isChosen && (
          <span className="status-badge chosen-badge">
            ✓ Đã chọn
          </span>
        )}
        {hasRating && (
          <span className="status-badge rating-badge">
            ★ {dish.markFromUser}/5
          </span>
        )}
        {hasNote && (
          <span className="status-badge note-badge">
            📝 Có ghi chú
          </span>
        )}
        {!isChosen && !hasRating && !hasNote && (
          <span className="status-badge pending-badge">
            ⏳ Chưa đánh giá
          </span>
        )}
      </div>
    );
  };

  if (loading) return <div className="loading">Đang tải...</div>;
  if (error) return <div className="error">Lỗi: {error}</div>;

  return (
    <div className="dish-create-container">
      {!selectedDishCreate ? (
        // Hiển thị danh sách DishCreate
        <div className="dish-create-list">
          <h2>Danh sách Món Ăn Đã Tạo</h2>
          {dishCreates.length === 0 ? (
            <p>Không có món ăn nào được tạo.</p>
          ) : (
            <div className="dish-create-grid">
              {dishCreates.map((dishCreate) => {
                const chosenCount = dishCreate.listDish?.filter(dish => dish.isChossen).length || 0;
                const ratedCount = dishCreate.listDish?.filter(dish => dish.markFromUser > 0).length || 0;
                const notedCount = dishCreate.listDish?.filter(dish => dish.userNote && dish.userNote.trim() !== '').length || 0;

                return (
                  <div
                    key={dishCreate.dishCreateId}
                    className="dish-create-card"
                    onClick={() => handleDishCreateClick(dishCreate)}
                  >
                    <div className="dish-create-header">
                      <h3>Bộ món ăn #{dishCreate.dishCreateId}</h3>
                      <span className="dish-count">
                        {dishCreate.listDish?.length || 0} món
                      </span>
                    </div>
                    
                    <div className="dish-create-info">
                      <p>Thời gian tạo: {dishCreate.createTime}</p>
                    </div>

                    <div className="dish-create-stats">
                      <div className="stat-item">
                        <span className="stat-icon chosen">✓</span>
                        <span>Đã chọn: {chosenCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon rated">★</span>
                        <span>Đã đánh giá: {ratedCount}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-icon noted">📝</span>
                        <span>Có ghi chú: {notedCount}</span>
                      </div>
                    </div>

                    <div className="dish-create-preview">
                      {dishCreate.listDish?.slice(0, 3).map((dish, index) => (
                        <div key={index} className="dish-preview-item">
                          <span className="dish-name">{dish.name}</span>
                          <DishStatus dish={dish} />
                        </div>
                      ))}
                      {dishCreate.listDish?.length > 3 && (
                        <span className="more-dishes">+{dishCreate.listDish.length - 3} món khác</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        // Hiển thị chi tiết các món ăn
        <div className="dish-details">
          <div className="dish-details-header">
            <button 
              className="back-button"
              onClick={() => setSelectedDishCreate(null)}
            >
              ← Quay lại
            </button>
            <h2>Chi tiết Bộ món ăn #{selectedDishCreate.dishCreateId}</h2>
            <div className="header-actions">
              <span className="create-time">Tạo ngày: {selectedDishCreate.createTime}</span>
              {hasChanges && (
                <button 
                  className="reset-button"
                  onClick={handleResetChanges}
                >
                  Hủy thay đổi
                </button>
              )}
              <button 
                className={`save-button ${hasChanges ? 'has-changes' : ''}`}
                onClick={handleSaveChanges}
                disabled={!hasChanges}
              >
                {hasChanges ? 'Lưu thay đổi' : 'Đã lưu'}
              </button>
            </div>
          </div>

          <div className="dish-summary">
            <div className="summary-stats">
              <div className="summary-item">
                <span className="summary-number">
                  {selectedDishCreate.listDish?.filter(dish => dish.isChossen).length || 0}
                </span>
                <span className="summary-label">Đã chọn</span>
              </div>
              <div className="summary-item">
                <span className="summary-number">
                  {selectedDishCreate.listDish?.filter(dish => dish.markFromUser > 0).length || 0}
                </span>
                <span className="summary-label">Đã đánh giá</span>
              </div>
              <div className="summary-item">
                <span className="summary-number">
                  {selectedDishCreate.listDish?.filter(dish => dish.userNote && dish.userNote.trim() !== '').length || 0}
                </span>
                <span className="summary-label">Có ghi chú</span>
              </div>
              <div className="summary-item">
                <span className="summary-number">
                  {selectedDishCreate.listDish?.reduce((sum, dish) => sum + (dish.markFromUser || 0), 0) / 
                   selectedDishCreate.listDish?.filter(dish => dish.markFromUser > 0).length || 0 || 0}
                </span>
                <span className="summary-label">Điểm TB</span>
              </div>
            </div>
          </div>

          <div className="dish-list">
            {selectedDishCreate.listDish?.map((dish, index) => (
              <div key={dish.dishAdviceId} className={`dish-item ${dish.isChossen ? 'chosen' : ''}`}>
                <div className="dish-main-info">
                  <div className="dish-header">
                    <h3>
                      <span className="dish-number">{index + 1}.</span>
                      {dish.name}
                    </h3>
                    <div className="dish-header-actions">
                      <DishStatus dish={dish} />
                      <label className="chosen-checkbox">
                        <input
                          type="checkbox"
                          checked={dish.isChossen || false}
                          onChange={(e) => handleChosenChange(dish.dishAdviceId, e.target.checked)}
                        />
                        <span>Chọn món này</span>
                      </label>
                    </div>
                  </div>
                  
                  {dish.url && (
                    <div className="dish-image">
                      <a href={dish.url} target="_blank" rel="noopener noreferrer">
                        <img 
                          src={dish.url.includes('youtube') ? `https://img.youtube.com/vi/${dish.url.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg` : dish.url} 
                          alt={dish.name}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="url-link" style={{display: 'none'}}>
                          🔗 Xem công thức
                        </div>
                      </a>
                    </div>
                  )}

                  <div className="dish-info">
                    <div className="info-row">
                      <strong>Lý do gợi ý:</strong>
                      <span>{dish.reason}</span>
                    </div>
                    <div className="info-row">
                      <strong>Cách chế biến:</strong>
                      <span>{dish.cookingMethod}</span>
                    </div>
                    <div className="info-row">
                      <strong>Mức độ phù hợp gia đình:</strong>
                      <span className={`suitability-level ${dish.familySuitabilityLevel?.toLowerCase()}`}>
                        {dish.familySuitabilityLevel}
                      </span>
                    </div>
                    {dish.suggestionNote && (
                      <div className="info-row">
                        <strong>Gợi ý thêm:</strong>
                        <span>{dish.suggestionNote}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="dish-actions">
                  <div className="rating-section">
                    <label>Đánh giá của bạn:</label>
                    <div className="rating-container">
                      <StarRating
                        rating={dish.markFromUser || 0}
                        onRatingChange={(rating) => handleRatingChange(dish.dishAdviceId, rating)}
                      />
                      <span className="rating-text">
                        {dish.markFromUser > 0 ? `${dish.markFromUser}/5` : 'Chưa đánh giá'}
                      </span>
                    </div>
                  </div>

                  <div className="note-section">
                    <label>Ghi chú của bạn:</label>
                    <textarea
                      value={dish.userNote || ''}
                      onChange={(e) => handleNoteChange(dish.dishAdviceId, e.target.value)}
                      placeholder="Nhập ghi chú cho món ăn này..."
                      rows="3"
                    />
                    {dish.userNote && dish.userNote.trim() !== '' && (
                      <div className="note-preview">
                        <strong>Ghi chú hiện tại:</strong>
                        <p>{dish.userNote}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DishCreateList;