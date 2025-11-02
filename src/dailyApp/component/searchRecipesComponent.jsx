import React, { useState } from 'react';
import './RecipeSearch.css';

const RecipeSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_KEY = '91f52ddddc65407bbc9564b333597e3c';
  const BASE_URL = 'https://api.spoonacular.com/recipes';

  // Tìm kiếm công thức
  const searchRecipes = async () => {
    if (!searchTerm.trim()) {
      setError('Vui lòng nhập tên món ăn');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `${BASE_URL}/complexSearch?query=${encodeURIComponent(searchTerm)}&number=10&apiKey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Không thể tìm kiếm công thức');
      }
      
      const data = await response.json();
      setRecipes(data.results);
    } catch (err) {
      setError('Có lỗi xảy ra khi tìm kiếm: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy chi tiết công thức
  const getRecipeDetails = async (recipeId) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(
        `${BASE_URL}/${recipeId}/information?apiKey=${API_KEY}`
      );
      
      if (!response.ok) {
        throw new Error('Không thể lấy chi tiết công thức');
      }
      
      const data = await response.json();
      setSelectedRecipe(data);
    } catch (err) {
      setError('Có lỗi xảy ra khi lấy chi tiết: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý submit form
  const handleSubmit = (e) => {
    e.preventDefault();
    searchRecipes();
  };

  // Quay lại danh sách
  const goBack = () => {
    setSelectedRecipe(null);
  };

  return (
    <div className="recipe-search-container">
      <h1>Tìm Kiếm Công Thức Nấu Ăn</h1>
      
      {/* Form tìm kiếm */}
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Nhập tên món ăn (ví dụ: phở, pizza, pasta...)"
          className="search-input"
        />
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Đang tìm...' : 'Tìm kiếm'}
        </button>
      </form>

      {/* Hiển thị lỗi */}
      {error && <div className="error-message">{error}</div>}

      {/* Hiển thị chi tiết công thức */}
      {selectedRecipe && (
        <div className="recipe-details">
          <button onClick={goBack} className="back-button">
            ← Quay lại danh sách
          </button>
          
          <div className="recipe-header">
            <h2>{selectedRecipe.title}</h2>
            <img 
              src={selectedRecipe.image} 
              alt={selectedRecipe.title}
              className="recipe-image"
            />
          </div>

          <div className="recipe-info">
            <div className="info-item">
              <strong>Thời gian chuẩn bị:</strong> {selectedRecipe.readyInMinutes} phút
            </div>
            <div className="info-item">
              <strong>Số người ăn:</strong> {selectedRecipe.servings}
            </div>
            {selectedRecipe.pricePerServing && (
              <div className="info-item">
                <strong>Giá per khẩu phần:</strong> ${(selectedRecipe.pricePerServing / 100).toFixed(2)}
              </div>
            )}
          </div>

          {/* Nguyên liệu */}
          {selectedRecipe.extendedIngredients && (
            <div className="ingredients-section">
              <h3>Nguyên liệu:</h3>
              <ul className="ingredients-list">
                {selectedRecipe.extendedIngredients.map((ingredient, index) => (
                  <li key={index}>
                    {ingredient.amount} {ingredient.unit} {ingredient.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hướng dẫn nấu */}
          {selectedRecipe.instructions && (
            <div className="instructions-section">
              <h3>Hướng dẫn nấu:</h3>
              <div 
                className="instructions-content"
                dangerouslySetInnerHTML={{ __html: selectedRecipe.instructions }}
              />
            </div>
          )}

          {/* Thông tin dinh dưỡng */}
          {selectedRecipe.nutrition && (
            <div className="nutrition-section">
              <h3>Thông tin dinh dưỡng:</h3>
              <div className="nutrition-grid">
                {selectedRecipe.nutrition.nutrients.slice(0, 6).map((nutrient, index) => (
                  <div key={index} className="nutrition-item">
                    <strong>{nutrient.name}:</strong> {nutrient.amount}{nutrient.unit}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Danh sách kết quả tìm kiếm */}
      {!selectedRecipe && recipes.length > 0 && (
        <div className="recipes-grid">
          <h2>Kết quả tìm kiếm ({recipes.length} món):</h2>
          <div className="recipes-list">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="recipe-card">
                <img 
                  src={recipe.image} 
                  alt={recipe.title}
                  className="recipe-card-image"
                />
                <h3>{recipe.title}</h3>
                <button 
                  onClick={() => getRecipeDetails(recipe.id)}
                  className="view-recipe-button"
                  disabled={loading}
                >
                  Xem công thức
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RecipeSearch;