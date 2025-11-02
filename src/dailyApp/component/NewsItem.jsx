import React from 'react';

const NewsItem = React.memo(({ item }) => {
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getSourceColor = (source) => {
        const colors = {
            'WHO': 'bg-blue-100 text-blue-800',
            'Harvard': 'bg-red-100 text-red-800',
            'MedicalNewsToday': 'bg-green-100 text-green-800'
        };
        return colors[source] || 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSourceColor(item.source)}`}>
                        {item.source}
                    </span>
                    <time className="text-sm text-gray-500">
                        {formatDate(item.publishedDate)}
                    </time>
                </div>
                
                <h2 className="text-xl font-bold text-gray-800 mb-3 line-clamp-2">
                    {item.title}
                </h2>
                
                <div 
                    className="text-gray-600 mb-4 line-clamp-3"
                    dangerouslySetInnerHTML={{ 
                        __html: item.description.replace(/<[^>]*>/g, '') 
                    }}
                />
                
                <a 
                    href={item.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
                >
                    Đọc thêm
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </a>
            </div>
        </div>
    );
});

NewsItem.displayName = 'NewsItem';

export default NewsItem;