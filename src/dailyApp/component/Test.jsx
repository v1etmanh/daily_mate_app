
// src/components/TestTodoCard.jsx
import React from 'react';
import TodoCard from './TodoComponent';

// src/data/mockData.js
export const mockUsers = [
    { userId: 1, userName: 'Nguyễn Văn An' },
    { userId: 2, userName: 'Trần Thị Bình' },
    { userId: 3, userName: 'Lê Minh Châu' },
    { userId: 4, userName: 'Phạm Thị Dung' },
    { userId: 5, userName: 'Hoàng Văn Em' }
];

export const mockTodos = [
    {
        todoId: 1,
        description: 'Chạy bộ buổi sáng trong công viên',
        timeStart: '2025-07-09T06:00:00',
        estimateTime: 1.5,
        beginLocation: 'Nhà riêng - 123 Đường ABC',
        excuteLocation: 'Công viên Tao Đàn',
        userid: 1,
        evaluation: 'Hoạt động rất tốt cho sức khỏe tim mạch. Thời gian buổi sáng lý tưởng cho việc chạy bộ, không khí trong lành. Cường độ phù hợp với thể trạng hiện tại.',
        warning: 'Cần mang theo nước uống và khăn lau mồ hôi. Chú ý khởi động kỹ trước khi chạy.',
        trafficDescription: 'Đường đi thuận lợi, ít xe cộ vào buổi sáng sớm'
    },
    {
        todoId: 2,
        description: 'Đi siêu thị mua sắm thực phẩm',
        timeStart: '2025-07-09T14:30:00',
        estimateTime: 2.0,
        beginLocation: 'Chung cư Vinhomes',
        excuteLocation: 'Siêu thị BigC Thăng Long',
        userid: 2,
        evaluation: 'Thời gian phù hợp, tránh được giờ cao điểm. Siêu thị rộng rãi, thuận tiện cho việc mua sắm gia đình.',
        warning: 'Mang theo túi xách và danh sách mua sắm. Chú ý kiểm tra hạn sử dụng thực phẩm.',
        trafficDescription: 'Giao thông trung bình, có thể hơi đông vào cuối tuần'
    },
    {
        todoId: 3,
        description: 'Học yoga tại studio',
        timeStart: '2025-07-09T18:00:00',
        estimateTime: 1.0,
        beginLocation: 'Văn phòng công ty',
        excuteLocation: 'Yoga Studio Lotus',
        userid: 3,
        evaluation: 'Thời gian tuyệt vời để thư giãn sau ngày làm việc. Yoga giúp giảm stress và tăng cường sức khỏe tinh thần.',
        warning: 'Không nên ăn quá no trước khi tập. Mang theo thảm yoga và nước uống.',
        trafficDescription: null
    },
    {
        todoId: 4,
        description: 'Đi xem phim cùng bạn bè',
        timeStart: '2025-07-10T20:00:00',
        estimateTime: 3.0,
        beginLocation: 'Quận 1',
        excuteLocation: 'Rạp CGV Vincom Center',
        userid: 4,
        evaluation: 'Hoạt động giải trí tuyệt vời để thư giãn. Thời gian chiếu phim phù hợp, không quá muộn.',
        warning: '',
        trafficDescription: 'Khu vực trung tâm, giao thông đông đúc, nên đi sớm'
    },
    {
        todoId: 5,
        description: 'Dọn dẹp nhà cửa cuối tuần',
        timeStart: '2025-07-12T08:00:00',
        estimateTime: 4.0,
        beginLocation: 'Nhà riêng',
        excuteLocation: 'Nhà riêng',
        userid: 5,
        evaluation: null,
        warning: null,
        trafficDescription: null
    }
];
const TestTodoCard = () => {
    return (
        <div style={{ padding: '20px', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <h1>Test TodoCard Components</h1>
            
            <div style={{ 
                display: 'grid', 
                gap: '20px', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                marginTop: '20px'
            }}>
                {mockTodos.map(todo => (
                    <TodoCard 
                        key={todo.todoId} 
                        todo={todo} 
                        users={mockUsers} 
                    />
                ))}
            </div>
            
            {/* Test edge case */}
            <div style={{ marginTop: '40px' }}>
                <h2>Edge Cases:</h2>
                <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
                    {/* Todo null */}
                    <TodoCard todo={null} users={mockUsers} />
                    
                    {/* Todo with missing user */}
                    <TodoCard 
                        todo={{
                            todoId: 999,
                            description: 'Test với user không tồn tại',
                            timeStart: '2025-07-09T10:00:00',
                            estimateTime: 1.0,
                            beginLocation: 'Test location',
                            excuteLocation: 'Test execute',
                            userid: 999, // User không tồn tại
                            evaluation: 'Test evaluation',
                            warning: 'Test warning',
                            trafficDescription: 'Test traffic'
                        }} 
                        users={mockUsers} 
                    />
                </div>
            </div>
        </div>
    );
};

export default TestTodoCard;