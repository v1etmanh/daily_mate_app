import React from 'react';
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  MapPin, 
  FileText, 
  Stethoscope,
  AlertCircle,
  Info
} from 'lucide-react';

const HealthAssessmentDisplay = ({ healthAssessment }) => {
  if (!healthAssessment) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">No health assessment data available</p>
        </div>
      </div>
    );
  }

  const getEmergencyLevelColor = (level) => {
    switch (level?.toLowerCase()) {
      case 'cao':
      case 'high':
        return {
          bg: 'bg-red-100',
          text: 'text-red-800',
          border: 'border-red-200',
          icon: <AlertTriangle className="h-5 w-5" />
        };
      case 'trung bình':
      case 'medium':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          border: 'border-yellow-200',
          icon: <Clock className="h-5 w-5" />
        };
      case 'thấp':
      case 'low':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          border: 'border-green-200',
          icon: <CheckCircle className="h-5 w-5" />
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          border: 'border-gray-200',
          icon: <Info className="h-5 w-5" />
        };
    }
  };

  const getLikelihoodColor = (likelihood) => {
    switch (likelihood?.toLowerCase()) {
      case 'cao':
      case 'high':
        return 'bg-red-500';
      case 'trung bình':
      case 'medium':
        return 'bg-yellow-500';
      case 'thấp':
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const emergencyStyle = getEmergencyLevelColor(healthAssessment.emergencyLevel);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Stethoscope className="h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Health Assessment Report</h1>
            <p className="text-blue-100">Assessment ID: #{healthAssessment.healthId}</p>
          </div>
        </div>
      </div>

      <div className="border border-t-0 border-gray-200 rounded-b-xl">
        {/* Patient Information */}
        {healthAssessment.user && (
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-800">Patient Information</h2>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">{healthAssessment.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{healthAssessment.user.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Symptoms Section */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Reported Symptoms</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Affected Body Part</h3>
              <p className="text-blue-700 text-lg font-medium">{healthAssessment.bodyPart}</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-2">
                <FileText className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-800 mb-2">Symptom Description</h3>
                  <p className="text-gray-700">{healthAssessment.symptomDescription}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Level */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-800">Emergency Assessment</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${emergencyStyle.bg} ${emergencyStyle.border} rounded-lg p-4 border`}>
              <div className="flex items-center gap-2 mb-2">
                {emergencyStyle.icon}
                <h3 className={`font-semibold ${emergencyStyle.text}`}>Emergency Level</h3>
              </div>
              <p className={`text-lg font-bold ${emergencyStyle.text}`}>
                {healthAssessment.emergencyLevel}
              </p>
            </div>
            
            <div className={`${healthAssessment.recommendSeeDoctor ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'} rounded-lg p-4 border`}>
              <div className="flex items-center gap-2 mb-2">
                <Stethoscope className={`h-5 w-5 ${healthAssessment.recommendSeeDoctor ? 'text-red-600' : 'text-green-600'}`} />
                <h3 className={`font-semibold ${healthAssessment.recommendSeeDoctor ? 'text-red-800' : 'text-green-800'}`}>
                  Doctor Recommendation
                </h3>
              </div>
              <p className={`text-lg font-medium ${healthAssessment.recommendSeeDoctor ? 'text-red-700' : 'text-green-700'}`}>
                {healthAssessment.recommendSeeDoctor ? 'See a doctor immediately' : 'Monitor symptoms'}
              </p>
            </div>
          </div>
        </div>

        {/* Possible Conditions */}
        {healthAssessment.possibleConditions && healthAssessment.possibleConditions.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Possible Conditions</h2>
            <div className="space-y-4">
              {healthAssessment.possibleConditions.map((condition) => (
                <div key={condition.possID} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg">{condition.name}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Likelihood:</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-3 h-3 rounded-full ${getLikelihoodColor(condition.likelihood)}`}></div>
                        <span className="text-sm font-medium text-gray-700">{condition.likelihood}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{condition.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Actions */}
        {healthAssessment.suggestedActions && healthAssessment.suggestedActions.length > 0 && (
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recommended Actions</h2>
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <ul className="space-y-3">
                {healthAssessment.suggestedActions.map((action, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="bg-blue-500 text-white rounded-full p-1 mt-0.5">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                    <span className="text-blue-800 font-medium">{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>This assessment is for informational purposes only and should not replace professional medical advice.</p>
      </div>
    </div>
  );
};

export default HealthAssessmentDisplay;