import React from 'react';

const ErrorMessage = ({ message, onRetry }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="text-red-600 mb-4">
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <button
                onClick={onRetry}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                Thử lại
            </button>
        </div>
    );
};

export default ErrorMessage;