import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Industry, CompanySize } from '../../types';
import { Building2, Users, Shield } from 'lucide-react';

const industries: Industry[] = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'];
const companySizes: CompanySize[] = ['Small', 'Medium', 'Large'];

export default function OrganizationProfile() {
  const { state, dispatch } = useSimulation();

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-4">
      {/* Industry Selection */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-sm border border-blue-100 overflow-hidden">
        <div className="p-3 bg-gradient-to-br from-blue-50 to-blue-100 border-b border-blue-100">
          <div className="flex items-center text-blue-600">
            <Building2 className="w-4 h-4 mr-2" />
            <h2 className="font-semibold">Industry</h2>
          </div>
        </div>
        
        <div className="p-3">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {industries.map((industry) => (
              <button
                key={industry}
                onClick={() => dispatch({ type: 'SET_INDUSTRY', payload: industry })}
                className={`group flex items-center p-2 rounded-lg transition-all duration-200 ${
                  state.industry === industry
                    ? 'bg-blue-50 border border-blue-200'
                    : 'hover:bg-blue-50/50 border border-transparent'
                }`}
              >
                <div className={`mr-2 ${
                  state.industry === industry ? 'text-blue-600' : 'text-gray-400 group-hover:text-blue-600'
                }`}>
                  <Shield className="w-5 h-5" />
                </div>
                <p className={`text-sm font-medium ${
                  state.industry === industry ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'
                }`}>
                  {industry}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Company Size */}
      <div className="bg-white/80 backdrop-blur-lg rounded-xl shadow-sm border border-indigo-100 overflow-hidden">
        <div className="p-3 bg-gradient-to-br from-indigo-50 to-indigo-100 border-b border-indigo-100">
          <div className="flex items-center text-indigo-600">
            <Users className="w-4 h-4 mr-2" />
            <h2 className="font-semibold">Company Size</h2>
          </div>
        </div>
        
        <div className="p-3">
          <div className="grid grid-cols-3 gap-2">
            {companySizes.map((size) => (
              <button
                key={size}
                onClick={() => dispatch({ type: 'SET_COMPANY_SIZE', payload: size })}
                className={`group flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                  state.companySize === size
                    ? 'bg-indigo-50 border border-indigo-200'
                    : 'hover:bg-indigo-50/50 border border-transparent'
                }`}
              >
                <span className={`text-sm font-medium ${
                  state.companySize === size ? 'text-indigo-600' : 'text-gray-700'
                }`}>
                  {size}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}