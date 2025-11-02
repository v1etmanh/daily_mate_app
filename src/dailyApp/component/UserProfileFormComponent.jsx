import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { postUserProfile } from '../api/ApiConnect';

const UserProfileForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const formik = useFormik({
    initialValues: {
      name: '',
      age: '',
      gender: 'MALE',
      heightCm: '',
      weightKg: '',
      dietaryGoal: '',
      healthCondition: '',
      tastePreference: ''
      ,allergies:'',
      dislikedIngredients:''
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Tên là bắt buộc').max(100),
      age: Yup.number().required('Tuổi là bắt buộc').min(1).max(120),
      gender: Yup.string().required('Giới tính là bắt buộc').oneOf(['MALE', 'FEMALE', 'OTHER']),
      heightCm: Yup.number().required('Chiều cao là bắt buộc').min(50).max(250),
      weightKg: Yup.number().required('Cân nặng là bắt buộc').min(20).max(300),
      dietaryGoal: Yup.string().max(100),
      healthCondition: Yup.string().max(255),
      tastePreference: Yup.string().max(100),
      allergies:Yup.string().max(100),
      dislikedIngredients:Yup.string().max(100)
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      setIsSubmitting(true);
      setSubmitMessage('');

      try {
        const userData = {
          ...values,
          age: parseInt(values.age, 10),
          heightCm: parseFloat(values.heightCm),
          weightKg: parseFloat(values.weightKg),
          dietaryGoal: values.dietaryGoal || null,
          healthCondition: values.healthCondition || null,
          tastePreference: values.tastePreference || null,
          allergies: values.allergies || null,
          dislikedIngredients: values.dislikedIngredients || null

        };

        const response = await postUserProfile(userData);
        setSubmitMessage('Tạo hồ sơ thành công!');
        resetForm();
      } catch (error) {
        if (error.response) {
          const errorData = error.response.data;
          setSubmitMessage(typeof errorData === 'string' ? `Lỗi: ${errorData}` : `Lỗi: ${errorData.message || 'Có lỗi xảy ra'}`);
        } else if (error.request) {
          setSubmitMessage('Không thể kết nối với server. Vui lòng thử lại.');
        } else {
          setSubmitMessage('Có lỗi xảy ra: ' + error.message);
        }
      } finally {
        setIsSubmitting(false);
        setSubmitting(false);
      }
    }
  });

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <form onSubmit={formik.handleSubmit}>
        <h2 className="text-2xl font-semibold mb-4">Tạo Hồ Sơ Người Dùng</h2>

        {/* Input Field Component */}
        {[
          { label: 'Tên *', name: 'name', type: 'text' },
          { label: 'Tuổi *', name: 'age', type: 'number' },
          { label: 'Chiều cao (cm) *', name: 'heightCm', type: 'number', step: '0.1' },
          { label: 'Cân nặng (kg) *', name: 'weightKg', type: 'number', step: '0.1' },
          { label: 'Mục tiêu ăn uống', name: 'dietaryGoal', type: 'text' },
          { label: 'Khẩu vị', name: 'tastePreference', type: 'text' },
           { label: 'dị ứng', name: 'allergies', type: 'text' },
            { label: 'nguyên liệu không thích', name: 'dislikedIngredients', type: 'text' }
        ].map(({ label, name, type, step }) => (
          <div key={name} className="mb-4">
            <label className="block mb-1 font-medium">{label}</label>
            <input
              type={type}
              step={step}
              name={name}
              {...formik.getFieldProps(name)}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
            />
            {formik.touched[name] && formik.errors[name] && (
              <p className="text-red-600 text-sm mt-1">{formik.errors[name]}</p>
            )}
          </div>
        ))}

        {/* Gender Select */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Giới tính *</label>
          <select
            name="gender"
            {...formik.getFieldProps('gender')}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-blue-300"
          >
            <option value="MALE">Nam</option>
            <option value="FEMALE">Nữ</option>
            <option value="OTHER">Khác</option>
          </select>
          {formik.touched.gender && formik.errors.gender && (
            <p className="text-red-600 text-sm mt-1">{formik.errors.gender}</p>
          )}
        </div>

        {/* Health Condition */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Tình trạng sức khỏe</label>
          <textarea
            name="healthCondition"
            {...formik.getFieldProps('healthCondition')}
            disabled={isSubmitting}
            className="w-full px-3 py-2 border border-gray-300 rounded min-h-[60px] focus:outline-none focus:ring focus:ring-blue-300"
          />
        </div>

        {/* Submit Message */}
        {submitMessage && (
          <div
            className={`mb-4 p-3 rounded ${
              submitMessage.includes('thành công')
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}
          >
            {submitMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || !formik.isValid}
          className={`w-full py-2 px-4 rounded text-white ${
            isSubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isSubmitting ? 'Đang tạo...' : 'Tạo hồ sơ'}
        </button>
      </form>
    </div>
  );
};

export default UserProfileForm;
