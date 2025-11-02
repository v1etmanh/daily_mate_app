import React, { useState, useEffect, useCallback } from 'react';
import TodoCard from './TodoComponent';
import { PlusCircle, Trash2, XCircle, Save, AlertCircle, RefreshCw, Loader } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';
import './TodoContainer.css';

import LocationSelector from './LocationSelectorComponent';
import { getTodos, getUser, createTodo, deleteTodo, generateTodo } from '../api/ApiConnect';

moment.locale('vi');

// TodoForm Component


const TodoForm = ({ users, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        description: '',
        timeStart: '',
        estimateTime: 0,
        location:'',
        userId: null,
       
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
 const getLocationFromGPS = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ GPS'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: 'Vị trí hiện tại',
            country: 'GPS'
          });
        },
        (error) => {
          let errorMessage = 'Không thể lấy vị trí GPS';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Bạn đã từ chối quyền truy cập vị trí';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Không thể xác định vị trí';
              break;
            case error.TIMEOUT:
              errorMessage = 'Hết thời gian chờ GPS';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 600000
        }
      );
    });
  };
    // 🧭 Tự động lấy vị trí GPS khi form mount
 useEffect(() => {
  const fetchLocation = async () => {
    try {
      const lo = await getLocationFromGPS(); // Chờ resolve Promise
      console.log("Lấy được vị trí GPS:", lo);
      setFormData(prev => ({
        ...prev,
        location: `${lo.lat.toFixed(6)},${lo.lon.toFixed(6)}`
      }));
    } catch (err) {
      console.warn("Lỗi khi lấy vị trí GPS:", err.message);
    }
  };

  fetchLocation();
}, []);



    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleUserChange = (e) => {
        const value = e.target.value;
        setFormData(prev => ({
            ...prev,
            userId: value === '' ? null : parseInt(value),
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const submitData = {
                description: formData.description,
                timeStart: formData.timeStart ? moment(formData.timeStart).toISOString() : null,
                estimateTime: parseFloat(formData.estimateTime) || 0,
                userId: formData.userId,
               location:formData.location
            };

            await onSubmit(submitData);
        } catch (error) {
            console.error('Error submitting form:', error);
        } finally {
            setIsSubmitting(false);
        }
    };
    // Trả về ISO datetime format cho hôm nay
const getMinDateTime = () => {
  const now = new Date();
  now.setSeconds(0, 0); // Xóa giây cho gọn
  return now.toISOString().slice(0, 16); // yyyy-MM-ddTHH:mm
};

// Trả về ISO datetime format cho 3 ngày sau
const getMaxDateTime = () => {
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 3);
  maxDate.setHours(23, 59, 0, 0); // Cho phép chọn tối đa đến 23:59 ngày thứ 3
  return maxDate.toISOString().slice(0, 16);
};


    return (
        <div className="todo-form-overlay">
            <div className="todo-form-modal">
                <div className="todo-form-header">
                    <h3>Tạo Hoạt động Mới</h3>
                    <button type="button" onClick={onCancel} className="close-button">
                        <XCircle size={24} />
                    </button>
                    
                </div>
              
                <form onSubmit={handleSubmit} className="todo-form-content">
                    <div className="form-group">
                        <label htmlFor="description">Mô tả hoạt động:</label>
                        <input
                            type="text"
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="timeStart">Thời gian bắt đầu:</label>
                      <input
  type="datetime-local"
  id="timeStart"
  name="timeStart"
  value={formData.timeStart}
  onChange={handleInputChange}
  disabled={isSubmitting}
  min={getMinDateTime()}
  max={getMaxDateTime()}
/>

                    </div>

                    <div className="form-group">
                        <label htmlFor="estimateTime">Thời gian ước tính (giờ):</label>
                        <input
                            type="number"
                            id="estimateTime"
                            name="estimateTime"
                            value={formData.estimateTime}
                            onChange={handleInputChange}
                            step="0.1"
                            min="0"
                            disabled={isSubmitting}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="userId">Người thực hiện:</label>
                        <select
                            id="userId"
                            name="userId"
                            value={formData.userId || ''}
                            onChange={handleUserChange}
                            required
                            disabled={isSubmitting}
                        >
                            <option value="">Chọn người thực hiện</option>
                            {users.map(user => (
                                <option key={user.id} value={user.id}>
                                    {user.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <p style={{ fontSize: '14px', color: '#666' }}>
                            🌍 Vị trí hiện tại: {formData.location  
                              ? `${formData.location}`
                              : 'Đang xác định...'}
                        </p>
                    </div>

                    <div className="form-actions">
                        <button
                            type="submit"
                            className="submit-button"
                            disabled={isSubmitting || !formData.location}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader size={20} className="spinner" /> Đang tạo...
                                </>
                            ) : (
                                <>
                                    <Save size={20} /> Tạo mới
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onCancel}
                            className="cancel-button"
                            disabled={isSubmitting}
                        >
                            <XCircle size={20} /> Hủy
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};




// Main TodoContainer Component
const TodoContainer = () => {
    const [todos, setTodos] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [selectedUser, setSelectedUser] = useState(-1);
    const[showChoice,setShowChoice]=useState(false)
    const [aiLoading, setAiLoading] = useState(false); 
    // Fetch initial data
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const [todosResponse, usersResponse] = await Promise.all([
                getTodos(),
                getUser()
            ]);
            
            setTodos(todosResponse.data || []);
            setUsers(usersResponse.data || []);
            console.log('Users loaded:', usersResponse.data);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Handle create new todo
    const handleCreateClick = () => {
        setShowForm(true);
    };

    // Handle form submission
    const handleFormSubmit = async (formData) => {
        try {
            console.log(formData)
            const response = await createTodo(formData);
            
            if (response.data) {
                setTodos(prevTodos => [...prevTodos, response.data]);
                setShowForm(false);
                setError(null);
            }
        } catch (err) {
            console.error("Error creating todo:", err);
            setError("Không thể tạo hoạt động. Vui lòng thử lại.");
            throw err; // Re-throw để form xử lý
        }
    };

    // Handle cancel form
    const handleCancelForm = () => {
        setShowForm(false);
    };

    // Handle delete todo
    const handleDeleteClick = async (todoId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa hoạt động này?')) {
            return;
        }

        try {
            await deleteTodo(todoId);
            setTodos(prevTodos => prevTodos.filter(todo => todo.todoId !== todoId));
            setError(null);
        } catch (err) {
            console.error("Error deleting todo:", err);
            setError("Không thể xóa hoạt động. Vui lòng thử lại.");
        }
    };
 const getLocationFromGPS = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Trình duyệt không hỗ trợ GPS'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
            city: 'Vị trí hiện tại',
            country: 'GPS'
          });
        },
        (error) => {
          let errorMessage = 'Không thể lấy vị trí GPS';
          switch(error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Bạn đã từ chối quyền truy cập vị trí';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Không thể xác định vị trí';
              break;
            case error.TIMEOUT:
              errorMessage = 'Hết thời gian chờ GPS';
              break;
          }
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 600000
        }
      );
    });
  };
  const createTodoByAi = async () => {
        if (selectedUser === -1) {
            setError("Vui lòng chọn người dùng");
            return;
        }

        setAiLoading(true);
        try {
            const lo = await getLocationFromGPS();
            const location = `${lo.lat.toFixed(6)},${lo.lon.toFixed(6)}`;
            
            const response = await generateTodo(selectedUser, location);
            
            if (response.data) {
                setTodos(prevTodos => [...prevTodos, response.data]);
                setShowChoice(false);
                setSelectedUser(-1);
                setError(null);
            }
            
            console.log(response.data);
        } catch (err) {
            console.error("Error creating AI todo:", err);
            setError("Không thể tạo hoạt động bằng AI. Vui lòng thử lại.");
        } finally {
            setAiLoading(false);
        }
    };

    const handleCancelAiForm = () => {
        setShowChoice(false);
        setSelectedUser(-1);
        setAiLoading(false);
    };

    // Loading state
    if (loading) {
        return (
            <div className="todo-loading-state">
                <Loader className="todo-icon-spin" size={32} />
                <p>Đang tải dữ liệu...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="todo-error-state">
                <AlertCircle size={32} className="todo-error-icon" />
                <p className="todo-error-message">{error}</p>
                <button className="todo-retry-button" onClick={fetchData}>
                    <RefreshCw size={20} /> Thử lại
                </button>
            </div>
        );
    }

    // Main render
    return (
        <div className="todo-container">
            <div className="todo-header">
                <h2 className="todo-main-title">Quản lý Hoạt động Hàng ngày</h2>
                <div className="todo-header-buttons">
                    <button 
                        onClick={handleCreateClick} 
                        className="create-todo-button"
                    >
                        <PlusCircle size={20} /> Tạo Hoạt động Mới
                    </button>
                    <button 
                        onClick={() => setShowChoice(true)} 
                        className="create-todo-button ai-button"
                    >
                        <PlusCircle size={20} /> Tạo bằng AI
                    </button>
                </div>
            </div>

            {todos.length === 0 ? (
                <div className="no-todos-message">
                    <p>Chưa có hoạt động nào được tạo.</p>
                    <p>Hãy tạo hoạt động đầu tiên của bạn!</p>
                </div>
            ) : (
                <div className="todo-list-grid">
                    {todos.map(todo => (
                        <div key={todo.todoId} className="todo-item-wrapper">
                            <TodoCard todo={todo} users={users} />
                            <div className="todo-actions-bottom">
                                <button 
                                    onClick={() => handleDeleteClick(todo.todoId)} 
                                    className="delete-button-form"
                                >
                                    <Trash2 size={18} /> Xóa hoạt động
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showForm && (
                <TodoForm
                    users={users}
                    onSubmit={handleFormSubmit}
                    onCancel={handleCancelForm}
                />
            )}

            {showChoice && (
                <div className="modal-overlay">
                    <div className="ai-form-modal">
                        <div className="ai-form-header">
                            <h3>Tạo hoạt động ngẫu nhiên bằng AI</h3>
                            <button 
                                onClick={handleCancelAiForm}
                                className="close-button"
                                disabled={aiLoading}
                            >
                                ×
                            </button>
                        </div>
                        
                        <div className="ai-form-content">
                            <div className="form-group">
                                <label htmlFor="userSelect">Chọn người dùng:</label>
                                <select 
                                    id="userSelect"
                                    value={selectedUser}
                                    onChange={(e) => setSelectedUser(e.target.value)}
                                    className="user-select"
                                    disabled={aiLoading}
                                >
                                    <option value={-1}>-- Chọn người dùng --</option>
                                    {users.map(user => (
                                        <option key={user.id} value={user.id}>
                                            {user.name || `User ${user.id}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="ai-form-actions">
                                <button 
                                    onClick={handleCancelAiForm}
                                    className="cancel-button"
                                    disabled={aiLoading}
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={createTodoByAi}
                                    className="submit-button ai-submit"
                                    disabled={aiLoading || selectedUser === -1}
                                >
                                    {aiLoading ? (
                                        <>
                                            <Loader className="spin" size={16} />
                                            Đang tạo...
                                        </>
                                    ) : (
                                        <>
                                            <PlusCircle size={16} />
                                            Tạo bằng AI
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TodoContainer;