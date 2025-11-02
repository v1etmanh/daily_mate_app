import React from 'react';

const FilterBar = ({ sources, selectedSource, onSourceChange, searchTerm, onSearchChange }) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 min-w-0">
                <input
                    type="text"
                    placeholder="Tìm kiếm tin tức..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>
            
            <div className="flex gap-2">
                <button
                    onClick={() => onSourceChange('all')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        selectedSource === 'all'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Tất cả
                </button>
                
                {sources.map(source => (
                    <button
                        key={source}
                        onClick={() => onSourceChange(source)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedSource === source
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {source}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default FilterBar;