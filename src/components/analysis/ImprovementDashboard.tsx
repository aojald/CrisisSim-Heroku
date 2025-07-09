import React from 'react';
import { UserResponse, Scenario, Decision, Option } from '../../types';
import { AlertTriangle, Clock, DollarSign, TrendingUp, Users, Shield, MessageSquare, Award } from 'lucide-react';

interface Props {
  responses: UserResponse[];
  scenario: Scenario;
  players?: Array<{ id: string; name: string; role: string; responses: UserResponse[] }>;
}

interface ImprovementItem {
  id: string;
  category: string;
  description: string;
  urgency: number;
  impact: number;
  cost: 'Low' | 'Medium' | 'High';
  timeframe: 'Short' | 'Medium' | 'Long-term';
}

export default function ImprovementDashboard({ responses, scenario, players = [] }: Props) {
  const analyzeResourceCoordination = (): ImprovementItem[] => {
    const coordinationImprovements: ImprovementItem[] = [];
    
    // Check for prerequisites compliance
    if (scenario.prerequisites) {
      const missingPrerequisites = scenario.prerequisites.filter(prereq => 
        !responses.some(response => response.availableResources.includes(prereq.toLowerCase().replace(/\s+/g, '-')))
      );

      if (missingPrerequisites.length > 0) {
        coordinationImprovements.push({
          id: 'prerequisites',
          category: 'Prerequisites',
          description: `Missing critical prerequisites: ${missingPrerequisites.join(', ')}`,
          urgency: 5,
          impact: 5,
          cost: 'High',
          timeframe: 'Short'
        });
      }
    }

    if (players.length < 2) return coordinationImprovements;
    
    let discrepancyCount = 0;
    
    scenario.timeline.forEach((decision, decisionIndex) => {
      if (decision.requiredResources) {
        decision.requiredResources.forEach(resource => {
          const playerAvailability = [];
          
          players.forEach(player => {
            const response = player.responses[decisionIndex];
            if (response && response.decisionId === decision.id) {
              playerAvailability.push(response.availableResources.includes(resource.id));
            }
          });
          
          // Check if there's a discrepancy
          const hasResource = playerAvailability.filter(Boolean).length;
          const noResource = playerAvailability.length - hasResource;
          
          if (hasResource > 0 && noResource > 0) {
            discrepancyCount++;
          }
        });
      }
    });
    
    if (discrepancyCount > 0) {
      coordinationImprovements.push({
        id: 'resource-coordination',
        category: 'Team Coordination',
        description: `${discrepancyCount} resource availability discrepancies detected across team members. Improve resource access protocols and communication.`,
        urgency: 4,
        impact: 4,
        cost: 'Medium',
        timeframe: 'Short'
      });
    }
    
    return coordinationImprovements;
  };

  const generateImprovements = (): ImprovementItem[] => {
    const improvements: ImprovementItem[] = [];
    
    if (responses.length === 0) {
      return improvements;
    }
    
    // Analyze response times and decision-making speed
    const avgResponseTime = responses.reduce((acc, r) => acc + r.responseTime, 0) / responses.length;
    if (avgResponseTime > 180) {
      improvements.push({
        id: 'resp-time',
        category: 'Decision Making',
        description: 'Response times exceed target threshold. Implement decision-making frameworks and regular drills.',
        urgency: 4,
        impact: 5,
        cost: 'Low',
        timeframe: 'Short'
      });
    }

    // Analyze confidence levels and training needs
    const avgConfidence = responses.reduce((acc, r) => acc + r.confidenceLevel, 0) / responses.length;
    if (avgConfidence < 4) {
      improvements.push({
        id: 'training',
        category: 'Training',
        description: 'Low confidence levels indicate need for enhanced crisis management training.',
        urgency: 5,
        impact: 4,
        cost: 'Medium',
        timeframe: 'Medium'
      });
    }

    // Analyze compliance impact scores
    const complianceScores = responses.map(response => {
      const decision = scenario.timeline.find(d => d.id === response.decisionId);
      const option = decision?.options.find(o => o.id === response.optionId);
      return option?.impact.compliance || 0;
    });

    const avgCompliance = complianceScores.reduce((acc, score) => acc + score, 0) / complianceScores.length;
    if (avgCompliance < 75) {
      improvements.push({
        id: 'compliance',
        category: 'Regulatory Compliance',
        description: 'Compliance scores indicate gaps in regulatory understanding and procedures.',
        urgency: 5,
        impact: 5,
        cost: 'High',
        timeframe: 'Short'
      });
    }

    // Analyze resource availability and utilization
    const missingResources = new Set<string>();
    responses.forEach(response => {
      const decision = scenario.timeline.find(d => d.id === response.decisionId);
      if (decision?.requiredResources) {
        decision.requiredResources.forEach(resource => {
          if (!response.availableResources.includes(resource.id)) {
            missingResources.add(resource.id);
          }
        });
      }
    });

    if (missingResources.size > 0) {
      improvements.push({
        id: 'resources',
        category: 'Resource Management',
        description: 'Critical response resources unavailable or underutilized during crisis.',
        urgency: 5,
        impact: 5,
        cost: 'High',
        timeframe: 'Short'
      });
    }

    // Analyze stakeholder management
    const stakeholderScores = responses.map(response => {
      const decision = scenario.timeline.find(d => d.id === response.decisionId);
      const option = decision?.options.find(o => o.id === response.optionId);
      return option?.impact.stakeholder || 0;
    });

    const avgStakeholder = stakeholderScores.reduce((acc, score) => acc + score, 0) / stakeholderScores.length;
    if (avgStakeholder < 70) {
      improvements.push({
        id: 'stakeholder',
        category: 'Stakeholder Management',
        description: 'Enhance stakeholder communication and engagement strategies.',
        urgency: 4,
        impact: 4,
        cost: 'Medium',
        timeframe: 'Medium'
      });
    }

    // Analyze business continuity impact
    const businessScores = responses.map(response => {
      const decision = scenario.timeline.find(d => d.id === response.decisionId);
      const option = decision?.options.find(o => o.id === response.optionId);
      return option?.impact.business || 0;
    });

    const avgBusiness = businessScores.reduce((acc, score) => acc + score, 0) / businessScores.length;
    if (avgBusiness < 70) {
      improvements.push({
        id: 'continuity',
        category: 'Business Continuity',
        description: 'Strengthen business continuity planning and recovery procedures.',
        urgency: 4,
        impact: 5,
        cost: 'High',
        timeframe: 'Medium'
      });
    }

    // Add resource coordination improvements
    const coordinationImprovements = analyzeResourceCoordination();
    improvements.push(...coordinationImprovements);

    return improvements.sort((a, b) => (b.urgency + b.impact) - (a.urgency + a.impact));
  };

  const improvements = generateImprovements();

  const getUrgencyColor = (urgency: number) => {
    if (urgency >= 4) return 'text-red-600';
    if (urgency >= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Decision Making':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'Training':
        return <Users className="w-5 h-5 text-green-600" />;
      case 'Resource Management':
        return <TrendingUp className="w-5 h-5 text-purple-600" />;
      case 'Regulatory Compliance':
        return <Shield className="w-5 h-5 text-red-600" />;
      case 'Team Coordination':
        return <Users className="w-5 h-5 text-indigo-600" />;
      case 'Stakeholder Management':
        return <MessageSquare className="w-5 h-5 text-orange-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getCostDisplay = (cost: string) => {
    switch (cost) {
      case 'Low':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'Medium':
        return <div className="flex"><DollarSign className="w-4 h-4 text-yellow-600" /><DollarSign className="w-4 h-4 text-yellow-600" /></div>;
      case 'High':
        return <div className="flex"><DollarSign className="w-4 h-4 text-red-600" /><DollarSign className="w-4 h-4 text-red-600" /><DollarSign className="w-4 h-4 text-red-600" /></div>;
    }
  };

  if (improvements.length === 0) {
    return (
      <div className="text-center py-8">
        <Award className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {responses.length === 0 ? 'Analysis Pending' : 'Exceptional Crisis Management!'}
        </h3>
        <p className="text-gray-600 max-w-lg mx-auto">
          {responses.length === 0 
            ? 'Complete the simulation to see detailed improvement recommendations and analysis.'
            : 'Your responses demonstrate excellent crisis preparedness and decision-making. Share your expertise with other roles in your organization to strengthen overall crisis readiness.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {improvements.map(item => (
        <div key={item.id} className="bg-white border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              {getCategoryIcon(item.category)}
              <div>
                <h4 className="font-medium text-gray-900">{item.category}</h4>
                <p className="text-gray-600 mt-1">{item.description}</p>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              item.timeframe === 'Short' ? 'bg-red-100 text-red-800' :
              item.timeframe === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {item.timeframe}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Urgency</p>
              <div className={`font-medium ${getUrgencyColor(item.urgency)}`}>
                {item.urgency}/5
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Impact</p>
              <div className="font-medium text-blue-600">
                {item.impact}/5
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Cost</p>
              <div className="flex items-center">
                {getCostDisplay(item.cost)}
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Implementation</p>
              <div className="font-medium text-gray-900">
                {item.timeframe}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}