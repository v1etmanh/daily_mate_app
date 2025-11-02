import React, { useState } from 'react';
import DishCreateList from './DishHistoryComponent';
import DishRecommendationManager from './DishRecommendationHis';


const DishHistorySelector = () => {
  const [view, setView] = useState(null); // null | 'family' | 'member'

  const handleFamilyView = () => setView('family');
  const handleMemberView = () => setView('member');

  return (
    <div className="p-4 space-y-4">
      <div className="space-x-4">
        <button
          onClick={handleFamilyView}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Xem lịch sử món ăn của gia đình
        </button>
        <button
          onClick={handleMemberView}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Xem lịch sử món ăn theo từng thành viên
        </button>
      </div>

      <div className="mt-6">
        {view === 'family' && <DishCreateList />}
        {view === 'member' && <DishRecommendationManager />}
      </div>
    </div>
  );
};

export default DishHistorySelector;
