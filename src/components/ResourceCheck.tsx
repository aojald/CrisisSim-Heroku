import React from 'react';
import { CheckSquare, Square, AlertCircle, PenTool as Tool, FileText, Users, FileCheck, Shield } from 'lucide-react';
import { Resource } from '../types';

interface Props {
  resources: Resource[];
  selectedResources: string[];
  onResourceToggle: (resourceId: string) => void;
}

const getResourceIcon = (type: Resource['type']) => {
  switch (type) {
    case 'tool':
      return <Tool className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
    case 'procedure':
      return <FileText className="w-4 h-4 text-green-600 dark:text-green-400" />;
    case 'contact':
      return <Users className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
    case 'documentation':
      return <FileCheck className="w-4 h-4 text-orange-600 dark:text-orange-400" />;
    case 'clearance':
      return <Shield className="w-4 h-4 text-red-600 dark:text-red-400" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />;
  }
};

export default function ResourceCheck({ resources = [], selectedResources = [], onResourceToggle }: Props) {
  if (!resources || resources.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center mb-4">
        <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 flex-shrink-0" />
        <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 break-normal">
          Which resources would you have access to in this situation?
        </h3>
      </div>

      <div className="space-y-3">
        {resources.map((resource) => (
          <div
            key={resource.id}
            className="flex items-start p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
            onClick={() => onResourceToggle(resource.id)}
          >
            <div className="flex-shrink-0 mr-3 mt-1">
              {getResourceIcon(resource.type)}
            </div>
            <div className="flex-grow min-w-0 mr-4">
              <div className="flex items-center flex-wrap gap-2">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {resource.name}
                </p>
                {resource.required && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full">
                    Required
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                {resource.description}
              </p>
            </div>
            <div className="flex-shrink-0">
              <button
                className={`flex items-center justify-center px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  selectedResources.includes(resource.id)
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700'
                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {selectedResources.includes(resource.id) ? (
                  <>
                    <CheckSquare className="w-3 h-3 mr-1.5" />
                    Yes
                  </>
                ) : (
                  <>
                    <Square className="w-3 h-3 mr-1.5" />
                    No
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}