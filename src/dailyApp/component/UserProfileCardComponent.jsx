// UserProfileCard.js
import React from 'react';
import { User, Eye } from 'lucide-react';
import './UserProfileCard.css';

const UserProfileCard = ({ userProfile, onClick }) => {
  const getBMIColor = (bmiCategory) => {
    switch (bmiCategory?.toLowerCase()) {
      case 'underweight':
        return '#3498db';
      case 'normal':
        return '#2ecc71';
      case 'overweight':
        return '#f39c12';
      case 'obese':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  const getGenderIcon = (gender) => {
    return gender?.toLowerCase() === 'male' ? '👨' : '👩';
  };

  return (
    <div className="user-profile-card" onClick={() => onClick(userProfile)}>
      <div className="profile-header">
        <div className="profile-avatar">
          {getGenderIcon(userProfile.gender)}
        </div>
        <div className="profile-basic-info">
          <h3 className="profile-name">{userProfile.name}</h3>
          <span className="profile-gender">{userProfile.gender}</span>
        </div>
      </div>
      
      <div className="profile-stats">
        <div className="stat-item">
          <span className="stat-label">BMI</span>
          <span 
            className="stat-value bmi-value"
            style={{ color: getBMIColor(userProfile.bmiCategory) }}
          >
            {userProfile.bmi?.toFixed(1)}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Cân nặng</span>
          <span className="stat-value">{userProfile.weightKg}kg</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Mục tiêu</span>
          <span className="stat-value">{userProfile.targetWeight}kg</span>
        </div>
      </div>
      
      <div className="profile-category">
        <span 
          className="bmi-category"
          style={{ backgroundColor: getBMIColor(userProfile.bmiCategory) }}
        >
          {userProfile.bmiCategory}
        </span>
      </div>
      
      <div className="profile-actions">
        <Eye size={16} />
        <span>Xem chi tiết</span>
      </div>
    </div>
  );
};

export default UserProfileCard;