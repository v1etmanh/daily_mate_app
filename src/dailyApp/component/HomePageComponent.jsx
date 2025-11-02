import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Thermometer, 
  MapPin, 
  Heart, 
  Activity, 
  CheckCircle, 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  TrendingUp,
  Utensils,
  AlertCircle,
  Coffee,
  Sunset,
  Moon,
  ChevronRight,
  Star,
  Shield,
  Zap,
  ArrowDown,
  Play,
  Smartphone,
  Brain,
  Globe,
  Monitor,
  BarChart3
} from 'lucide-react';

const DailyDashboardLanding = () => {
  const [currentFeature, setCurrentFeature] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentFeature((prev) => (prev + 1) % 6);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <Cloud className="w-6 h-6 text-slate-600" />,
      title: "Weather Intelligence",
      description: "Real-time weather analysis with location-based recommendations for your daily activities"
    },
    {
      icon: <Utensils className="w-6 h-6 text-slate-600" />,
      title: "Meal Suggestions",
      description: "Personalized food recommendations based on weather, health data, and local ingredients"
    },
    {
      icon: <Heart className="w-6 h-6 text-slate-600" />,
      title: "Health Tracking",
      description: "Monitor BMI, habits, and health conditions with personalized wellness insights"
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-slate-600" />,
      title: "Smart Planning",
      description: "Intelligent task scheduling that adapts to weather conditions and your preferences"
    },
    {
      icon: <BarChart3 className="w-6 h-6 text-slate-600" />,
      title: "Analytics Dashboard",
      description: "Comprehensive overview of your daily metrics with real-time data insights"
    },
    {
      icon: <Clock className="w-6 h-6 text-slate-600" />,
      title: "Time-Based Interface",
      description: "Adaptive interface that changes throughout the day to match your schedule"
    }
  ];

  const flowSteps = [
    {
      step: 1,
      title: "Location & Weather",
      description: "Automatic location detection with current weather analysis",
      icon: <MapPin className="w-5 h-5" />
    },
    {
      step: 2,
      title: "Personalized Recommendations",
      description: "Meal and health suggestions based on conditions and preferences",
      icon: <Utensils className="w-5 h-5" />
    },
    {
      step: 3,
      title: "Schedule Optimization",
      description: "Task analysis and scheduling recommendations",
      icon: <Brain className="w-5 h-5" />
    },
    {
      step: 4,
      title: "Dashboard Overview",
      description: "Unified view of all your daily information",
      icon: <Monitor className="w-5 h-5" />
    },
    {
      step: 5,
      title: "Real-time Updates",
      description: "Dynamic interface that adapts throughout your day",
      icon: <Clock className="w-5 h-5" />
    }
  ];

  const technologies = [
    { name: "Weather API", desc: "Real-time weather data integration" },
    { name: "Machine Learning", desc: "Pattern recognition and recommendations" },
    { name: "Geolocation", desc: "Precise location-based services" },
    { name: "Real-time Sync", desc: "Live data updates and notifications" },
    { name: "Local Data", desc: "Regional content and preferences" },
    { name: "Health Metrics", desc: "Personal wellness tracking" }
  ];

  return (
      <div className="min-h-screen bg-white">
      
<div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100">
  {/* Background decoration */}
  <div className="absolute inset-0">
    <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
    <div className="absolute bottom-20 right-10 w-72 h-72 bg-gradient-to-r from-purple-400 to-indigo-600 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
  </div>
  
  <div className="relative max-w-6xl mx-auto px-6 py-24">
    <div className="text-center">
      <div className="flex justify-center mb-8">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl shadow-blue-500/25">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          {/* Floating accent */}
          <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce"></div>
        </div>
      </div>
      
      <h1 className="text-6xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 mb-6 tracking-tight leading-tight">
        Daily Dashboard
      </h1>
      
      <div className="relative inline-block mb-6">
        <p className="text-xl text-blue-600 font-semibold mb-2 relative z-10">
          Intelligent Life Management Platform
        </p>
        {/* Underline decoration */}
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
      </div>
      
      <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
        Streamline your daily routine with weather-aware planning, 
        health insights, and personalized recommendations powered by intelligent automation
      </p>
      
      <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
        <button className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2">
          <span>View Demo</span>
          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          {/* Shine effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>
        
        <button className="relative border-2 border-blue-200 text-blue-700 px-10 py-4 rounded-2xl font-semibold hover:border-purple-300 hover:text-purple-700 transition-all duration-300 backdrop-blur-sm bg-white/50 hover:bg-white/70">
          Learn More
        </button>
      </div>
      
      {/* Stats or badges */}
      <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>10K+ Active Users</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse delay-300"></div>
          <span>99.9% Uptime</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse delay-700"></div>
          <span>24/7 Support</span>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Features Section */}
<div className="relative py-24 bg-gradient-to-b from-white to-blue-50">
  <div className="max-w-6xl mx-auto px-6">
    <div className="text-center mb-20">
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-2 rounded-full mb-6">
        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        <span className="text-blue-700 font-medium text-sm uppercase tracking-wide">Features</span>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
        Everything you need for
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          smarter daily planning
        </span>
      </h2>
      
      <p className="text-xl text-slate-600 max-w-2xl mx-auto">
        Powerful features designed to optimize your daily routine and boost productivity
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <div 
          key={index} 
          className={`group relative bg-white rounded-3xl p-8 border transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 transform hover:-translate-y-2 ${
            currentFeature === index 
              ? 'border-blue-200 shadow-xl shadow-blue-500/20 bg-gradient-to-br from-white to-blue-50' 
              : 'border-slate-100 hover:border-blue-200'
          }`}
        >
          {/* Gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Active indicator */}
          {currentFeature === index && (
            <div className="absolute top-4 right-4 w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse"></div>
          )}
          
          <div className="relative z-10">
            <div className="flex items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mr-4 transition-all duration-300 group-hover:scale-110 ${
                currentFeature === index 
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500 shadow-lg shadow-blue-500/25' 
                  : 'bg-gradient-to-br from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200'
              }`}>
                <div className={`${currentFeature === index ? 'text-white' : 'text-blue-600'}`}>
                  {feature.icon}
                </div>
              </div>
              
              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">
                  {feature.title}
                </h3>
                <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mb-3 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
              </div>
            </div>
            
            <p className="text-slate-600 leading-relaxed group-hover:text-slate-700 transition-colors">
              {feature.description}
            </p>
          </div>
          
          {/* Corner decoration */}
          <div className="absolute bottom-0 right-0 w-20 h-20 bg-gradient-to-tl from-blue-500/10 to-transparent rounded-tl-3xl rounded-br-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
      ))}
    </div>
    
    {/* Bottom decoration */}
    <div className="text-center mt-16">
      <div className="inline-flex items-center space-x-2 text-slate-400">
        <div className="w-16 h-px bg-gradient-to-r from-transparent to-slate-300"></div>
        <span className="text-sm font-medium">And much more</span>
        <div className="w-16 h-px bg-gradient-to-l from-transparent to-slate-300"></div>
      </div>
    </div>
  </div>
</div>
      {/* How it Works Section */}
<div className="relative py-24 bg-gradient-to-b from-blue-50 to-white overflow-hidden">
  {/* Background decoration */}
  <div className="absolute top-10 right-10 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
  
  <div className="relative max-w-6xl mx-auto px-6">
    <div className="text-center mb-20">
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-2 rounded-full mb-6">
        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        <span className="text-blue-700 font-medium text-sm uppercase tracking-wide">Process</span>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
        How it
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          actually works
        </span>
      </h2>
      
      <p className="text-xl text-slate-600 max-w-2xl mx-auto">
        Simple, automated workflow designed for seamless daily optimization
      </p>
    </div>

    <div className="relative">
      {/* Connecting line */}
      <div className="absolute left-16 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 via-purple-500 to-indigo-500 rounded-full hidden lg:block"></div>
      
      <div className="space-y-12">
        {flowSteps.map((step, index) => (
          <div key={index} className="relative group">
            <div className="flex items-start space-x-8">
              {/* Step Number */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25 transform group-hover:scale-110 transition-all duration-300">
                  <span className="text-white font-bold text-lg">{step.step}</span>
                </div>
                {/* Connecting dot */}
                <div className="absolute top-1/2 -left-2 w-2 h-2 bg-white border-4 border-blue-500 rounded-full hidden lg:block"></div>
              </div>
              
              {/* Content */}
              <div className="flex-1 bg-white rounded-3xl p-8 border border-blue-100 shadow-lg shadow-blue-500/5 group-hover:shadow-xl group-hover:shadow-blue-500/10 transition-all duration-300 transform group-hover:-translate-y-1">
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mr-4 group-hover:from-blue-200 group-hover:to-purple-200 transition-colors duration-300">
                    <div className="text-blue-600">
                      {step.icon}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">
                      {step.title}
                    </h3>
                    <div className="w-16 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  </div>
                </div>
                <p className="text-lg text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
</div>

{/* Timeline Section */}
<div className="relative py-24 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 overflow-hidden">
  {/* Background decoration */}
  <div className="absolute inset-0">
    <div className="absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
    <div className="absolute bottom-20 right-20 w-72 h-72 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
  </div>
  
  <div className="relative max-w-6xl mx-auto px-6">
    <div className="text-center mb-20">
      <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm px-6 py-2 rounded-full mb-6 border border-white/20">
        <div className="w-2 h-2 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"></div>
        <span className="text-blue-200 font-medium text-sm uppercase tracking-wide">Timeline</span>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
        Adaptive
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
          Daily Interface
        </span>
      </h2>
      
      <p className="text-xl text-blue-100 max-w-2xl mx-auto">
        Smart interface that evolves with your daily rhythm and preferences
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="group relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-400/20 to-orange-400/20 rounded-2xl flex items-center justify-center mr-4 group-hover:from-yellow-400/30 group-hover:to-orange-400/30 transition-colors duration-300">
              <Sun className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Morning</h3>
              <div className="w-12 h-1 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
            </div>
          </div>
          <ul className="space-y-4 text-blue-100">
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Weather overview & outfit suggestions</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Daily task prioritization</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Health recommendations</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="group relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400/20 to-red-400/20 rounded-2xl flex items-center justify-center mr-4 group-hover:from-orange-400/30 group-hover:to-red-400/30 transition-colors duration-300">
              <Sun className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Afternoon</h3>
              <div className="w-12 h-1 bg-gradient-to-r from-orange-400 to-red-400 rounded-full"></div>
            </div>
          </div>
          <ul className="space-y-4 text-blue-100">
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Progress tracking</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Lunch recommendations</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
              <span>Break reminders</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="group relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:bg-white/10 transition-all duration-300 transform hover:-translate-y-2">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        
        <div className="relative z-10">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-400/20 to-indigo-400/20 rounded-2xl flex items-center justify-center mr-4 group-hover:from-purple-400/30 group-hover:to-indigo-400/30 transition-colors duration-300">
              <Moon className="w-8 h-8 text-purple-400" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">Evening</h3>
              <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full"></div>
            </div>
          </div>
          <ul className="space-y-4 text-blue-100">
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Daily summary & insights</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Health data analysis</span>
            </li>
            <li className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
              <span>Tomorrow's preparation</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>

{/* Technology Stack */}
<div className="relative py-24 bg-gradient-to-b from-slate-50 to-blue-50 overflow-hidden">
  <div className="absolute bottom-10 left-10 w-64 h-64 bg-gradient-to-r from-purple-400 to-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10"></div>
  
  <div className="relative max-w-6xl mx-auto px-6">
    <div className="text-center mb-20">
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 px-6 py-2 rounded-full mb-6">
        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        <span className="text-blue-700 font-medium text-sm uppercase tracking-wide">Technology</span>
      </div>
      
      <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
        Built with
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
          modern technology
        </span>
      </h2>
      
      <p className="text-xl text-slate-600 max-w-2xl mx-auto">
        Powered by cutting-edge technologies for reliability and performance
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {technologies.map((tech, index) => (
        <div key={index} className="group bg-white rounded-2xl p-6 border border-blue-100 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex items-start mb-4">
            <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mr-4 mt-1 group-hover:scale-125 transition-transform duration-300"></div>
            <div className="flex-1">
              <h3 className="text-slate-900 font-bold text-lg mb-2 group-hover:text-blue-900 transition-colors">
                {tech.name}
              </h3>
              <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 mb-3"></div>
              <p className="text-slate-600 leading-relaxed">
                {tech.desc}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

{/* CTA Section */}
<div className="relative py-24 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 overflow-hidden">
  {/* Background decoration */}
  <div className="absolute inset-0">
    <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full mix-blend-screen filter blur-3xl animate-pulse"></div>
    <div className="absolute bottom-10 right-10 w-72 h-72 bg-white/10 rounded-full mix-blend-screen filter blur-3xl animate-pulse delay-1000"></div>
  </div>
  
  <div className="relative max-w-4xl mx-auto text-center px-6">
    <div className="mb-8">
      <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
        Ready to optimize your
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-purple-200">
          daily routine?
        </span>
      </h2>
      
      <p className="text-xl text-blue-100 mb-12 max-w-2xl mx-auto">
        Join thousands of professionals who are already experiencing smarter daily planning
      </p>
    </div>
    
    <div className="flex flex-col sm:flex-row justify-center gap-6">
      <button className="group relative bg-white text-blue-600 px-10 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all duration-300 transform hover:scale-105 shadow-xl shadow-black/20 flex items-center justify-center space-x-2">
        <span>Get Started</span>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
      </button>
      
      <button className="relative border-2 border-white/30 text-white px-10 py-4 rounded-2xl font-bold hover:border-white/50 hover:bg-white/10 transition-all duration-300 backdrop-blur-sm">
        Schedule Demo
      </button>
    </div>
    
    {/* Trust indicators */}
    <div className="flex flex-wrap justify-center gap-8 mt-12 text-sm text-blue-200">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span>Enterprise Ready</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse delay-300"></div>
        <span>GDPR Compliant</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-700"></div>
        <span>24/7 Support</span>
      </div>
    </div>
  </div>
</div>

{/* Footer */}
<footer className="relative bg-slate-900 py-16 overflow-hidden">
  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-500"></div>
  
  <div className="relative max-w-6xl mx-auto px-6">
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
          <Calendar className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <h3 className="text-2xl font-bold text-white mb-2">Daily Dashboard</h3>
      <p className="text-blue-200 mb-8 text-lg">Intelligent Life Management Platform</p>
      
      <div className="flex justify-center space-x-6 mb-8">
        <div className="w-12 h-px bg-gradient-to-r from-transparent to-blue-500"></div>
        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
        <div className="w-12 h-px bg-gradient-to-l from-transparent to-purple-500"></div>
      </div>
      
      <p className="text-slate-400 text-sm">
        © 2025 Daily Dashboard. All rights reserved. Made with ❤️ for productivity enthusiasts.
      </p>
    </div>
  </div>
</footer>
    </div>
  );
};

export default DailyDashboardLanding;