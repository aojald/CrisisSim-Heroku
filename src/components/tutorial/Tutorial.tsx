import React from 'react';
import { X, ChevronRight, AlertTriangle, Shield, Users, Clock, Target, FileText, Brain, Zap, BarChart as Chart } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const objectives = [
  {
    title: 'Executive Crisis Readiness',
    description: 'Develop and validate C-level decision-making capabilities in high-pressure cyber crisis scenarios.',
    icon: <Brain className="w-6 h-6 text-blue-600 dark:text-blue-400" />
  },
  {
    title: 'Real-world Simulation',
    description: 'Experience industry-specific cyber incidents with stakeholder pressures and business impacts.',
    icon: <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
  },
  {
    title: 'Strategic Response',
    description: 'Practice balancing technical, business, and reputational considerations in your crisis decisions.',
    icon: <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
  },
  {
    title: 'Performance Analysis',
    description: 'Receive detailed feedback on decision impacts and identify areas for improvement in crisis management.',
    icon: <Chart className="w-6 h-6 text-orange-600 dark:text-orange-400" />
  }
];

const howToPlay = [
  {
    title: 'Profile Selection',
    description: 'Choose your executive role and organization profile to access relevant scenarios.',
    icon: <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
  },
  {
    title: 'Resource Assessment',
    description: 'Evaluate available resources and tools for crisis response.',
    icon: <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
  },
  {
    title: 'Decision Making',
    description: 'Make critical decisions within time constraints while considering multiple stakeholders.',
    icon: <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
  }
];

export default function Tutorial({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Welcome to Executive Cyber Crisis Simulator</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Core Objectives */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Core Objectives</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {objectives.map((objective, index) => (
                <div key={index} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
                      {objective.icon}
                    </div>
                    <h4 className="ml-3 font-medium text-gray-900 dark:text-gray-100">
                      {objective.title}
                    </h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">
                    {objective.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* How to Play */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">How to Play</h3>
            <div className="space-y-4">
              {howToPlay.map((step, index) => (
                <div key={index} className="flex items-start">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-4">
                    {step.icon}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{step.title}</h4>
                    <p className="text-gray-600 dark:text-gray-300 text-sm">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Benefits */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-6 mb-6">
            <h4 className="text-blue-800 dark:text-blue-200 font-medium mb-4">Key Benefits</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                <p className="text-blue-700 dark:text-blue-300">
                  Build confidence in crisis decision-making through hands-on experience
                </p>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                <p className="text-blue-700 dark:text-blue-300">
                  Identify gaps in crisis response capabilities and resource readiness
                </p>
              </li>
              <li className="flex items-start">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                <p className="text-blue-700 dark:text-blue-300">
                  Improve cross-functional coordination in high-pressure situations
                </p>
              </li>
            </ul>
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-100 dark:border-amber-800 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mr-3 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 dark:text-amber-200 text-sm">
                This simulator is designed to challenge your decision-making abilities in realistic crisis scenarios. Take time to consider the full impact of your choices on various stakeholders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}