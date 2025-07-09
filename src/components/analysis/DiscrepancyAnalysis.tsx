import React from 'react';
import { AlertTriangle, Users, CheckCircle, XCircle, TrendingUp, ArrowRight } from 'lucide-react';
import { UserResponse, Scenario, Resource } from '../../types';

interface Props {
  responses: UserResponse[];
  scenario: Scenario;
  players: Array<{ id: string; name: string; role: string; responses: UserResponse[] }>;
}

interface ResourceDiscrepancy {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  resourceRequired: boolean;
  decisionIndex: number;
  decisionText: string;
  playersWithResource: Array<{
    playerId: string;
    playerName: string;
    playerRole: string;
    hasResource: boolean;
  }>;
  playersWithoutResource: Array<{
    playerId: string;
    playerName: string;
    playerRole: string;
    hasResource: boolean;
  }>;
  severity: 'high' | 'medium' | 'low';
}

interface DecisionDiscrepancy {
  decisionIndex: number;
  decisionText: string;
  playerChoices: Array<{
    playerId: string;
    playerName: string;
    playerRole: string;
    optionId: string;
    optionText: string;
    confidenceLevel: number;
    responseTime: number;
  }>;
  consensusLevel: 'high' | 'medium' | 'low';
  uniqueChoices: number;
}

export default function DiscrepancyAnalysis({ responses, scenario, players }: Props) {
  if (players.length < 2) {
    return (
      <div className="text-center py-8">
        <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Single Player Simulation
        </h3>
        <p className="text-gray-600">
          Discrepancy analysis requires multiple players to compare responses and identify coordination gaps.
        </p>
      </div>
    );
  }

  const analyzeResourceDiscrepancies = (): ResourceDiscrepancy[] => {
    const discrepancies: ResourceDiscrepancy[] = [];
    
    // Create a map to track all unique resources across all decisions
    const allResourcesMap = new Map<string, Resource>();
    
    // Collect all resources
    scenario.timeline.forEach(decision => {
      if (decision.requiredResources) {
        decision.requiredResources.forEach(resource => {
          allResourcesMap.set(resource.id, resource);
        });
      }
    });
    
    // Analyze each unique resource across all decisions where it appears
    allResourcesMap.forEach(resource => {
      scenario.timeline.forEach((decision, decisionIndex) => {
        // Check if this decision requires the current resource
        const requiresResource = decision.requiredResources?.some(r => r.id === resource.id);
        if (!requiresResource) {
          return; // Skip this decision if it doesn't require this resource
        }
      
        const playerAvailability: Array<{
          playerId: string;
          playerName: string;
          playerRole: string;
          hasResource: boolean;
        }> = [];
        
        // Check each player's response for this specific decision
        players.forEach(player => {
          // Find the response that matches this decision ID
          const response = player.responses?.find(r => r.decisionId === decision.id);
          // Only include players who actually responded to this decision
          if (response && response.decisionId === decision.id && response.availableResources) {
            const hasResource = response.availableResources.includes(resource.id);
            playerAvailability.push({
              playerId: player.id,
              playerName: player.name,
              playerRole: player.role,
              hasResource
            });
          }
        });
        
        // Only analyze if we have responses from multiple players
        if (playerAvailability.length < 2) {
          return; // Skip if only one or no players responded
        }
        
        // Check if there's a discrepancy (some have it, some don't)
        const playersWithResource = playerAvailability.filter(p => p.hasResource);
        const playersWithoutResource = playerAvailability.filter(p => !p.hasResource);
        
        // Only count as discrepancy if both groups exist
        if (playersWithResource.length > 0 && playersWithoutResource.length > 0) {
          // Check if we already have this discrepancy (avoid duplicates)
          const existingDiscrepancy = discrepancies.find(d => 
            d.resourceId === resource.id && d.decisionIndex === decisionIndex + 1
          );
          
          if (existingDiscrepancy) {
            return; // Skip duplicate
          }
          
          discrepancies.push({
            resourceId: resource.id,
            resourceName: resource.name,
            resourceType: resource.type,
            resourceRequired: resource.required,
            decisionIndex: decisionIndex + 1,
            decisionText: decision.text,
            playersWithResource,
            playersWithoutResource,
            severity: resource.required ? 'high' : 'medium' as 'high' | 'medium' | 'low'
          });
        }
      });
    });
    
    return discrepancies;
  };

  const analyzeDecisionDiscrepancies = (): DecisionDiscrepancy[] => {
    const discrepancies: DecisionDiscrepancy[] = [];
    
    scenario.timeline.forEach((decision, decisionIndex) => {
      const playerChoices = [];
      
      players.forEach(player => {
        const response = player.responses[decisionIndex];
        if (response && response.decisionId === decision.id) {
          const selectedOption = decision.options.find(opt => opt.id === response.optionId);
          if (selectedOption) {
            playerChoices.push({
              playerId: player.id,
              playerName: player.name,
              playerRole: player.role,
              optionId: response.optionId,
              optionText: selectedOption.text,
              confidenceLevel: response.confidenceLevel,
              responseTime: response.responseTime
            });
          }
        }
      });
      
      if (playerChoices.length > 1) {
        const uniqueChoices = new Set(playerChoices.map(choice => choice.optionId)).size;
        const consensusLevel = uniqueChoices === 1 ? 'high' : 
                              uniqueChoices <= Math.ceil(playerChoices.length / 2) ? 'medium' : 'low';
        
        if (consensusLevel !== 'high') {
          discrepancies.push({
            decisionIndex: decisionIndex + 1,
            decisionText: decision.text,
            playerChoices,
            consensusLevel,
            uniqueChoices
          });
        }
      }
    });
    
    return discrepancies;
  };

  const resourceDiscrepancies = analyzeResourceDiscrepancies();
  const decisionDiscrepancies = analyzeDecisionDiscrepancies();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      case 'low': return 'border-green-500 bg-green-50';
      default: return 'border-gray-500 bg-gray-50';
    }
  };

  const getConsensusColor = (consensus: string) => {
    switch (consensus) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (resourceDiscrepancies.length === 0 && decisionDiscrepancies.length === 0) {
    return (
      <div className="text-center py-8">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Excellent Team Coordination!
        </h3>
        <p className="text-gray-600 max-w-lg mx-auto">
          No significant discrepancies found between team members. Your team demonstrated strong coordination 
          in both resource availability and decision-making throughout the crisis simulation.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Resource Discrepancies</p>
              <p className="text-2xl font-bold text-blue-900">{resourceDiscrepancies.length}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Decision Discrepancies</p>
              <p className="text-2xl font-bold text-purple-900">{decisionDiscrepancies.length}</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
        
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Team Members</p>
              <p className="text-2xl font-bold text-gray-900">{players.length}</p>
            </div>
            <Users className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Resource Discrepancies */}
      {resourceDiscrepancies.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <TrendingUp className="w-6 h-6 text-orange-600 mr-2" />
            <h4 className="text-xl font-semibold text-gray-900">Resource Availability Discrepancies</h4>
          </div>
          <p className="text-gray-600 mb-6">
            These resources showed different availability across team members, indicating potential coordination gaps:
          </p>
          
          <div className="space-y-6">
            {resourceDiscrepancies.map((discrepancy, index) => (
              <div key={`${discrepancy.resourceId}-${discrepancy.decisionIndex}`} 
                   className={`p-6 rounded-lg border-l-4 ${getSeverityColor(discrepancy.severity)}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h5 className="text-lg font-semibold text-gray-900 mb-1">
                      {discrepancy.resourceName}
                      {discrepancy.resourceRequired && (
                        <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Required
                        </span>
                      )}
                    </h5>
                    <p className="text-sm text-gray-600 mb-2">
                      <strong>Decision Point {discrepancy.decisionIndex}:</strong> {discrepancy.decisionText.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      Resource Type: {discrepancy.resourceType}
                    </p>
                  </div>
                  <AlertTriangle className={`w-6 h-6 ${
                    discrepancy.severity === 'high' ? 'text-red-500' : 'text-yellow-500'
                  }`} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-800">Had Access ({discrepancy.playersWithResource.length})</span>
                    </div>
                    <div className="space-y-2">
                      {discrepancy.playersWithResource.map(player => (
                        <div key={player.playerId} className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="text-sm font-medium text-gray-900">{player.playerName}</span>
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{player.playerRole}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="bg-red-100 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      <XCircle className="w-5 h-5 text-red-600 mr-2" />
                      <span className="font-medium text-red-800">No Access ({discrepancy.playersWithoutResource.length})</span>
                    </div>
                    <div className="space-y-2">
                      {discrepancy.playersWithoutResource.map(player => (
                        <div key={player.playerId} className="flex items-center justify-between bg-white p-2 rounded">
                          <span className="text-sm font-medium text-gray-900">{player.playerName}</span>
                          <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">{player.playerRole}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Impact:</strong> {
                      discrepancy.severity === 'high' 
                        ? 'This critical resource discrepancy could severely impact crisis response effectiveness. Immediate action needed to ensure all team members have clear access protocols.'
                        : 'This resource discrepancy may cause coordination delays. Consider standardizing access procedures across all team members.'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Decision Discrepancies */}
      {decisionDiscrepancies.length > 0 && (
        <div>
          <div className="flex items-center mb-4">
            <Users className="w-6 h-6 text-purple-600 mr-2" />
            <h4 className="text-xl font-semibold text-gray-900">Decision Choice Discrepancies</h4>
          </div>
          <p className="text-gray-600 mb-6">
            These decisions showed varying responses across team members, indicating different perspectives or priorities:
          </p>
          
          <div className="space-y-6">
            {decisionDiscrepancies.map((discrepancy, index) => (
              <div key={`decision-${discrepancy.decisionIndex}`} 
                   className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h5 className="text-lg font-semibold text-gray-900 mb-2">
                      Decision Point {discrepancy.decisionIndex}
                    </h5>
                    <p className="text-gray-700 mb-3">{discrepancy.decisionText}</p>
                    <div className="flex items-center space-x-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getConsensusColor(discrepancy.consensusLevel)}`}>
                        {discrepancy.consensusLevel.charAt(0).toUpperCase() + discrepancy.consensusLevel.slice(1)} Consensus
                      </span>
                      <span className="text-sm text-gray-600">
                        {discrepancy.uniqueChoices} different choices made
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {discrepancy.playerChoices.map((choice, choiceIndex) => (
                    <div key={choice.playerId} className="flex items-start space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {choice.playerName.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-gray-900">{choice.playerName}</p>
                          <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">{choice.playerRole}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{choice.optionText}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Confidence: {choice.confidenceLevel}/5</span>
                          <span>Response Time: {choice.responseTime}s</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Analysis:</strong> {
                      discrepancy.consensusLevel === 'low' 
                        ? 'Low consensus indicates significant differences in approach. Consider discussing decision-making frameworks and role-specific priorities to improve alignment.'
                        : 'Moderate consensus suggests some alignment but room for improvement. Review the different perspectives to identify best practices and areas for standardization.'
                    }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <ArrowRight className="w-6 h-6 text-blue-600 mr-2" />
          <h4 className="text-xl font-semibold text-blue-900">Coordination Improvement Recommendations</h4>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="font-semibold text-blue-800 mb-2">Resource Coordination</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Establish clear resource access protocols for all team members</li>
              <li>• Create shared resource inventories and contact lists</li>
              <li>• Implement regular resource availability checks</li>
              <li>• Develop backup procedures for critical resources</li>
            </ul>
          </div>
          
          <div>
            <h5 className="font-semibold text-blue-800 mb-2">Decision Alignment</h5>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Conduct regular crisis response training exercises</li>
              <li>• Establish clear decision-making frameworks and priorities</li>
              <li>• Improve communication channels between roles</li>
              <li>• Create role-specific response guidelines</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}