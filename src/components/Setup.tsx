import React, { useState } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Link, Shield, Users, BookOpen, Lightbulb, HelpCircle, GraduationCap, ArrowRight, X, Edit } from 'lucide-react';
import Tutorial from './tutorial/Tutorial';
import RoleBriefing from './tutorial/RoleBriefing';
import CyberGuide from './tutorial/CyberGuide';
import JoinModal from './JoinModal';
import ConfigureSimulation from './setup/ConfigureSimulation';
import AdminPanel from './admin/AdminPanel';
import wsClient from '../utils/socket';

export default function Setup() {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showRoleBriefing, setShowRoleBriefing] = useState(false);
  const [showCyberGuide, setShowCyberGuide] = useState(false);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [code, setCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showConfigureSimulation, setShowConfigureSimulation] = useState(false);
  const [showEditScenario, setShowEditScenario] = useState(false);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    try {
      const upperCode = code.toUpperCase();

      // Simply redirect to join page with code - the join page will validate
      window.location.href = `?code=${upperCode}`;
      
    } catch (error) {
      setJoinError('Failed to process code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4 py-8 animate-slide-up">
      {/* Learning Resources Bar */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-600 to-violet-600 shadow-lg mb-8">
        <div className="max-w-7xl mx-auto py-3 px-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <GraduationCap className="w-5 h-5 text-white/90 mr-2" />
              <h2 className="text-lg font-semibold text-white">Learning Resources</h2>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowTutorial(true)}
                className="flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Tutorial
              </button>
              <button
                onClick={() => setShowRoleBriefing(true)}
                className="flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Role Briefing
              </button>
              <button
                onClick={() => setShowCyberGuide(true)}
                className="flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                <HelpCircle className="w-4 h-4 mr-2" />
                Cyber Guide
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600">
            Executive Cyber Crisis Simulator
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join an existing simulation or create a new one to test your crisis management skills
          </p>
        </div>

        {!showConfigureSimulation && !showEditScenario && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {/* Join Existing */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-blue-200 hover:border-blue-300 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex flex-col items-center mb-6">
                <div className="p-4 bg-blue-50 rounded-full mb-4">
                  <Link className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 text-center">Join Existing</h2>
                <p className="text-gray-600 mt-2 text-center">Connect to an active simulation</p>
              </div>
              {showJoinInput ? (
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={code}
                      onChange={(e) => {
                        setCode(e.target.value.toUpperCase());
                        setJoinError(null);
                      }}
                      placeholder="Enter simulation code"
                      className={`w-full px-4 py-3 text-lg border-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                        joinError ? 'border-red-300' : 'border-gray-300'
                      }`}
                      maxLength={6}
                    />
                    {joinError && (
                      <div className="absolute -bottom-6 left-0 text-xs text-red-500 mt-1">
                        {joinError}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 mt-8">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 py-3 text-lg"
                      disabled={!code.trim()}
                    >
                      <ArrowRight className="w-5 h-5 mr-2" />
                      Join
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowJoinInput(false);
                        setJoinError(null);
                        setCode('');
                      }}
                      className="btn btn-secondary py-3"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setShowJoinInput(true)}
                  className="w-full btn btn-primary flex items-center justify-center py-4 text-lg"
                >
                  <Link className="w-5 h-5 mr-2" />
                  Enter Code
                </button>
              )}
            </div>

            {/* Create New */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-violet-200 hover:border-violet-300 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex flex-col items-center mb-6">
                <div className="p-4 bg-violet-50 rounded-full mb-4">
                  <Shield className="w-10 h-10 text-violet-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 text-center">Create New</h2>
                <p className="text-gray-600 mt-2 text-center">Start a new crisis simulation</p>
              </div>
              <button
                onClick={() => setShowConfigureSimulation(true)}
                className="w-full btn btn-primary bg-violet-600 hover:bg-violet-700 flex items-center justify-center py-4 text-lg"
              >
                <Shield className="w-5 h-5 mr-2" />
                Configure Simulation
              </button>
            </div>

            {/* Edit Scenario */}
            <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-green-200 hover:border-green-300 hover:shadow-xl transition-all duration-200 transform hover:-translate-y-1">
              <div className="flex flex-col items-center mb-6">
                <div className="p-4 bg-green-50 rounded-full mb-4">
                  <Edit className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-semibold text-gray-900 text-center">Edit Scenario</h2>
                <p className="text-gray-600 mt-2 text-center">Create or modify scenarios</p>
              </div>
              <button
                onClick={() => setShowEditScenario(true)}
                className="w-full btn btn-primary bg-green-600 hover:bg-green-700 flex items-center justify-center py-4 text-lg"
              >
                <Edit className="w-5 h-5 mr-2" />
                Scenario Editor
              </button>
            </div>
          </div>
        )}

        {/* Configure Simulation Section */}
        {showConfigureSimulation && (
          <ConfigureSimulation onBack={() => setShowConfigureSimulation(false)} />
        )}

        {/* Edit Scenario Section */}
        {showEditScenario && (
          <AdminPanel onBack={() => setShowEditScenario(false)} />
        )}
      </div>

      {/* Modals */}
      {showTutorial && <Tutorial onClose={() => setShowTutorial(false)} />}
      {showRoleBriefing && <RoleBriefing onClose={() => setShowRoleBriefing(false)} />}
      {showCyberGuide && <CyberGuide onClose={() => setShowCyberGuide(false)} />}
    </div>
  );
}