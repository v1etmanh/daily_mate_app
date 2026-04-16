# F07 — Push Notification (Thông báo smartphone)

## Bối cảnh

App nhắc người dùng đúng lúc họ cần nghĩ đến bữa ăn, dựa trên thời gian và
trạng thái thời tiết đang thay đổi (ví dụ: trưa nắng nóng → nhắc chọn món mát).

---

## Loại notification

| Loại | Trigger | Nội dung mẫu |
|---|---|---|
| **Meal reminder** | 11:30 sáng / 17:30 chiều | "🍜 Gần đến giờ ăn trưa! Hôm nay nắng 35°C — xem gợi ý món mát nhé." |
| **Weather change** | Nhiệt độ thay đổi > 5°C so với sáng | "🌧️ Trời bắt đầu mưa — canh nóng hôm nay nghe có vẻ ngon đấy!" |
| **Challenge reminder** | 9:00 sáng | "🏆 Thử thách hôm nay: Cá kho tộ. Bạn đã sẵn sàng chưa?" |
| **Streak reminder** | Nếu 20:00 chưa check-in | "🔥 Đừng để chuỗi 3 ngày bị đứt nhé! Hôm nay bạn đã nấu gì?" |

---

## Tech: Expo Notifications

Package: `expo-notifications` (đã có trong Expo, cần install nếu chưa có)

```bash
npx expo install expo-notifications
```

**Permission request** (OnboardingWelcome hoặc lần đầu mở Settings):
```js
import * as Notifications from 'expo-notifications';

async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  await AsyncStorage.setItem('notification_permission', status);
}
```

---

## Scheduled Notifications (local, không cần server)

```js
// Đặt lịch meal reminder mỗi ngày lúc 11:30
await Notifications.scheduleNotificationAsync({
  content: {
    title: "🍜 Gần đến giờ ăn trưa!",
    body: "Xem gợi ý món hôm nay nhé.",
    data: { screen: 'Home' },
  },
  trigger: {
    hour: 11,
    minute: 30,
    repeats: true,
  },
});
```

---

## Weather-triggered Notifications (cần background fetch)

Dùng `expo-background-fetch` + `expo-task-manager`:
1. Đăng ký background task check thời tiết mỗi 30-60 phút
2. So sánh với snapshot thời tiết buổi sáng
3. Nếu thay đổi lớn → trigger notification

**Lưu ý**: Background fetch trên iOS bị giới hạn bởi OS — không guaranteed chạy đúng giờ.
→ Chỉ implement meal reminder (scheduled) trước, weather-trigger là optional enhancement.

---

## Settings UI

```
THÔNG BÁO
  Nhắc nhở bữa ăn      [Bật ●]
  Giờ nhắc sáng        [07:00 ▼]
  Giờ nhắc trưa        [11:30 ▼]
  Giờ nhắc chiều       [17:30 ▼]
  Thử thách hàng ngày  [Bật ●]
```

Lưu vào `settings_kv`: `notif_meal_enabled`, `notif_meal_times`, `notif_challenge_enabled`

---

## File cần tạo/sửa

| File | Thay đổi |
|---|---|
| `mobile_app/screens/SettingsScreen.js` | Thêm Notification section |
| `mobile_app/screens/onboarding/OnboardingWelcome.js` | Request permission lần đầu |
| `mobile_app/utils/notifications.js` | Tạo mới — helper schedule/cancel |
| `mobile_app/App.js` | Setup notification handler + deep link |

---

## Test cases

- User bật nhắc → nhận notification lúc 11:30
- User tắt nhắc → không nhận
- Tap notification → mở HomeScreen
- Challenge notification dẫn → CookingChallengeScreen
