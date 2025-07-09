import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Scenario } from '../../types';
import { Shield, AlertCircle, AlertTriangle, ArrowRight, Search, Filter, Clock } from 'lucide-react';
import { loadScenarios } from '../../utils/scenarioManager';

interface Props {
  onSelect: (scenario: Scenario) => void;
  error: string | null;
}

export default function ScenarioSelector({ onSelect, error }: Props) {
  const { state } = useSimulation();
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchScenarios() {
      try {
        const loadedScenarios = await loadScenarios();
        setScenarios(loadedScenarios);
      } catch (error) {
        console.error('Error loading scenarios:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchScenarios();
  }, []);

  const filteredScenarios = scenarios.filter(scenario => {
    const matchesProfile = (!state.industry || scenario.industry.includes(state.industry)) &&
                          (!state.companySize || scenario.companySize.includes(state.companySize));
    const matchesSearch = searchTerm === '' || 
                         scenario.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scenario.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scenario.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesProfile && matchesSearch;
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading scenarios...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-violet-100 overflow-hidden">
      <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 border-b border-violet-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-violet-600">
            <Shield className="w-5 h-5 mr-2" />
            <h2 className="text-lg font-semibold">Available Scenarios</h2>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search scenarios..."
                className="pl-9 pr-4 py-2 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 w-64"
              />
            </div>
            {state.industry && state.companySize && (
              <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-sm font-medium">
                {filteredScenarios.length} scenario{filteredScenarios.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Active Filters */}
        {(state.industry || state.companySize) && (
          <div className="flex items-center gap-2 mt-2">
            <Filter className="w-4 h-4 text-violet-500" />
            <div className="flex gap-2">
              {state.industry && (
                <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-sm">
                  {state.industry}
                </span>
              )}
              {state.companySize && (
                <span className="px-2 py-1 bg-violet-100 text-violet-700 rounded-lg text-sm">
                  {state.companySize}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="p-4">
        {!state.industry || !state.companySize ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <AlertCircle className="w-8 h-8 text-blue-500 mx-auto mb-3" />
            <p className="text-gray-600">Select your industry and company size to view available scenarios</p>
          </div>
        ) : filteredScenarios.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <AlertTriangle className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
            <p className="text-gray-600">No scenarios available for the selected profile</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredScenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => onSelect(scenario)}
                className="w-full bg-white rounded-lg p-6 hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-violet-200 group text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-6">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-violet-600">
                        {scenario.title}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-sm font-medium bg-violet-100 text-violet-800">
                        {scenario.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {scenario.description}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1.5" />
                        {scenario.timeline.length} Decision Points
                      </div>
                      <div className="flex items-center gap-2">
                        {scenario.industry.map(ind => (
                          <span key={ind} className="px-2 py-0.5 bg-gray-100 rounded-full">
                            {ind}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-2 bg-violet-50 rounded-lg group-hover:bg-violet-100 transition-colors">
                    <ArrowRight className="w-5 h-5 text-violet-600" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-start">
            <AlertTriangle className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}