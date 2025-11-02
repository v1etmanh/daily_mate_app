import React, { useState, useEffect } from 'react';
import { User, Users, ChevronRight, Home, Phone, Mail, MapPin, AlertCircle, RefreshCw, XCircle } from 'lucide-react';
import { getUser } from '../api/ApiConnect'; // Đảm bảo đường dẫn này chính xác

// Import file CSS riêng cho component này
import './HouseMembersList.css';

const HouseMembersList = () => {
    const [members, setMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMembers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await getUser();
            setMembers(response.data || []);
            console.log(response.data)
        } catch (err) {
            console.error('Error fetching members:', err);
            setError('Không thể tải danh sách thành viên. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMembers();
    }, []);

    const handleMemberClick = (member) => {
        setSelectedMember(member);
    };

    const getAvatarColorClass = (name) => {
        const colors = [
            'avatar-blue', 'avatar-green', 'avatar-purple',
            'avatar-pink', 'avatar-yellow', 'avatar-indigo',
            'avatar-red', 'avatar-teal', 'avatar-orange'
        ];
        const index = name.charCodeAt(name.length - 1) % colors.length;
        return colors[index];
    };

    const getInitials = (name) => {
        if (!name) return '';
        const words = name.split(' ');
        if (words.length === 1) return words[0].charAt(0).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    };

    if (loading) {
        return (
            <div className="loading-state">
                <RefreshCw className="icon-spin" /> Đang tải danh sách thành viên...
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state">
                <AlertCircle className="error-icon" />
                <p className="error-message">{error}</p>
                <button className="retry-button" onClick={fetchMembers}>
                    <RefreshCw className="icon-small-mr" /> Thử lại
                </button>
            </div>
        );
    }

    return (
        <div className="house-members-layout">
            {/* Main List Area */}
            <div className={`member-list-panel ${selectedMember ? 'member-list-panel--shrunk' : ''}`}>
                <h2 className="panel-title">
                    <Users className="icon-large-mr" /> Thành viên trong nhà
                </h2>

                {members.length === 0 ? (
                    <div className="no-members-state">
                        <User className="no-members-icon" />
                        <p className="no-members-title">Chưa có thành viên nào.</p>
                        <p className="no-members-text">Hãy thêm thành viên mới để quản lý.</p>
                    </div>
                ) : (
                    <ul className="member-list">
                        {members.map((member) => (
                            <li
                                key={member.userId}
                                className={`member-list-item ${selectedMember && selectedMember.userId === member.userId ? 'member-list-item--selected' : ''}`}
                                onClick={() => handleMemberClick(member)}
                            >
                                <div className={`member-avatar ${getAvatarColorClass(member.name)}`}>
                                    {getInitials(member.name)}
                                </div>
                                <div className="member-info">
                                    <div className="member-name">{member.name}</div>
                                    <div className="member-goal">{member.dietaryGoal || 'Chưa có mục tiêu ăn kiêng'}</div>
                                </div>
                                <ChevronRight className="icon-small-ml" />
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* Member Detail Sidebar */}
            {selectedMember && (
                <div className="member-detail-sidebar">
                    <div className="detail-header">
                        <h3 className="panel-title">
                            <User className="icon-large-mr" /> Chi tiết thành viên
                        </h3>
                        <button
                            onClick={() => setSelectedMember(null)}
                            className="close-button"
                            aria-label="Đóng chi tiết"
                        >
                            <XCircle className="icon-close" />
                        </button>
                    </div>

                    <div className="detail-avatar-section">
                        <div className={`member-avatar-large ${getAvatarColorClass(selectedMember.name)}`}>
                            {getInitials(selectedMember.name)}
                        </div>
                        <h4 className="detail-name">{selectedMember.name}</h4>
                        <p className="detail-goal">{selectedMember.dietaryGoal || 'Không có mục tiêu ăn kiêng'}</p>
                    </div>

                    <div className="detail-info-grid">
                        <DetailItem icon={<User className="icon-detail" />} label="Tuổi" value={selectedMember.age ? `${selectedMember.age} tuổi` : 'Chưa cập nhật'} />
                        <DetailItem icon={<Home className="icon-detail" />} label="Giới tính" value={selectedMember.gender || 'Chưa cập nhật'} />
                        <DetailItem icon={<Phone className="icon-detail" />} label="Chiều cao" value={selectedMember.heightCm ? `${selectedMember.heightCm} cm` : 'Chưa cập nhật'} />
                        <DetailItem icon={<Mail className="icon-detail" />} label="Cân nặng" value={selectedMember.weightKg ? `${selectedMember.weightKg} kg` : 'Chưa cập nhật'} />
                        <DetailItem icon={<MapPin className="icon-detail" />} label="Tình trạng sức khỏe" value={selectedMember.healthCondition || 'Tốt'} />
                        <DetailItem icon={<AlertCircle className="icon-detail" />} label="Sở thích ăn uống" value={selectedMember.tastePreference || 'Không có'} />
                    </div>
                    <div>
                        <p>${selectedMember.warnings}</p>
                         <p>${selectedMember.dietAdvice}</p>
                    </div>

                    <div className="detail-actions">
                        <button className="action-button">
                            Xem thêm chi tiết
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper component for detail rows
const DetailItem = ({ icon, label, value }) => (
    <div className="detail-item">
        <div className="detail-item-icon">{icon}</div>
        <div className="detail-item-content">
            <div className="detail-item-label">{label}:</div>
            <div className="detail-item-value">{value}</div>
        </div>
    </div>
);

export default HouseMembersList;