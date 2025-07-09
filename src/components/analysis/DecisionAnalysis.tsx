import React from 'react';
import { UserResponse, Scenario } from '../../types';
import { useSimulation } from '../../context/SimulationContext';
import { AlertCircle, Clock, ThumbsUp } from 'lucide-react';

interface Props {
  response: UserResponse;
  decisionIndex: number;
  playerName?: string;
  scenario: Scenario;
}

export default function DecisionAnalysis({ response, decisionIndex, playerName, scenario }: Props) {
  const decision = scenario.timeline.find(d => d.id === response.decisionId);
  const selectedOption = decision?.options.find(o => o.id === response.optionId);

  if (!decision || !selectedOption) {
    return (
      <div className="border-l-4 border-red-600 pl-4 mb-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-2">
          Decision Point {decisionIndex + 1}
          {playerName && <span className="text-sm font-normal text-gray-600 ml-2">by {playerName}</span>}
        </h4>
        <div className="text-red-600 text-sm">
          Decision or selected option not found
        </div>
      </div>
    );
  }

  const confidenceColor = (confidence: number) => {
    if (confidence >= 4) return 'text-green-600';
    if (confidence >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getKeyFactors = () => {
    const factors = [];
    const impact = selectedOption.impact;

    if (impact.compliance >= 80) factors.push('Strong regulatory compliance');
    if (impact.stakeholder >= 80) factors.push('Effective stakeholder management');
    if (impact.business >= 80) factors.push('Good business continuity');
    if (impact.time >= 80) factors.push('Efficient time management');

    return factors;
  };

  const getUncertainties = () => {
    const uncertainties = [];
    const impact = selectedOption.impact;

    if (impact.compliance < 60) uncertainties.push('Regulatory compliance risks');
    if (impact.stakeholder < 60) uncertainties.push('Stakeholder communication gaps');
    if (impact.business < 60) uncertainties.push('Business impact concerns');
    if (impact.time < 60) uncertainties.push('Time management issues');

    return uncertainties;
  };

  return (
    <div className="border-l-4 border-blue-600 pl-4 mb-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-2">
        Decision Point {decisionIndex + 1}
        {playerName && <span className="text-sm font-normal text-gray-600 ml-2">by {playerName}</span>}
      </h4>
      
      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-700 font-medium mb-1">Decision:</p>
        <p className="text-sm text-gray-600">{decision.text}</p>
      </div>
      
      <div className="mb-3 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-700 font-medium mb-1">Selected Response:</p>
        <p className="text-sm text-blue-600">{selectedOption.text}</p>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center text-sm">
          <ThumbsUp className={`w-4 h-4 mr-2 ${confidenceColor(response.confidenceLevel)}`} />
          <span className="text-gray-600">
            Confidence Score: {response.confidenceLevel * 20}%
          </span>
        </div>

        <div className="flex items-center text-sm">
          <Clock className="w-4 h-4 mr-2 text-blue-600" />
          <span className="text-gray-600">
            Response Time: {response.responseTime}s
          </span>
        </div>

        {/* Impact Scores */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="bg-gray-100 p-2 rounded">
            <div className="font-medium text-gray-700">Compliance</div>
            <div className="text-gray-600">{selectedOption.impact.compliance}%</div>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <div className="font-medium text-gray-700">Stakeholder</div>
            <div className="text-gray-600">{selectedOption.impact.stakeholder}%</div>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <div className="font-medium text-gray-700">Business</div>
            <div className="text-gray-600">{selectedOption.impact.business}%</div>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <div className="font-medium text-gray-700">Time</div>
            <div className="text-gray-600">{selectedOption.impact.time}%</div>
          </div>
        </div>

        {getKeyFactors().length > 0 && (
          <div className="text-sm">
            <p className="font-medium text-gray-700">Key Factors:</p>
            <ul className="mt-1 list-disc list-inside text-gray-600">
              {getKeyFactors().map((factor, i) => (
                <li key={i}>{factor}</li>
              ))}
            </ul>
          </div>
        )}

        {getUncertainties().length > 0 && (
          <div className="text-sm">
            <p className="font-medium text-gray-700">Areas of Uncertainty:</p>
            <ul className="mt-1 list-disc list-inside text-gray-600">
              {getUncertainties().map((uncertainty, i) => (
                <li key={i}>{uncertainty}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {selectedOption.feedback && (
        <div className="mt-3 p-3 bg-green-50 rounded-lg">
          <p className="text-sm text-green-700 font-medium mb-1">Feedback:</p>
          <p className="text-sm text-green-600">{selectedOption.feedback}</p>
        </div>
      )}
    </div>
  );
}