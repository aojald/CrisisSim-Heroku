import React from 'react';
import { X, Shield, DollarSign, Network, MonitorSmartphone, Lock, Users, Scale, MessageSquare } from 'lucide-react';

interface Props {
  onClose: () => void;
}

const roleBriefings = {
  'CEO': {
    icon: <Shield className="w-5 h-5" />,
    responsibilities: [
      'Strategic decision-making',
      'Stakeholder management',
      'Overall crisis leadership',
      'Public face of response'
    ],
    keyConsiderations: [
      'Reputation impact',
      'Business continuity',
      'Stakeholder confidence',
      'Long-term implications'
    ]
  },
  'CFO': {
    icon: <DollarSign className="w-5 h-5" />,
    responsibilities: [
      'Financial impact assessment',
      'Resource allocation',
      'Insurance coordination',
      'Cost control'
    ],
    keyConsiderations: [
      'Immediate costs',
      'Long-term financial impact',
      'Insurance coverage',
      'Budget adjustments'
    ]
  },
  'COO': {
    icon: <Network className="w-5 h-5" />,
    responsibilities: [
      'Operational continuity',
      'Resource coordination',
      'Process adaptation',
      'Service restoration'
    ],
    keyConsiderations: [
      'Business impact',
      'Operational priorities',
      'Resource availability',
      'Recovery timeline'
    ]
  },
  'CIO': {
    icon: <MonitorSmartphone className="w-5 h-5" />,
    responsibilities: [
      'Technical response',
      'System recovery',
      'Infrastructure protection',
      'IT service continuity'
    ],
    keyConsiderations: [
      'Technical impact',
      'Recovery capabilities',
      'System dependencies',
      'Security measures'
    ]
  },
  'CISO': {
    icon: <Lock className="w-5 h-5" />,
    responsibilities: [
      'Security response',
      'Threat assessment',
      'Containment strategy',
      'Security measures'
    ],
    keyConsiderations: [
      'Attack vectors',
      'Security controls',
      'Incident scope',
      'Future prevention'
    ]
  },
  'HR Director': {
    icon: <Users className="w-5 h-5" />,
    responsibilities: [
      'Employee communication',
      'Staff welfare',
      'Workforce management',
      'Internal updates'
    ],
    keyConsiderations: [
      'Employee impact',
      'Communication needs',
      'Work arrangements',
      'Staff support'
    ]
  },
  'CLO': {
    icon: <Scale className="w-5 h-5" />,
    responsibilities: [
      'Legal compliance',
      'Regulatory reporting',
      'Legal risk management',
      'Documentation'
    ],
    keyConsiderations: [
      'Legal obligations',
      'Regulatory requirements',
      'Liability issues',
      'Evidence preservation'
    ]
  },
  'CCO': {
    icon: <MessageSquare className="w-5 h-5" />,
    responsibilities: [
      'External communication',
      'Media relations',
      'Stakeholder updates',
      'Message consistency'
    ],
    keyConsiderations: [
      'Public perception',
      'Message timing',
      'Stakeholder needs',
      'Reputation management'
    ]
  }
};

export default function RoleBriefing({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Role Briefing Materials</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(roleBriefings).map(([role, info]) => (
              <div key={role} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                      {info.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{role}</h3>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Key Responsibilities</h4>
                      <ul className="space-y-2">
                        {info.responsibilities.map((resp, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full mr-2"></div>
                            {resp}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Key Considerations</h4>
                      <ul className="space-y-2">
                        {info.keyConsiderations.map((consideration, index) => (
                          <li key={index} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                            <div className="w-1.5 h-1.5 bg-green-400 dark:bg-green-500 rounded-full mr-2"></div>
                            {consideration}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}