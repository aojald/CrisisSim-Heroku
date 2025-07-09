import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import { CheckCircle, Circle } from 'lucide-react';

export default function ProgressIndicator() {
  const { state } = useSimulation();
  const { currentScenario, currentPlayerId, players } = state;

  if (!currentScenario || !currentPlayerId) return null;

  const currentPlayer = players.find(p => p.id === currentPlayerId);
  if (!currentPlayer) return null;

  const totalSteps = currentScenario.timeline.length;
  const currentStep = currentPlayer.currentStep;
  const progress = Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex flex-col items-center space-y-2">
        <div className="flex items-center space-x-2">
          {currentScenario.timeline.map((_, index) => (
            <div
              key={index}
              className="relative group"
            >
              {index < currentStep ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : index === currentStep ? (
                <Circle className="w-5 h-5 text-blue-500 animate-pulse" />
              ) : (
                <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600" />
              )}
              <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block">
                <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                  Decision {index + 1} of {totalSteps}
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="font-medium text-gray-600 dark:text-gray-300">
            Progress: {progress}%
          </span>
          <span className="text-gray-400 dark:text-gray-500">•</span>
          <span className="text-gray-600 dark:text-gray-300">
            Decision {currentStep + 1} of {totalSteps}
          </span>
        </div>
      </div>
    </div>
  );
}