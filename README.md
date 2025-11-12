Mô tả ngắn
Ứng dụng web gợi ý thực đơn lành mạnh hàng ngày dựa trên dữ liệu thời tiết (OpenWeather API) và profile sức khỏe gia đình (allergies, preferences, calories). Cá nhân hóa gợi ý, xuất shopping list, lưu công thức.

Stack

Backend: Spring Boot

Frontend: React

Weather API: OpenWeatherMap API

DB: MySQL / Postgres

Authentication: JWT (optional)

Tính năng chính

Thêm profile thành viên gia đình (tuổi, thói quen, dị ứng)

Lấy dự báo thời tiết theo vị trí (OpenWeather)

Gợi ý thực đơn theo thời tiết (ví dụ lạnh → súp nóng), năng lượng cần thiết

Tạo shopping list từ thực đơn

Lưu & chia sẻ công thức

Cài đặt

# backend
git clone https://github.com/USERNAME/dailymate.git
cd dailymate/backend
./mvnw clean package
java -jar target/dailymate-0.0.1-SNAPSHOT.jar

# frontend
cd ../frontend
npm install
npm run start


Biến môi trường (ví dụ)

OPENWEATHER_API_KEY=your_openweather_key
SPRING_DATASOURCE_URL=jdbc:mysql://localhost:3306/dailymate
JWT_SECRET=xxx


Mô tả logic gợi ý (tóm tắt)

Lấy weather → mapping temperature/condition → đề xuất món phù hợp + cân chỉnh calories theo profile

Lưu cài đặt user để cá nhân hóa ngày sau

Deployment

Backend: Docker → deploy (Heroku/GCP/ECS)

Frontend: Vercel/Netlify

Cron job: scheduled tasks (Spring Scheduler) để gửi gợi ý hàng ngày qua email/notification

License & Links

License: MIT

Repo: https://github.com/USERNAME/dailymate
