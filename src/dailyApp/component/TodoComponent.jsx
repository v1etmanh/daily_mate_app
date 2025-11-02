// src/components/TodoCard.jsx
import React, { useState } from 'react';

import TodoExtendedInfo from './TodoExtendedInfo';
import './TodoCard.css';
import { useTodoData } from './useTodoData';
import TodoBasicInfo from './TodoBasicInfo';

const TodoCard = ({ todo, users }) => {
   
    const [isExpanded, setIsExpanded] = useState(false);
    const todoData = useTodoData(todo, users);
    
    if (!todoData) {
        return <div className="todo-card-placeholder">Không có dữ liệu hoạt động.</div>;
    }

    return (
        <div className="todo-card">
            <h3 className="todo-card-title">{todo.description}</h3>
            
            <TodoBasicInfo basicInfo={todoData.basicInfo} />
            
            {todoData.hasExtendedInfo && (
                <TodoExtendedInfo
                    extendedInfo={todoData.extendedInfo}
                    isExpanded={isExpanded}
                    onToggle={() => setIsExpanded(!isExpanded)}
                />
            )}
        </div>
    );
};

export default TodoCard;