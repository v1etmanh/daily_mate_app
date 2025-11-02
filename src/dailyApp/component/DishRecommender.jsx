import { useEffect, useState } from "react";
import axios from "axios";
import { dishforU, getALlUser } from "../api/ApiConnect";

export default function DishRecommender({ weather, location, createDate }) {
  const [userProfiles, setUserProfiles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [mealType, setMealType] = useState("");
  const [numberOfDishes, setNumberOfDishes] = useState(1);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
     
        const response = await getALlUser();
       
        setUserProfiles(response.data);
        if (response.data.length > 0) {
          setSelectedUser(response.data[0]);
        }
      
    };

    fetchUsers();
  }, []);

  const handleUserChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === "") {
      setSelectedUser(null);
      return;
    }
    
    const user = userProfiles.find(u => u.id == selectedId);
    setSelectedUser(user);
  };

  const handleSubmit = async () => {
    if (!selectedUser || !mealType || numberOfDishes < 1) {
      alert("Vui lòng chọn user và nhập đủ thông tin!");
      return;
    }

    setLoading(true);
    const body = {
      location,
      weather,
      createDate,
      user: selectedUser,
      mealType,
      numberOfDishes
    };

    try {
      const res = await dishforU(body);
      setRecommendations(res.data);
    } catch (err) {
      console.error(err);
      alert("Lỗi khi gửi request");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return "text-green-600 bg-green-100";
    if (score >= 6) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🍽️ Dish Recommender</h1>
          <p className="text-gray-600">Gợi ý món ăn phù hợp với bạn</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800 mb-6">Thông tin đặt hàng</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Chọn người dùng
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={selectedUser ? selectedUser.id : ""}
                  onChange={handleUserChange}
                >
                  <option value="">-- Chọn người dùng --</option>
                  {userProfiles.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name || `User ${user.id}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  🍽️ Loại bữa ăn
                </label>
                 <select
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
              >
                <option value="">-- Chọn bữa ăn --</option>
                <option value="breakfast">🌅 Buổi sáng</option>
                <option value="lunch">☀️ Buổi trưa</option>
                <option value="dinner">🌙 Buổi tối</option>
              </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  📊 Số lượng món ăn
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  value={numberOfDishes}
                  onChange={(e) => setNumberOfDishes(Number(e.target.value))}
                />
              </div>

              <button
                className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "🔄 Đang tìm kiếm..." : "🔍 Gợi ý món ăn"}
              </button>
            </div>

            {/* User Info Section */}
            {selectedUser && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">👤 Thông tin người dùng</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">📝</span>
                    <div>
                      <p className="text-sm text-gray-600">Tên</p>
                      <p className="font-semibold">{selectedUser.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">🎂</span>
                    <div>
                      <p className="text-sm text-gray-600">Tuổi</p>
                      <p className="font-semibold">{selectedUser.age}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">⚖️</span>
                    <div>
                      <p className="text-sm text-gray-600">BMI</p>
                      <p className="font-semibold">{selectedUser.bmi} ({selectedUser.bmiCategory})</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">👅</span>
                    <div>
                      <p className="text-sm text-gray-600">Khẩu vị</p>
                      <p className="font-semibold">{selectedUser.tastePreference}</p>
                    </div>
                  </div>
                  {selectedUser.allergies && (
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🚫</span>
                      <div>
                        <p className="text-sm text-gray-600">Dị ứng</p>
                        <p className="font-semibold text-red-600">{selectedUser.allergies}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations Section */}
        {recommendations.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-800 text-center mb-8">
              🍽️ Kết quả gợi ý món ăn
            </h2>
            <div className="grid gap-6">
              {recommendations.map((dish, index) => (
                <div key={dish.dishRecommendId || index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">{dish.dishName}</h3>
                        <p className="text-gray-600 leading-relaxed">{dish.description}</p>
                      </div>
                      <div className={`px-4 py-2 rounded-full font-bold text-sm ${getScoreColor(dish.overallScore)}`}>
                        ⭐ {dish.overallScore}/10
                      </div>
                    </div>

                    {/* Main Info Grid */}
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">🥘</span>
                          <div>
                            <p className="font-semibold text-gray-700">Nguyên liệu chính</p>
                            <p className="text-gray-600">{dish.mainIngredients?.join(", ") || "Không có thông tin"}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">🔥</span>
                          <div>
                            <p className="font-semibold text-gray-700">Calo</p>
                            <p className="text-gray-600">{dish.calories} kcal/phần</p>
                          </div>
                        </div>
                        {dish.url && (
                          <div className="flex items-start space-x-3">
                            <span className="text-xl">🔗</span>
                            <div>
                              <p className="font-semibold text-gray-700">Công thức</p>
                              <a href={dish.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                Xem chi tiết
                              </a>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">💚</span>
                          <div>
                            <p className="font-semibold text-gray-700">Phù hợp sức khỏe</p>
                            <p className="text-gray-600">{dish.healthSuitability}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">🎯</span>
                          <div>
                            <p className="font-semibold text-gray-700">Phù hợp mục tiêu</p>
                            <p className="text-gray-600">{dish.goalAlignment}</p>
                          </div>
                        </div>
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">😋</span>
                          <div>
                            <p className="font-semibold text-gray-700">Khẩu vị</p>
                            <p className="text-gray-600">{dish.tasteMatch}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Recommendation Note */}
                    {dish.recommendationNote && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border-l-4 border-blue-400">
                        <div className="flex items-start space-x-3">
                          <span className="text-xl">💡</span>
                          <div>
                            <p className="font-semibold text-gray-700 mb-1">Lý do gợi ý</p>
                            <p className="text-gray-600 leading-relaxed">{dish.recommendationNote}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && recommendations.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🍽️</div>
            <p className="text-gray-500 text-lg">Chưa có gợi ý món ăn nào. Hãy chọn thông tin và bấm "Gợi ý món ăn"!</p>
          </div>
        )}
      </div>
    </div>
  );
}