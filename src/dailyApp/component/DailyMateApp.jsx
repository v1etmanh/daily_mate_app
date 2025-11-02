import {BrowserRouter, Route, Router, Routes} from "react-router-dom"
import HeaderComponent from "./HeaderComponent"
import LoginComponent from "./LoginComponent"
import WeatherWidget from "./WeatherWidget"
import MemberInfor from "./MemberInfComponent"
import TodoContainer from "./TodoContainerComponent"
import AuthProvider, { useAuth } from "../security/Authentication"
import DailyDashboardLanding from "./HomePageComponent"
import { useState } from "react"
import UserProfilesList from "./UserProfilesListComponent"
import DishCreateList from "./DishHistoryComponent"
import HealthNews from "./HealthNews"
import CapybaraAssistant from "./CapybaraAssistant"
import DishHistorySelector from "./ChoiceTypeDisplayDish"
import InteractiveBodyModel from "./InteractBody"

export default function DailyMateApp(){
    const [isHeaderOpen, setIsHeaderOpen] = useState(false)

    function AuthenticationProvider({children}){
        const auth=useAuth()
        if(auth.isAuthentication===true){
            return children
        }
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <AuthProvider>
                <BrowserRouter>
                    {/* Overlay khi sidebar mở */}
                    {isHeaderOpen && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 z-40"
                            onClick={() => setIsHeaderOpen(false)}
                        />
                    )}
                    
                    {/* Header/Sidebar Component */}
                    <HeaderComponent 
                        isOpen={isHeaderOpen}
                        onClose={() => setIsHeaderOpen(false)}
                    />
                     
                    {/* Hình ảnh góc phải phía dưới */}
                  <CapybaraAssistant></CapybaraAssistant>


                    {/* Button toggle sidebar - giữ style tương tự header cũ */}
                    <button
                        onClick={() => setIsHeaderOpen(!isHeaderOpen)}
                        className="font-grotesk fixed top-8 left-8 z-50 p-3 bg-white bg-opacity-15 shadow-md rounded-2xl backdrop-blur-md hover:scale-110 transition duration-200 transform"
                    >
                        <svg className="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Main content area */}
                    <div className="w-full">
                        <Routes>
                            <Route path="/login" element={<LoginComponent />} />
                            <Route path="/" element={<DailyDashboardLanding />} />
                            <Route path="/createDish" element={<AuthenticationProvider><WeatherWidget /></AuthenticationProvider>} />
                            <Route path="/memberInfor" element={<AuthenticationProvider><UserProfilesList /></AuthenticationProvider>} />
                            <Route path="/Todo" element={<AuthenticationProvider><TodoContainer /></AuthenticationProvider>} />
                            <Route path="/history" element={<AuthProvider><DishHistorySelector></DishHistorySelector></AuthProvider>}></Route>
                                <Route path="/healthyNew" element={<AuthProvider><HealthNews ></HealthNews ></AuthProvider>}></Route>
                                <Route path="/defineDisease" element={<AuthProvider><InteractiveBodyModel ></InteractiveBodyModel ></AuthProvider>}></Route>
                        </Routes>
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </div>
    )
}