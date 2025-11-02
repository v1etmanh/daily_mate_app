import React from 'react';
import { 
    Info, 
    AlertTriangle, 
    ChevronDown, 
    ChevronUp, 
    Star, 
    HeartPulse, 
    Sun, 
    ClipboardList, 
    RefreshCw 
} from 'lucide-react';

const TodoExtendedInfo = ({ extendedInfo, isExpanded, onToggle }) => {
    return (
        <div className="todo-card-extend-section">
            <button 
                className="todo-card-extend-button"
                onClick={onToggle}
                type="button"
            >
                <span>Thông tin chi tiết</span>
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {isExpanded && (
                <div className="todo-card-meta space-y-2 mt-2 text-sm">
                    {extendedInfo.evaluation && (
                        <MetaItem 
                            icon={Info} 
                            label="Đánh giá" 
                            value={extendedInfo.evaluation}
                            className="todo-card-evaluation"
                        />
                    )}
                    {extendedInfo.warning && (
                        <MetaItem 
                            icon={AlertTriangle} 
                            label="Cảnh báo" 
                            value={extendedInfo.warning}
                            className="todo-card-warning"
                        />
                    )}
                    {extendedInfo.priority && (
                        <MetaItem 
                            icon={Star} 
                            label="Ưu tiên" 
                            value={extendedInfo.priority}
                            className="todo-card-priority"
                        />
                    )}
                    {extendedInfo.healthImpact && (
                        <MetaItem 
                            icon={HeartPulse} 
                            label="Tác động sức khỏe" 
                            value={extendedInfo.healthImpact}
                            className="todo-card-health"
                        />
                    )}
                    {extendedInfo.weatherSuitability && (
                        <MetaItem 
                            icon={Sun} 
                            label="Phù hợp thời tiết" 
                            value={extendedInfo.weatherSuitability}
                            className="todo-card-weather"
                        />
                    )}
                    {extendedInfo.preparationNeeded && (
                        <MetaItem 
                            icon={ClipboardList} 
                            label="Chuẩn bị cần thiết" 
                            value={extendedInfo.preparationNeeded}
                            className="todo-card-prep"
                        />
                    )}
                    {extendedInfo.alternativeActivity && (
                        <MetaItem 
                            icon={RefreshCw} 
                            label="Hoạt động thay thế" 
                            value={extendedInfo.alternativeActivity}
                            className="todo-card-alternative"
                        />
                    )}
                </div>
            )}
        </div>
    );
};

const MetaItem = ({ icon: Icon, label, value, className }) => (
    <div className={`flex items-start gap-2 ${className}`}>
        <Icon size={16} className="mt-0.5 text-gray-500" />
        <div>
            <strong className="block text-gray-700">{label}:</strong>
            <span className="text-gray-800">{value}</span>
        </div>
    </div>
);

export default TodoExtendedInfo;
