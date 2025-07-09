import React from 'react';
import { AlertCircle, CheckCircle, XCircle, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { UserResponse, Scenario, Resource } from '../../types';

interface Props {
  responses: UserResponse[];
  scenario: Scenario;
  players?: Array<{ id: string; name: string; role: string; responses: UserResponse[] }>;
}

export default function ResourceAnalysis({ responses, scenario, players = [] }: Props) {
  if (responses.length === 0) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">No responses available for resource analysis</p>
      </div>
    );
  }
  
  const getAllRequiredResources = () => {
    const resourceMap = new Map<string, Resource>();
    
    scenario.timeline.forEach(decision => {
      // Handle required resources for decisions
      if (decision.requiredResources) {
        decision.requiredResources.forEach(resource => {
          resourceMap.set(resource.id, resource);
        });
      }
    });

    return Array.from(resourceMap.values());
  };

  const getResourceAvailability = (resourceId: string) => {
    // Check if the resource was available in any decision where it was required
    let wasRequired = false;
    let wasAvailable = false;

    scenario.timeline.forEach((decision, index) => {
      if (decision.requiredResources?.some(r => r.id === resourceId)) {
        wasRequired = true;
        // Check if the resource was available in the corresponding response
        const response = responses[index];
        if (response && response.availableResources.includes(resourceId)) {
          wasAvailable = true;
        }
      }
    });

    return { wasRequired, wasAvailable };
  };

  const calculateResourceImpact = (resource: Resource) => {
    const { wasRequired, wasAvailable } = getResourceAvailability(resource.id);
    
    if (!wasRequired) {
      return {
        severity: 'low',
        impact: 'Resource was not required in any decisions',
        available: true
      };
    }

    if (resource.required && !wasAvailable) {
      return {
        severity: 'high',
        impact: 'Critical resource was not available when needed',
        available: false
      };
    }

    if (!wasAvailable) {
      return {
        severity: 'medium',
        impact: 'Optional resource was not available - consider improving accessibility',
        available: false
      };
    }

    return {
      severity: 'low',
      impact: 'Resource was available when needed',
      available: true
    };
  };

  const resources = getAllRequiredResources();

  if (resources.length === 0) {
    return (
      <div className="text-center py-6">
        <AlertCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
        <p className="text-gray-600 text-sm">No resources were required for this scenario</p>
      </div>
    );
  }

  // New function to analyze resource discrepancies between players
  const analyzeResourceDiscrepancies = () => {
    if (players.length < 2) return [];
    
    const discrepancies = [];
    const allResources = getAllRequiredResources();
    
    allResources.forEach(resource => {
      // Find decisions where this resource was required
      const relevantDecisions = scenario.timeline
        .map((decision, index) => ({ decision, index }))
        .filter(({ decision }) => 
          decision.requiredResources?.some(r => r.id === resource.id)
        );
      
      relevantDecisions.forEach(({ decision, decisionIndex }) => {
        const playerAvailability = [];
        
        players.forEach(player => {
          const response = player.responses[decisionIndex];
          if (response && response.decisionId === decision.id) {
            const hasResource = response.availableResources.includes(resource.id);
            playerAvailability.push({
              playerId: player.id,
              playerName: player.name,
              playerRole: player.role,
              hasResource
            });
          }
        });
        
        // Check if there's a discrepancy (some players have it, others don't)
        const playersWithResource = playerAvailability.filter(p => p.hasResource);
        const playersWithoutResource = playerAvailability.filter(p => !p.hasResource);
        
        if (playersWithResource.length > 0 && playersWithoutResource.length > 0) {
          discrepancies.push({
            resourceId: resource.id,
            resourceName: resource.name,
            resourceType: resource.type,
            resourceRequired: resource.required,
            decisionIndex: decisionIndex + 1,
            decisionText: decision.text,
            playersWithResource,
            playersWithoutResource,
            severity: resource.required ? 'high' : 'medium'
          });
        }
      });
    });
    
    return discrepancies;
  };

  const resourceDiscrepancies = analyzeResourceDiscrepancies();

  return (
    <div className="space-y-8">
      {/* Resource Discrepancies Section */}
      {resourceDiscrepancies.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <TrendingUp className="w-5 h-5 text-amber-600 mr-2" />
            <h4 className="text-lg font-semibold text-amber-800">Resource Availability Discrepancies</h4>
          </div>
          <p className="text-sm text-amber-700 mb-4">
            The following resources showed different availability across team members, indicating potential coordination gaps:
          </p>
          
          <div className="space-y-4">
            {resourceDiscrepancies.map((discrepancy, index) => (
              <div key={`${discrepancy.resourceId}-${discrepancy.decisionIndex}`} 
                   className={`p-4 rounded-lg border-l-4 ${
                     discrepancy.severity === 'high' 
                       ? 'border-red-500 bg-red-50' 
                       : 'border-yellow-500 bg-yellow-50'
                   }`}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {discrepancy.resourceName}
                      {discrepancy.resourceRequired && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Required
                        </span>
                      )}
                    </h5>
                    <p className="text-sm text-gray-600">Decision Point {discrepancy.decisionIndex}</p>
                  </div>
                  <AlertTriangle className={`w-5 h-5 ${
                    discrepancy.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-green-800">Had Access</span>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      {discrepancy.playersWithResource.map(player => (
                        <li key={player.playerId}>
                          {player.playerName} ({player.playerRole})
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-red-100 p-3 rounded-lg">
                    <div className="flex items-center mb-2">
                      <XCircle className="w-4 h-4 text-red-600 mr-2" />
                      <span className="text-sm font-medium text-red-800">No Access</span>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {discrepancy.playersWithoutResource.map(player => (
                        <li key={player.playerId}>
                          {player.playerName} ({player.playerRole})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Recommendation:</strong> {
                      discrepancy.severity === 'high' 
                        ? 'This critical resource discrepancy could severely impact crisis response. Ensure all team members have clear access protocols and backup procedures.'
                        : 'Consider standardizing access to this resource across all team members to improve coordination during crisis situations.'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overall Resource Analysis */}
      <div>
        <div className="flex items-center mb-4">
          <Users className="w-5 h-5 text-blue-600 mr-2" />
          <h4 className="text-lg font-semibold text-gray-900">Overall Resource Assessment</h4>
        </div>
        
      {resources.map(resource => {
        const impact = calculateResourceImpact(resource);
        
        return (
          <div key={resource.id} className="border-b border-gray-200 pb-4 last:border-0">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center">
                  <h4 className="font-medium text-gray-900">{resource.name}</h4>
                  {resource.required && (
                    <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
              </div>
              {impact.available ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>

            <div className="mt-2">
              <div className={`text-sm ${
                impact.severity === 'high' ? 'text-red-600' :
                impact.severity === 'medium' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
                {impact.impact}
              </div>
            </div>
          </div>
        );
      })}
    </div>
    </div>
  );
}