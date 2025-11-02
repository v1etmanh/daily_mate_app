import logo from './logo.svg';
import './App.css';
import WeatherWidget from './dailyApp/component/WeatherWidget';
import RecipeSearch from './dailyApp/component/searchRecipesComponent';
import UserProfileForm from './dailyApp/component/UserProfileFormComponent';
import LocationSelector from './dailyApp/component/LocationSelectorComponent';
import HouseMembersList from './dailyApp/component/HouseMembersListComponent';
import TodoCard from './dailyApp/component/TodoComponent';
import TodoContainer from './dailyApp/component/TodoContainerComponent';
import HealthDashboard from './dailyApp/component/HealthDashboardComponent';
import TestTodoCard from './dailyApp/component/Test';
import DailyDashboardLanding from './dailyApp/component/HomePageComponent';
import './index.css';
import DailyMateApp from './dailyApp/component/DailyMateApp';
import UserProfilesList from './dailyApp/component/UserProfilesListComponent';
import InteractiveBodyModel from './dailyApp/component/InteractBody';
const userProfile = {
  bmi: 22.5,
  bmiCategory: "Bình thường",
  weightKg: 65,
  targetWeight: 60,
  bmr: 1400,
  tdee: 1960,
  recommendedActivities: "Đi bộ, yoga, cardio",
  warnings: null
};


function App() {
  return (
    <div className="App">
   <DailyMateApp></DailyMateApp>   


    </div>
  );
}

export default App;
