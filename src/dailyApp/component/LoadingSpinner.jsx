import React from 'react';

const LoadingSpinner = () => {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-lg text-gray-600">Đang tải tin tức...</p>
        </div>
    );
};

export default LoadingSpinner;