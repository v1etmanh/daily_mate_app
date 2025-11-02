// UserProfilesList.js
import React, { useState, useEffect } from 'react';
import { Users, Loader, AlertCircle, X } from 'lucide-react';
import UserProfileCard from './UserProfileCardComponent';
import HealthDashboard from './HealthDashboardComponent'; // Component bạn đã có
import { getALlUser } from '../api/ApiConnect';
import './UserProfilesList.css';
import UserProfileForm from './UserProfileFormComponent';

const UserProfilesList = () => {
  const [userProfiles, setUserProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
   const[showForm,setShowForm]=useState(false);
  useEffect(() => {
    fetchUserProfiles();
  }, []);
  const createNewUser=()=>{
    const x=showForm==true?false:true;
    setShowForm(x);
  }
  const fetchUserProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getALlUser();
      setUserProfiles(response.data || []);
    } catch (err) {
      console.error('Error fetching user profiles:', err);
      setError('Không thể tải danh sách hồ sơ người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileClick = (profile) => {
    setSelectedProfile(profile);
    setShowDetailModal(true);
  };

  const handleCloseModal = () => {
    setSelectedProfile(null);
    setShowDetailModal(false);
  };

  if (loading) {
    return (
      <div className="profiles-loading">
        <Loader className="loading-spinner" size={40} />
        <p>Đang tải danh sách hồ sơ...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profiles-error">
        <AlertCircle size={40} className="error-icon" />
        <p className="error-message">{error}</p>
        <button onClick={fetchUserProfiles} className="retry-button">
          Thử lại
        </button>
      </div>
    );
  }
  
  return (
    <div className="user-profiles-container">
      <div className="profiles-header">
        <div className="header-content">
          <Users size={32} className="header-icon" />
          <div>
            <h1 className="profiles-title">Danh sách Hồ sơ Sức khỏe</h1>
            <p className="profiles-subtitle">
              Tổng cộng {userProfiles.length} hồ sơ người dùng
            </p>
          </div>
        </div>
         <button onClick={createNewUser} class="
            px-6 py-3          /* Padding ngang và dọc */
            bg-blue-600        /* Màu nền xanh đậm */
            text-white         /* Màu chữ trắng */
            font-semibold      /* Độ đậm chữ */
            rounded-lg         /* Bo tròn góc */
            shadow-md          /* Đổ bóng nhẹ */
            hover:bg-blue-700  /* Thay đổi màu nền khi di chuột qua */
            focus:outline-none /* Bỏ viền outline khi focus */
            focus:ring-2       /* Thêm vòng ring khi focus */
            focus:ring-blue-500 /* Màu vòng ring */
            focus:ring-opacity-75 /* Độ trong suốt của vòng ring */
            active:bg-blue-800 /* Thay đổi màu nền khi click */
            transition-all     /* Hiệu ứng chuyển đổi mượt mà cho tất cả thuộc tính */
            duration-200       /* Thời gian chuyển đổi 200ms */
            ease-in-out        /* Hàm thời gian chuyển đổi */
            transform          /* Cho phép các transform như scale */
            hover:scale-105    /* Phóng to nhẹ khi di chuột qua */
            active:scale-95    /* Thu nhỏ nhẹ khi click */
            w-full             /* Chiếm toàn bộ chiều rộng của container trên mobile */
            sm:w-auto          /* Tự động chiều rộng trên màn hình lớn hơn sm */
        "> 
           tạo 1 profile mới
        </button>
      </div>
   {showForm&&<UserProfileForm></UserProfileForm>}
      {userProfiles.length === 0 ? (
        <div className="no-profiles">
          <Users size={64} className="no-profiles-icon" />
          <h3>Chưa có hồ sơ nào</h3>
          <p>Hiện tại chưa có hồ sơ người dùng nào được tạo.</p>
        </div>
      ) : (
        <div className="profiles-grid">
          {userProfiles.map((profile, index) => (
            <UserProfileCard
              key={index}
              userProfile={profile}
              onClick={handleProfileClick}
            />
          ))}
        </div>
      )}

      {/* Modal hiển thị chi tiết */}
      {showDetailModal && selectedProfile && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Chi tiết hồ sơ - {selectedProfile.name}</h2>
              <button 
                className="modal-close-button"
                onClick={handleCloseModal}
              >
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <HealthDashboard userProfile={selectedProfile} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilesList;