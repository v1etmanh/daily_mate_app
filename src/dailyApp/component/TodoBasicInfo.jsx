// src/components/TodoBasicInfo.jsx
import React from 'react';
import { Calendar, Clock, MapPin, User } from 'lucide-react';

const TodoBasicInfo = ({ basicInfo }) => {
    
    const infoItems = [
        { icon: Calendar, label: 'Thời gian', value: basicInfo.time },
        { icon: Clock, label: 'Ước tính', value: basicInfo.duration },
        { icon: MapPin, label: 'nơi thực hiện', value: basicInfo.location },
        
        { icon: User, label: 'Người thực hiện', value: basicInfo.performer }
    ];

    return (
        <div className="todo-card-detail">
            {infoItems.map((item, index) => (
                <InfoItem key={index} {...item} />
            ))}
        </div>
    );
};

const InfoItem = ({ icon: Icon, label, value }) => (
    <p>
        <Icon size={16} /> {label}: <span>{value}</span>
    </p>
);

export default TodoBasicInfo;