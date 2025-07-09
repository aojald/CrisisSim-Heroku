import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import ScenarioEditor from './ScenarioEditor';
import ScenarioUpload from './ScenarioUpload';
import AdminUserManager from './AdminUserManager';
import { Scenario } from '../../types';
import { Settings, Plus, List, Upload, FileText, Users, ArrowLeft } from 'lucide-react';
import { loadScenarios, saveScenario, clearCache } from '../../utils/scenarioManager';

type View = 'list' | 'editor' | 'upload' | 'new' | 'users';

interface AdminPanelProps {
  onBack?: () => void;
}

export default function AdminPanel({ onBack }: AdminPanelProps) {
  const { state, dispatch } = useSimulation();
  const [view, setView] = useState<View>('list');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Get current user info from localStorage
  const currentUser = React.useMemo(() => {
    try {
      const userInfo = localStorage.getItem('crisis_sim_user_info');
      return userInfo ? JSON.parse(userInfo) : { username: 'unknown', role: 'user' };
    } catch {
      return { username: 'unknown', role: 'user' };
    }
  }, []);

  useEffect(() => {
    async function loadAllScenarios() {
      setLoading(true);
      try {
        clearCache(); // Always clear cache before loading
        const loadedScenarios = await loadScenarios();
        setScenarios(loadedScenarios);
      } catch (error) {
        console.error('Error loading scenarios:', error);
      } finally {
        setLoading(false);
      }
    }

    if (view === 'list') {
      loadAllScenarios();
    }
  }, [view]);

  const handleScenarioSave = async (updatedScenario: Scenario) => {
    try {
      const success = await saveScenario(updatedScenario);
      if (success) {
        clearCache(); // Clear cache to force reload
        const updatedScenarios = await loadScenarios();
        setScenarios(updatedScenarios);
        dispatch({ type: 'RESET_SCENARIO' }); // Reset simulation state
        setView('list');
      } else {
        console.error('Failed to save scenario');
      }
    } catch (error) {
      console.error('Error saving scenario:', error);
    }
  };

  const handleScenarioUpload = async (uploadedScenarios: Scenario[]) => {
    const updatedScenarios = await loadScenarios();
    setScenarios(updatedScenarios);
    setView('list');
  };

  const handleCreateNew = () => {
    const newScenario: Scenario = {
      id: `scenario-${Date.now()}`,
      type: 'Ransomware',
      title: 'New Scenario',
      description: '',
      industry: [],
      companySize: [],
      severity: 'Medium',
      timeline: [],
      regulatoryRequirements: [],
      prerequisites: [],
      supportingDocuments: []
    };
    dispatch({ type: 'SET_SCENARIO', payload: newScenario });
    setView('editor');
  };

  const renderNavigation = () => (
    <div className="bg-white shadow-md rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex space-x-4">
          <button
            onClick={() => setView('list')}
            className={`btn ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <List className="w-4 h-4 mr-2" />
            Scenarios
          </button>
          <button
            onClick={() => setView('upload')}
            className={`btn ${view === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import YAML
          </button>
          <button
            onClick={handleCreateNew}
            className={`btn ${view === 'new' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New
          </button>
          <button
            onClick={() => setView('users')}
            className={`btn ${view === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          >
            <Users className="w-4 h-4 mr-2" />
            Users
          </button>
        </div>
        
        {onBack && (
          <button
            onClick={onBack}
            className="btn btn-secondary flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main Menu
          </button>
        )}
      </div>
    </div>
  );

  const renderScenarioList = () => (
    <div className="space-y-4">
      {scenarios.map((scenario) => (
        <div
          key={scenario.id}
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {scenario.title}
              </h3>
              <p className="text-gray-600 mb-4">{scenario.description}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  {scenario.timeline.length} Decision Points
                </span>
                <span className="px-2 py-1 bg-gray-100 rounded-full">
                  {scenario.type}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                dispatch({ type: 'SET_SCENARIO', payload: scenario });
                setView('editor');
              }}
              className="btn btn-primary"
            >
              <Settings className="w-4 h-4 mr-2" />
              Edit
            </button>
          </div>
        </div>
      ))}

      {scenarios.length === 0 && !loading && (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Scenarios Found
          </h3>
          <p className="text-gray-600">
            Create a new scenario or import existing ones to get started.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold text-gray-900">
          {view === 'users' ? 'User Management' : 'Scenario Editor'}
        </h2>
      </div>

      {renderNavigation()}

      {view === 'list' && renderScenarioList()}
      
      {view === 'upload' && (
        <ScenarioUpload onScenarioUpload={handleScenarioUpload} />
      )}
      
      {(view === 'editor' || view === 'new') && state.currentScenario && (
        <ScenarioEditor
          scenario={state.currentScenario}
          onSave={handleScenarioSave}
          onCancel={() => {
            dispatch({ type: 'RESET_SCENARIO' });
            setView('list');
          }}
        />
      )}
      
      {view === 'users' && (
        <AdminUserManager currentUser={currentUser} />
      )}
    </div>
  );
}