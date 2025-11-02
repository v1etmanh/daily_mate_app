import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
} from 'chart.js';
import { Bar, Doughnut, Radar } from 'react-chartjs-2';
import './HealthDashboard.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler
);

const HealthDashboard = ({ userProfile }) => {
  // 1. BMI Gauge Component
  
  const BMIGauge = ({ bmi, bmiCategory }) => {
    const getBMIColor = (category) => {
      switch (category) {
        case 'Gầy': return '#3B82F6'; // Blue
        case 'Bình thường': return '#10B981'; // Green
        case 'Thừa cân': return '#F59E0B'; // Yellow
        case 'Béo phì': return '#EF4444'; // Red
        default: return '#6B7280'; // Gray
      }
    };

    const getBMIWidth = (bmi) => {
      if (bmi < 18.5) return (bmi / 18.5) * 25;
      if (bmi < 23) return 25 + ((bmi - 18.5) / (23 - 18.5)) * 25;
      if (bmi < 25) return 50 + ((bmi - 23) / (25 - 23)) * 25;
      return 75 + Math.min(((bmi - 25) / 10) * 25, 25);
    };

    return (
      <div className="bmi-gauge">
        <h3>Chỉ số BMI</h3>
        <div className="gauge-container">
          <div className="gauge-bar">
            <div className="gauge-section gau" style={{ width: '25%', backgroundColor: '#3B82F6' }}></div>
            <div className="gauge-section" style={{ width: '25%', backgroundColor: '#10B981' }}></div>
            <div className="gauge-section" style={{ width: '25%', backgroundColor: '#F59E0B' }}></div>
            <div className="gauge-section" style={{ width: '25%', backgroundColor: '#EF4444' }}></div>
          </div>
          <div 
            className="gauge-pointer" 
            style={{ left: `${getBMIWidth(bmi)}%` }}
          ></div>
        </div>
        <div className="bmi-info">
          <span className="bmi-value">{bmi?.toFixed(1)}</span>
          <span className="bmi-category" style={{ color: getBMIColor(bmiCategory) }}>
            {bmiCategory}
          </span>
        </div>
        <div className="gauge-labels">
          <span>Gầy</span>
          <span>Bình thường</span>
          <span>Thừa cân</span>
          <span>Béo phì</span>
        </div>
      </div>
    );
  };

  // 2. Weight Progress Component
  const WeightProgress = ({ currentWeight, targetWeight }) => {
    const difference = targetWeight - currentWeight;
    const isGaining = difference > 0;
    
    const data = {
      labels: ['Cân nặng'],
      datasets: [
        {
          label: 'Hiện tại',
          data: [currentWeight],
          backgroundColor: '#3B82F6',
        },
        {
          label: 'Mục tiêu',
          data: [targetWeight],
          backgroundColor: '#10B981',
        }
      ]
    };

    const options = {
      indexAxis: 'y',
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Cân nặng hiện tại vs Mục tiêu'
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          max: Math.max(currentWeight, targetWeight) * 1.1
        }
      }
    };

    return (
      <div className="weight-progress">
        <Bar data={data} options={options} />
        <div className="weight-info">
          <p>Cần {isGaining ? 'tăng' : 'giảm'}: <strong>{Math.abs(difference).toFixed(1)} kg</strong></p>
        </div>
      </div>
    );
  };

  // 3. BMR vs TDEE Component
  const EnergyComparison = ({ bmr, tdee }) => {
    const data = {
      labels: ['Năng lượng cơ bản', 'Năng lượng tiêu thụ'],
      datasets: [
        {
          label: 'Calories',
          data: [bmr, tdee],
          backgroundColor: ['#F59E0B', '#EF4444'],
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'BMR vs TDEE'
        }
      },
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    return (
      <div className="energy-comparison">
        <Bar data={data} options={options} />
        <div className="energy-info">
          <p>BMR: <strong>{bmr?.toFixed(0)} kcal</strong></p>
          <p>TDEE: <strong>{tdee?.toFixed(0)} kcal</strong></p>
        </div>
      </div>
    );
  };

  // 4. Nutrition Distribution Component
  const NutritionDistribution = ({ tdee }) => {
    const carbsKcal = tdee * 0.5;
    const proteinKcal = tdee * 0.25;
    const fatKcal = tdee * 0.25;

    const data = {
      labels: ['Carbs (50%)', 'Protein (25%)', 'Fat (25%)'],
      datasets: [
        {
          data: [carbsKcal, proteinKcal, fatKcal],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B'],
          hoverBackgroundColor: ['#2563EB', '#059669', '#D97706']
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        legend: {
          position: 'bottom',
        },
        title: {
          display: true,
          text: 'Phân bố năng lượng khuyến nghị'
        }
      }
    };

    return (
      <div className="nutrition-distribution">
        <Doughnut data={data} options={options} />
        <div className="nutrition-details">
          <p>Carbs: {(carbsKcal/4).toFixed(0)}g</p>
          <p>Protein: {(proteinKcal/4).toFixed(0)}g</p>
          <p>Fat: {(fatKcal/9).toFixed(0)}g</p>
        </div>
      </div>
    );
  };

  // 5. Activity Recommendations Component
  const ActivityRecommendations = ({ recommendedActivities }) => {
    const activities = [
      { name: 'Đi bộ', frequency: '7x/tuần', icon: '🚶‍♂️' },
      { name: 'Cardio', frequency: '3x/tuần', icon: '❤️' },
      { name: 'Tập tạ', frequency: '2x/tuần', icon: '🏋️' },
      { name: 'Yoga', frequency: '2x/tuần', icon: '🧘‍♀️' }
    ];

    return (
      <div className="activity-recommendations">
        <h3>Hoạt động khuyến nghị</h3>
        <div className="activity-list">
          {activities.map((activity, index) => (
            <div key={index} className="activity-item">
              <span className="activity-icon">{activity.icon}</span>
              <div className="activity-info">
                <span className="activity-name">{activity.name}</span>
                <span className="activity-frequency">{activity.frequency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 6. Health Overview Radar Chart
  const HealthOverview = ({ userProfile }) => {
    const getHealthScore = (bmi, tdee, bmr) => {
      let bmiScore = 5;
      if (userProfile.bmiCategory === 'Bình thường') bmiScore = 9;
      else if (userProfile.bmiCategory === 'Thừa cân') bmiScore = 7;
      else if (userProfile.bmiCategory === 'Gầy') bmiScore = 6;
      else bmiScore = 4;

      return {
        'Thể trạng': bmiScore,
        'Dinh dưỡng': Math.min(10, (tdee/bmr) * 3),
        'Khẩu vị': 7,
        'Sức khỏe': userProfile.warnings ? 4 : 8,
        'Mục tiêu': Math.random() * 3 + 7
      };
    };

    const healthScores = getHealthScore(userProfile.bmi, userProfile.tdee, userProfile.bmr);

    const data = {
      labels: Object.keys(healthScores),
      datasets: [
        {
          label: 'Điểm sức khỏe',
          data: Object.values(healthScores),
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(59, 130, 246, 1)',
        }
      ]
    };

    const options = {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Tổng quan sức khỏe'
        }
      },
      scales: {
        r: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 2
          }
        }
      }
    };

    return (
      <div className="health-overview">
        <Radar data={data} options={options} />
      </div>
    );
  };

  return (
    <div className="health-dashboard">
      <div className="dashboard-grid">
        <div className="dashboard-card">
          <BMIGauge bmi={userProfile.bmi} bmiCategory={userProfile.bmiCategory} />
        </div>
        
        <div className="dashboard-card">
          <WeightProgress 
            currentWeight={userProfile.weightKg} 
            targetWeight={userProfile.targetWeight} 
          />
        </div>

        <div className="dashboard-card">
          <EnergyComparison bmr={userProfile.bmr} tdee={userProfile.tdee} />
        </div>

        <div className="dashboard-card">
          <NutritionDistribution tdee={userProfile.tdee} />
        </div>

        <div className="dashboard-card">
          <ActivityRecommendations recommendedActivities={userProfile.recommendedActivities} />
        </div>

        <div className="dashboard-card large">
          <HealthOverview userProfile={userProfile} />
        </div>
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md space-y-2 shadow-sm">
  <p className="text-yellow-800 font-semibold">{userProfile.warnings}</p>
  <p className="text-gray-700">{userProfile.dietAdvice}</p>
</div>

      </div>
    </div>
  );
};

export default HealthDashboard;