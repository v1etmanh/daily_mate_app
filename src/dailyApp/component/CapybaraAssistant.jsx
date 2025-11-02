// CapybaraAssistant.jsx
import { useState, useEffect } from 'react';

export default function CapybaraAssistant() {
  const tips = [
    "Đã uống nước chưa hôm nay?",
    "Stretch nhẹ cho đỡ mỏi nào!",
    "Đừng quên kiểm tra lịch trình nhé!",
    "Hãy nghỉ ngơi một chút nha!",
    "Cố lên! Mọi thứ rồi sẽ ổn thôi!",
    "Bạn đang làm rất tốt đấy!",
    "Hít thở sâu và thư giãn chút nào.",
    "Nhìn xa 20 giây để bảo vệ mắt nha!",
    "Tạo thêm một thói quen tốt hôm nay nhé!",
    "Chỉ 1 bước nhỏ mỗi ngày, bạn sẽ đi rất xa!",
    "Hãy cười một cái! 😄",
    "Dọn dẹp góc làm việc một tí nhỉ?",
    "Gửi lời cảm ơn đến ai đó hôm nay!",
    "Bạn đã check to-do list chưa?",
    "Thử đặt mục tiêu nhỏ trong 10 phút tới nhé!",
    "Ghi chú lại một điều khiến bạn vui hôm nay.",
    "Bạn xứng đáng được nghỉ ngơi!",
    "Đừng quên ăn đầy đủ và đủ chất!",
    "Nghe một bản nhạc nhẹ nhàng thử xem?",
    "Mọi sai lầm là cơ hội để học hỏi!",
    "Nếu mệt, hãy tạm dừng và hít thở sâu...",
    "Một cốc nước sẽ giúp bạn tỉnh táo hơn!",
    "Bạn có thể thử viết nhật ký cảm xúc.",
    "Hôm nay bạn đã làm được điều gì tốt?",
    "Tắt thông báo không cần thiết để tập trung hơn.",
    "Bạn có thể tắt điện thoại 30 phút thử không?",
    "Đi dạo 5 phút cũng là cách nạp năng lượng đó!",
    "Thử làm điều gì đó sáng tạo hôm nay nhé!",
    "Đừng để những việc nhỏ tích tụ thành stress.",
    "Nhớ ngủ sớm tối nay nha!",
    "Chỉ cần tiến 1%, là đủ rồi!",
    "Bạn đang đi đúng hướng rồi đấy!",
    "Tự thưởng một món nhỏ nếu hoàn thành việc nhé!",
    "Thử thiền 2 phút thử xem?",
    "Thư giãn mắt với bài tập 20-20-20 nhé!",
    "Viết 3 điều bạn biết ơn hôm nay đi!",
    "Nạp vitamin D từ ánh nắng chút nhé!",
    "Bạn có thể làm được. Mình tin bạn!",
    "Tắt tab không cần thiết nào~",
    "Còn việc nào bạn đang trì hoãn không?",
    "Hôm nay là cơ hội tuyệt vời để bắt đầu lại.",
    "Nói lời tích cực với bản thân nào.",
    "Việc khó → chia nhỏ để dễ xử lý hơn!",
    "Chọn một việc và làm ngay đi!",
    "Bạn đã đứng dậy vươn vai chưa đó?",
    "Lập kế hoạch nhỏ cho chiều nay thử xem.",
    "Tránh xa mạng xã hội một chút nha!",
    "Uống nước = giúp não bạn hoạt động tốt hơn!",
    "Đừng quá khắt khe với bản thân nhé!",
    "Thư giãn rồi mình làm tiếp nhé 🐹"
  ];

  const [showTip, setShowTip] = useState(false);
  const [tip, setTip] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setTip(randomTip);
      setShowTip(true);
      setTimeout(() => setShowTip(false), 5000);
    }, 15000); // mỗi 15s hiện tip mới

    return () => clearInterval(interval);
  }, []);

  return (
  <div className="fixed bottom-4 right-4 z-50 flex flex-col items-center gap-2">
    {showTip && (
      <div className="bg-white text-gray-800 px-4 py-2 rounded-xl shadow-xl text-sm max-w-xs animate-fade-in">
        <span className="block">{tip}</span>
      </div>
    )}

    <img
      src="/1.png"
      alt="Capybara Assistant"
      className="w-40 h-40 cursor-pointer transition-transform hover:scale-105"
      onClick={() => {
        const randomTip = tips[Math.floor(Math.random() * tips.length)];
        setTip(randomTip);
        setShowTip(true);
      }}
    />
  </div>
);
}
