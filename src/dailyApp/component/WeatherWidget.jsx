import React, { useState, useEffect } from 'react';
import { apiclient } from '../api/BaseApi';
import { getDish, getDishByDate, getIngredient } from '../api/ApiConnect';
import IngredientSelector from './IngredientSelector';
import DishplayDishs from './DisplaysDishComponent';
import DishRecommender from './DishRecommender';


const WeatherWidget = () => {
  const [location, setLocation] = useState(null);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  // Thay đổi: selectedDate bây giờ là string format YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedDateIndex, setSelectedDateIndex] = useState(0); // Để tracking cho weather API
  const [ingredients, setIngredients] = useState(null);
  const [dishs, setDishs] = useState(null);
  const [currentScreen, setCurrentScreen] = useState('weather');

  // Hàm tạo SQL Date string (YYYY-MM-DD)
  const createSqlDateString = (dayOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date.toISOString().split('T')[0]; // "2025-07-10"
  };

  // Tạo danh sách ngày có thể chọn
  const getDateOptions = () => {
    const today = new Date();
    const options = [];

    for (let i = 0; i <= 2; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);

      const yyyyMMdd = date.toISOString().split('T')[0];

      let label = '';
      if (i === 0) label = 'Hôm nay';
      else if (i === 1) label = 'Ngày mai';
      else if (i === 2) label = 'Ngày kia';

      options.push({
        value: yyyyMMdd,
        index: i, // Thêm index để sử dụng cho weather API
        label: label + ` (${date.toLocaleDateString('vi-VN')})`
      });
    }
    return options;
  };

  // Khởi tạo selectedDate với ngày hôm nay
  useEffect(() => {
    const todayString = createSqlDateString(0);
    setSelectedDate(todayString);
  }, []);

  // Lấy vị trí từ GPS
  const getLocationFromGPS = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ GPS'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: 'Vị trí hiện tại',
            country: 'GPS'
          });
        },
        (error) => {
          let errorMessage = 'Không thể lấy vị trí GPS';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Bạn đã từ chối quyền truy cập vị trí';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Không thể xác định vị trí';
              break;
            case error.TIMEOUT:
              errorMessage = 'Hết thời gian chờ GPS';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 600000
        }
      );
    });
  };

  // Lấy thời tiết hiện tại
  const getCurrentWeather = async (lat, lon) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=251906aeb8ad2c55efaab13f34bcb24a&units=metric&lang=vi`
      );

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Weather data:', data);
      return data;
    } catch (err) {
      console.error('Weather API Error:', err);
      throw new Error('Không thể lấy thông tin thời tiết');
    }
  };

  // Lấy dự báo thời tiết cho ngày được chọn
  const getForecastWeather = async (lat, lon, dayIndex) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=251906aeb8ad2c55efaab13f34bcb24a&units=metric&lang=vi`
      );

      if (!response.ok) {
        throw new Error(`Lỗi API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Forecast data:', data);

      // Tính toán timestamp cho ngày được chọn
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dayIndex);
      targetDate.setHours(12, 0, 0, 0); // Lấy thời tiết lúc 12h trưa

      // Tìm dự báo gần nhất với thời gian mục tiêu
      let closestForecast = data.list[0];
      let minDiff = Math.abs(data.list[0].dt * 1000 - targetDate.getTime());

      for (let forecast of data.list) {
        const diff = Math.abs(forecast.dt * 1000 - targetDate.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          closestForecast = forecast;
        }
      }

      // Chuyển đổi dữ liệu forecast thành format giống current weather
      return {
        name: data.city.name,
        sys: {
          country: data.city.country,
          sunrise: data.city.sunrise,
          sunset: data.city.sunset
        },
        main: closestForecast.main,
        weather: closestForecast.weather,
        wind: closestForecast.wind,
        visibility: closestForecast.visibility,
        clouds: closestForecast.clouds,
        dt: closestForecast.dt
      };
    } catch (err) {
      console.error('Forecast API Error:', err);
      throw new Error('Không thể lấy thông tin dự báo thời tiết');
    }
  };

  // Xử lý Enter
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      fetchWeatherData();
    }
  };

  // Lấy dữ liệu thời tiết
  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);

    try {
      const locationData = await getLocationFromGPS();
      setLocation(locationData);

      let weatherData;

      if (selectedDateIndex === 0) {
        // Hôm nay - dùng current weather API
        weatherData = await getCurrentWeather(locationData.lat, locationData.lon);
      } else {
        // Ngày mai hoặc ngày kia - dùng forecast API
        weatherData = await getForecastWeather(locationData.lat, locationData.lon, selectedDateIndex);
      }

      setWeather(weatherData);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsReady(true);
    // Chỉ gọi fetchWeatherData khi đã có selectedDate
    if (selectedDate) {
      fetchWeatherData();
    }
    document.addEventListener('keypress', handleKeyPress);
    return () => document.removeEventListener('keypress', handleKeyPress);
  }, [selectedDate, selectedDateIndex]);

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp * 1000).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

const defineIngredient = async () => {
  if (!weather || !location) return;
  
  try {
    setLoading(true);
    
    // Bước 1: Kiểm tra xem đã có món ăn cho ngày này chưa (ưu tiên cao nhất)
    const dishByDateResponse = await getDishByDate(selectedDate);
    console.log(dishByDateResponse.data)
    
    // Bước 2: Nếu có dish, chuyển thẳng sang DisplayDish (bỏ qua ingredients)
    if (dishByDateResponse.data && dishByDateResponse.data.length > 0) {
      setDishs(dishByDateResponse.data);
      setCurrentScreen('dishs');
      return;
    }
    
    // Bước 3: Nếu chưa có dish, mới check localStorage cho ingredients
    if(localStorage.getItem(`${selectedDate.toString()}_ingredients`)){
      setIngredients(JSON.parse(localStorage.getItem(`${selectedDate.toString()}_ingredients`)));
      setCurrentScreen('ingredients');
      return;
    }
    
    // Bước 4: Nếu cả dish và ingredients đều chưa có, tạo mới ingredients
    const weatherCondition = {
      main: weather.weather[0].main,
      temperature: weather.main.temp,
      fellingTemp: weather.main.feels_like,
      humidity: weather.main.humidity,
      pressure: weather.main.pressure
    };

    const locationDto = {
      lat: location.lat,
      lon: location.lon,
      city: weather.name,
      country: weather.sys?.country
    };

    const fullRequest = {
      weather: weatherCondition,
      location: locationDto,
      specificDate: selectedDate
    };

    const response = await getIngredient(fullRequest);
    localStorage.setItem(`${selectedDate.toString()}_ingredients`, JSON.stringify(response.data))
    setIngredients(response.data);
    setCurrentScreen('ingredients');
    
  } catch (err) {
    console.error('Define ingredient error:', err);
    setError('Không thể định nghĩa nguyên liệu: ' + err.message);
  } finally {
    setLoading(false);
  }
};

//defineByuser


  // Hàm xử lý submit ingredients
  const handleSubmitIngredients = async (selectedIngredients) => {
    if(localStorage.getItem(`${selectedDate.toString()}_dishs`)){
  setDishs(JSON.parse(localStorage.getItem(`${selectedDate.toString()}_dishs`)));
  setCurrentScreen('dishs');
  return;
}
    try {
      const weatherCondition = {
        main: weather.weather[0].main,
        temperature: weather.main.temp,
        fellingTemp: weather.main.feels_like,
        humidity: weather.main.humidity,
        pressure: weather.main.pressure
      };

      const locationDto = {
        lat: location.lat,
        lon: location.lon,
        city: weather.name,
        country: weather.sys?.country
      };

      const DishFormRequest = {
        weather: weatherCondition,
        location: locationDto,
        ingredients: selectedIngredients,
        specificDate: selectedDate // Thêm specificDate vào request
      };
      
      const response = await getDish(DishFormRequest);
      localStorage.setItem(`${selectedDate.toString()}_dishs`,JSON.stringify(response.data))
      setDishs(response.data);
      console.log(response.data);
      setCurrentScreen('dishs');
      alert('Gửi thành công!');
    } catch (error) {
      console.error('Submit error:', error);
      setError('Không thể lấy món ăn: ' + error.message);
    }
  };

  const handleBackToIngredients = () => {
    setDishs(null);
    setCurrentScreen('ingredients');
  };

  const handleBackToWeather = () => {
    setIngredients(null);
    setCurrentScreen('weather');
  };

  // Xử lý thay đổi ngày
  const handleDateChange = (dateString) => {
    setSelectedDate(dateString);
    const dateOptions = getDateOptions();
    const selectedOption = dateOptions.find(opt => opt.value === dateString);
    if (selectedOption) {
      setSelectedDateIndex(selectedOption.index);
    }
  };

  const dateOptions = getDateOptions();
 if(currentScreen=='dishForU'){
   const weatherCondition = {
        main: weather.weather[0].main,
        temperature: weather.main.temp,
        fellingTemp: weather.main.feels_like,
        humidity: weather.main.humidity,
        pressure: weather.main.pressure
      };

      const locationDto = {
        lat: location.lat,
        lon: location.lon,
        city: weather.name,
        country: weather.sys?.country
      };

      
  return <DishRecommender weather={weatherCondition} location={location} createDate={selectedDate}
                          
  ></DishRecommender>
 }
  // Logic hiển thị các component dựa trên currentScreen
  if (currentScreen === 'ingredients' && ingredients) {
    return (
      <IngredientSelector
        ingredients={ingredients}
        onSubmit={handleSubmitIngredients}
        onBack={handleBackToWeather}
      />
    );
  } else if (currentScreen === 'dishs' && dishs) {
    return (
      <DishplayDishs
        onBack={handleBackToIngredients}
        dishs={dishs}
        date={selectedDate} // Truyền SQL Date string
      />
    );
  }

  // Mặc định hiển thị WeatherWidget
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🌤️ Thời Tiết GPS</h2>
        <p style={styles.instruction}>
          {isReady ? '👆 Chọn ngày và nhấn Enter hoặc click để lấy thời tiết' : 'Đang khởi tạo...'}
        </p>

        {/* Bộ chọn ngày */}
        <div style={styles.dateSelector}>
          <label style={styles.dateLabel}>📅 Chọn ngày:</label>
          <select
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            style={styles.dateSelect}
          >
            {dateOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <button onClick={fetchWeatherData} style={styles.actionButton}>
          📍 Lấy thời tiết từ GPS
        </button>

        {weather && (
          <button onClick={defineIngredient} style={styles.actionButton}>
            🍽️ Định nghĩa nguyên liệu cho cả gia đình
          </button>
        )} {weather && (
          <button onClick={()=>{
            setCurrentScreen("dishForU")
          }} style={styles.actionButton}>
            🍽️ Định nghĩa tim kiếm món ăn theo từng thành viên
          </button>
        )}
      </div>

      {loading && (
        <div style={styles.loading}>
          <div style={styles.spinner}></div>
          <p>Đang lấy vị trí GPS và thời tiết...</p>
        </div>
      )}

      {error && (
        <div style={styles.error}>
          <p>❌ {error}</p>
          <button onClick={fetchWeatherData} style={styles.retryButton}>
            🔄 Thử lại
          </button>
        </div>
      )}

      {weather && !loading && (
        <div style={styles.weatherCard}>
          <div style={styles.locationInfo}>
            <h3>📍 {weather.name || 'Không xác định'}, {weather.sys?.country || 'N/A'}</h3>
            <p>Tọa độ: {location?.lat?.toFixed(4) || 'N/A'}, {location?.lon?.toFixed(4) || 'N/A'}</p>
            <p style={styles.selectedDateInfo}>
              📅 {dateOptions.find(opt => opt.value === selectedDate)?.label}
            </p>
          </div>

          <div style={styles.weatherInfo}>
            <div style={styles.mainWeather}>
              {weather.weather?.[0]?.icon && (
                <img
                  src={`https://openweathermap.org/img/wn/${weather.weather[0].icon}@2x.png`}
                  alt={weather.weather[0].description || 'Weather icon'}
                  style={styles.weatherIcon}
                />
              )}
              <div>
                <h2 style={styles.temperature}>
                  {weather.main?.temp ? Math.round(weather.main.temp) : 'N/A'}°C
                </h2>
                <p style={styles.description}>
                  {weather.weather?.[0]?.description || 'Không có thông tin'}
                </p>
              </div>
            </div>

            <div style={styles.details}>
              <div style={styles.detailItem}>
                <span>🌡️ Cảm giác như:</span>
                <span>{weather.main?.feels_like ? Math.round(weather.main.feels_like) : 'N/A'}°C</span>
              </div>
              <div style={styles.detailItem}>
                <span>🔥 Nhiệt độ cao:</span>
                <span>{weather.main?.temp_max ? Math.round(weather.main.temp_max) : 'N/A'}°C</span>
              </div>
              <div style={styles.detailItem}>
                <span>❄️ Nhiệt độ thấp:</span>
                <span>{weather.main?.temp_min ? Math.round(weather.main.temp_min) : 'N/A'}°C</span>
              </div>
              <div style={styles.detailItem}>
                <span>💧 Độ ẩm:</span>
                <span>{weather.main?.humidity || 'N/A'}%</span>
              </div>
              <div style={styles.detailItem}>
                <span>🔽 Áp suất:</span>
                <span>{weather.main?.pressure || 'N/A'} hPa</span>
              </div>
              {weather.wind?.speed && (
                <div style={styles.detailItem}>
                  <span>💨 Tốc độ gió:</span>
                  <span>{weather.wind.speed} m/s</span>
                </div>
              )}
              {weather.wind?.deg && (
                <div style={styles.detailItem}>
                  <span>🧭 Hướng gió:</span>
                  <span>{weather.wind.deg}°</span>
                </div>
              )}
              {weather.visibility && (
                <div style={styles.detailItem}>
                  <span>👁️ Tầm nhìn:</span>
                  <span>{(weather.visibility / 1000).toFixed(1)} km</span>
                </div>
              )}
              {weather.clouds?.all && (
                <div style={styles.detailItem}>
                  <span>☁️ Mây che:</span>
                  <span>{weather.clouds.all}%</span>
                </div>
              )}
              <div style={styles.detailItem}>
                <span>🌅 Mặt trời mọc:</span>
                <span>{formatTime(weather.sys?.sunrise)}</span>
              </div>
              <div style={styles.detailItem}>
                <span>🌇 Mặt trời lặn:</span>
                <span>{formatTime(weather.sys?.sunset)}</span>
              </div>
            </div>
          </div>

          <div style={styles.updateTime}>
            <small>Cập nhật lúc: {new Date().toLocaleString('vi-VN')}</small>
            {weather.dt && (
              <small> • Dữ liệu từ: {new Date(weather.dt * 1000).toLocaleString('vi-VN')}</small>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default WeatherWidget;

  const styles = {
    container: {
      maxWidth: '800px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh'
    },
    header: {
      textAlign: 'center',
      marginBottom: '30px',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '15px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0'
    },
    title: {
      color: '#2c3e50',
      fontSize: '28px',
      margin: '0 0 10px 0',
      fontWeight: 'bold',
      textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
    },
    instruction: {
      color: '#7f8c8d',
      fontSize: '16px',
      margin: '0 0 20px 0',
      fontStyle: 'italic'
    },
    dateSelector: {
      marginBottom: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      flexWrap: 'wrap'
    },
    dateLabel: {
      fontSize: '16px',
      fontWeight: 'bold',
      color: '#34495e'
    },
    dateSelect: {
      padding: '10px 15px',
      fontSize: '16px',
      border: '2px solid #3498db',
      borderRadius: '8px',
      backgroundColor: 'white',
      color: '#2c3e50',
      cursor: 'pointer',
      outline: 'none',
      transition: 'all 0.3s ease',
      minWidth: '250px'
    },
    actionButton: {
      backgroundColor: '#3498db',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      fontSize: '16px',
      borderRadius: '8px',
      cursor: 'pointer',
      margin: '5px',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
      fontWeight: 'bold'
    },
    loading: {
      textAlign: 'center',
      padding: '40px',
      backgroundColor: 'white',
      borderRadius: '15px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
      margin: '20px 0'
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '4px solid #f3f3f3',
      borderTop: '4px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
      margin: '0 auto 20px auto'
    },
    error: {
      backgroundColor: '#e74c3c',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      textAlign: 'center',
      margin: '20px 0',
      boxShadow: '0 2px 10px rgba(231,76,60,0.3)'
    },
    retryButton: {
      backgroundColor: 'white',
      color: '#e74c3c',
      border: '2px solid white',
      padding: '8px 16px',
      borderRadius: '5px',
      cursor: 'pointer',
      marginTop: '10px',
      fontWeight: 'bold'
    },
    weatherCard: {
      backgroundColor: 'white',
      borderRadius: '20px',
      padding: '30px',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
      border: '1px solid #e0e0e0',
      margin: '20px 0'
    },
    locationInfo: {
      textAlign: 'center',
      marginBottom: '30px',
      paddingBottom: '20px',
      borderBottom: '2px solid #ecf0f1'
    },
    selectedDateInfo: {
      fontSize: '18px',
      color: '#3498db',
      fontWeight: 'bold',
      margin: '10px 0'
    },
    weatherInfo: {
      marginBottom: '20px'
    },
    mainWeather: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: '30px',
      gap: '20px',
      flexWrap: 'wrap'
    },
    weatherIcon: {
      width: '100px',
      height: '100px',
      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
    },
    temperature: {
      fontSize: '48px',
      margin: '0',
      color: '#e74c3c',
      fontWeight: 'bold',
      textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
    },
    description: {
      fontSize: '18px',
      color: '#7f8c8d',
      margin: '5px 0',
      textTransform: 'capitalize',
      fontStyle: 'italic'
    },
    details: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
      gap: '15px',
      backgroundColor: '#f8f9fa',
      padding: '20px',
      borderRadius: '12px',
      border: '1px solid #e9ecef'
    },
    detailItem: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid #dee2e6',
      fontSize: '16px'
    },
    updateTime: {
      textAlign: 'center',
      color: '#95a5a6',
      fontSize: '14px',
      marginTop: '20px',
      paddingTop: '15px',
      borderTop: '1px solid #ecf0f1'
    }
  };

  // CSS Animation for spinner
  const spinnerStyle = document.createElement('style');
  spinnerStyle.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .weather-widget select:hover {
      border-color: #2980b9;
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .weather-widget button:hover {
      background-color: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    .weather-widget .retry-button:hover {
      background-color: #c0392b;
      color: white;
    }
    
    @media (max-width: 768px) {
      .weather-widget .container {
        padding: 10px;
      }
      
      .weather-widget .header {
        padding: 15px;
      }
      
      .weather-widget .title {
        fontSize: 24px;
      }
      
      .weather-widget .temperature {
        fontSize: 36px;
      }
      
      .weather-widget .main-weather {
        flex-direction: column;
      }
      
      .weather-widget .details {
        grid-template-columns: 1fr;
      }
      
      .weather-widget .date-selector {
        flex-direction: column;
      }
      
      .weather-widget .date-select {
        min-width: 200px;
      }
    }
  `;