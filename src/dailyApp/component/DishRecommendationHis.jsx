import React, { useState, useEffect } from 'react';
import { Star, Edit2, Save, X, Users, ChefHat, Clock, Target, Heart, Utensils } from 'lucide-react';
import { getRecommendationDish, getUser, updateDishRecommendation } from '../api/ApiConnect';
import { useAuth } from '../security/Authentication';

const DishRecommendationManager = () => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingDish, setEditingDish] = useState(null);
  const [tempData, setTempData] = useState({});
  const [updateLoading, setUpdateLoading] = useState(false); // Thêm loading cho update

  
 
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await getUser();
        console.log(response.data)
        const filteredUsers = response.data.filter(user => user.name !== "family");
        setUsers(filteredUsers);

        if (filteredUsers.length > 0) {
          setSelectedUser(filteredUsers[0]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchRecommendations(selectedUser.id);
    }
  }, [selectedUser]);

  const fetchRecommendations = async (userId) => {
    setLoading(true);
    try {
      const response = await getRecommendationDish(userId);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (dish) => {
    setEditingDish(dish.dishRecommendId);
    setTempData({
      isChossen: dish.isChossen,
      userNote: dish.userNote || '',
      markFromUser: dish.markFromUser || 0
    });
  };

  const handleEditCancel = () => {
    setEditingDish(null);
    setTempData({});
  };

  const handleSave = async (dishId) => {
    setUpdateLoading(true);
    try {
      // Tạo request body theo format mới - gửi mảng chứa 1 phần tử
      const updateRequest = [{
        dishID: dishId, // Đổi từ dishRecommendId thành dishID
        markFromUser: tempData.markFromUser,
        isChossen: tempData.isChossen,
        userNote: tempData.userNote
      }];

      await updateDishRecommendation(updateRequest);
      
      // Update local state
      setRecommendations(prev => 
        prev.map(dish => 
          dish.dishRecommendId === dishId 
            ? { ...dish, ...tempData }
            : dish
        )
      );

      setEditingDish(null);
      setTempData({});
    } catch (error) {
      console.error('Error updating recommendation:', error);
      alert('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại!');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Thêm hàm để update nhiều dish cùng lúc (nếu cần)
  const handleBulkUpdate = async (updatedDishes) => {
    setUpdateLoading(true);
    try {
      const updateRequests = updatedDishes.map(dish => ({
        dishID: dish.dishRecommendId,
        markFromUser: dish.markFromUser,
        isChossen: dish.isChossen,
        userNote: dish.userNote
      }));

      await updateDishRecommendation(updateRequests);
      
      // Update local state
      setRecommendations(prev => 
        prev.map(dish => {
          const updatedDish = updatedDishes.find(d => d.dishRecommendId === dish.dishRecommendId);
          return updatedDish ? { ...dish, ...updatedDish } : dish;
        })
      );

      alert('Cập nhật thành công!');
    } catch (error) {
      console.error('Error bulk updating recommendations:', error);
      alert('Có lỗi xảy ra khi cập nhật. Vui lòng thử lại!');
    } finally {
      setUpdateLoading(false);
    }
  };

  const renderStars = (rating, onChange, disabled = false) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 cursor-pointer transition-colors ${
              star <= rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300'
            } ${disabled ? 'cursor-not-allowed' : 'hover:text-yellow-400'}`}
            onClick={disabled ? undefined : () => onChange(star)}
          />
        ))}
      </div>
    );
  };

  const getMealTypeColor = (mealType) => {
    switch (mealType?.toLowerCase()) {
      case 'sáng': return 'bg-orange-100 text-orange-800';
      case 'trưa': return 'bg-blue-100 text-blue-800';
      case 'tối': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
                <ChefHat className="w-10 h-10 text-orange-500" />
                Quản Lý Gợi Ý Món Ăn
              </h1>
              <p className="text-gray-600">Theo dõi và cập nhật đánh giá món ăn của các thành viên</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="w-4 h-4" />
              {users.length} thành viên
            </div>
          </div>
        </div>

        {/* User Selection */}
        <div className="bg-white rounded-3xl shadow-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Chọn Thành Viên
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                  selectedUser?.id === user.id
                    ? 'border-blue-500 bg-blue-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {selectedUser && (
          <div className="bg-white rounded-3xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Utensils className="w-6 h-6 text-green-500" />
                Gợi Ý Món Ăn - {selectedUser.name}
              </h2>
              <button
                onClick={() => fetchRecommendations(selectedUser.id)}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Đang tải...' : 'Tải lại'}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">Đang tải danh sách gợi ý...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {recommendations.map((dish) => (
                  <div key={dish.dishRecommendId} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                    {/* Dish Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-800">{dish.dishName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(dish.mealType)}`}>
                            {dish.mealType}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{dish.description}</p>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Target className="w-4 h-4" />
                            <span>{dish.calories} calo</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{new Date(dish.createDate).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div className={`text-2xl font-bold ${getScoreColor(dish.overallScore)}`}>
                          {dish.overallScore}/10
                        </div>
                        {editingDish === dish.dishRecommendId ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleSave(dish.dishRecommendId)}
                              disabled={updateLoading}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              {updateLoading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent"></div>
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={handleEditCancel}
                              disabled={updateLoading}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditStart(dish)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Ingredients */}
                    <div className="mb-4">
                      <h4 className="font-semibold text-gray-700 mb-2">Nguyên liệu chính:</h4>
                      <div className="flex flex-wrap gap-2">
                        {dish.mainIngredients?.map((ingredient, index) => (
                          <span key={index} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                            {ingredient}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Recommendation Details */}
                    <div className="space-y-3 mb-4">
                      <div className="flex items-start gap-2">
                        <Heart className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700">Sức khỏe: </span>
                          <span className="text-gray-600 text-sm">{dish.healthSuitability}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Target className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="font-medium text-gray-700">Mục tiêu: </span>
                          <span className="text-gray-600 text-sm">{dish.goalAlignment}</span>
                        </div>
                      </div>
                    </div>

                    {/* Editable Fields */}
                    <div className="space-y-4 border-t pt-4">
                      {/* Is Chosen */}
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-700 w-20">Đã chọn:</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={editingDish === dish.dishRecommendId ? tempData.isChossen : dish.isChossen}
                            onChange={(e) => {
                              if (editingDish === dish.dishRecommendId) {
                                setTempData(prev => ({ ...prev, isChossen: e.target.checked }));
                              }
                            }}
                            disabled={editingDish !== dish.dishRecommendId}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">
                            {(editingDish === dish.dishRecommendId ? tempData.isChossen : dish.isChossen) ? 'Đã chọn' : 'Chưa chọn'}
                          </span>
                        </label>
                      </div>

                      {/* User Rating */}
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-gray-700 w-20">Đánh giá:</span>
                        {renderStars(
                          editingDish === dish.dishRecommendId ? tempData.markFromUser : dish.markFromUser,
                          (rating) => {
                            if (editingDish === dish.dishRecommendId) {
                              setTempData(prev => ({ ...prev, markFromUser: rating }));
                            }
                          },
                          editingDish !== dish.dishRecommendId
                        )}
                        <span className="text-sm text-gray-600 ml-2">
                          {editingDish === dish.dishRecommendId ? tempData.markFromUser : dish.markFromUser}/10
                        </span>
                      </div>

                      {/* User Note */}
                      <div className="space-y-2">
                        <span className="font-medium text-gray-700">Ghi chú:</span>
                        <textarea
                          value={editingDish === dish.dishRecommendId ? tempData.userNote : dish.userNote}
                          onChange={(e) => {
                            if (editingDish === dish.dishRecommendId) {
                              setTempData(prev => ({ ...prev, userNote: e.target.value }));
                            }
                          }}
                          disabled={editingDish !== dish.dishRecommendId}
                          placeholder="Thêm ghi chú cá nhân..."
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed text-sm"
                          rows="3"
                        />
                      </div>
                    </div>

                    {/* URL Link */}
                    {dish.url && (
                      <div className="mt-4 pt-3 border-t">
                        
                        <a  href={dish.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                          Xem công thức →
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!loading && recommendations.length === 0 && (
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">Chưa có gợi ý món ăn nào cho thành viên này.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DishRecommendationManager;