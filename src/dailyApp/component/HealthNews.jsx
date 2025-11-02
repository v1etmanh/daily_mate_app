import React, { useState, useEffect, useCallback } from 'react';
import NewsItem from './NewsItem';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import FilterBar from './FilterBar';
import { getNews } from '../api/ApiConnect';

const HealthNews = () => {
    const [news, setNews] = useState([]);
    const [filteredNews, setFilteredNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSource, setSelectedSource] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch dữ liệu từ API
    const fetchNews = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const response = await getNews();
            
            if (response.status!=200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            console.log(response.data)
            const data = await response.data;
            setNews(data);
            setFilteredNews(data);
        } catch (err) {
            setError(err.message);
            console.error('Error fetching news:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Gọi API khi component mount
    useEffect(() => {
        fetchNews();
    }, [fetchNews]);

    // Lọc tin tức theo source và search
    useEffect(() => {
        let filtered = news;

        // Lọc theo source
        if (selectedSource !== 'all') {
            filtered = filtered.filter(item => item.source === selectedSource);
        }

        // Lọc theo search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        setFilteredNews(filtered);
    }, [news, selectedSource, searchTerm]);

    // Lấy danh sách sources unique
    const sources = [...new Set(news.map(item => item.source))];

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage message={error} onRetry={fetchNews} />;

    return (
        <div className="max-w-7xl mx-auto p-4">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800 mb-4">
                    Tin tức Sức khỏe Toàn cầu
                </h1>
                
                <FilterBar
                    sources={sources}
                    selectedSource={selectedSource}
                    onSourceChange={setSelectedSource}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                />
            </div>

            <div className="mb-4 text-gray-600">
                Hiển thị {filteredNews.length} bài viết
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.map((item, index) => (
                    <NewsItem key={`${item.source}-${index}`} item={item} />
                ))}
            </div>

            {filteredNews.length === 0 && !loading && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">
                        Không tìm thấy bài viết nào phù hợp
                    </p>
                </div>
            )}
        </div>
    );
};

export default HealthNews;