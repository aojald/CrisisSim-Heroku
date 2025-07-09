import React from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { BarChart3, AlertTriangle, BookOpen, MessageSquare, FileSpreadsheet, Users } from 'lucide-react';
import DecisionAnalysis from './DecisionAnalysis';
import ResourceAnalysis from './ResourceAnalysis';
import ImprovementDashboard from './ImprovementDashboard';
import DiscrepancyAnalysis from './DiscrepancyAnalysis';

export default function SimulationAnalysis() {
  const { state } = useSimulation();
  const { currentScenario, players, currentPlayerId } = state;

  console.log('SimulationAnalysis - Current state:', {
    playersCount: players.length,
    players: players.map(p => ({
      id: p.id,
      name: p.name,
      role: p.role,
      responsesCount: p.responses?.length || 0,
      responses: p.responses
    })),
    currentPlayerId,
    scenarioTitle: currentScenario?.title
  });

  if (!currentScenario || players.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Analysis Available
          </h3>
          <p className="text-gray-600">
            Complete the simulation to view detailed crisis response analysis.
          </p>
        </div>
      </div>
    );
  }

  // Get all responses from all players
  const allResponses = players.flatMap(player => 
    (player.responses || []).map(response => ({
      ...response,
      playerId: player.id,
      playerName: player.name,
      playerRole: player.role
    }))
  );

  console.log('All responses for analysis:', allResponses);

  // Filter players who have made at least one response
  const playersWithResponses = players.filter(player => 
    player.responses && player.responses.length > 0
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Crisis Response Analysis</h2>
        <div className="flex items-center text-gray-600">
          <Users className="w-5 h-5 mr-2" />
          <span>{players.length} participant{players.length !== 1 ? 's' : ''} • {allResponses.length} total decision{allResponses.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {playersWithResponses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Responses Recorded
            </h3>
            <p className="text-gray-600">
              Players haven't made any decisions yet. Responses will appear here once the simulation progresses.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Individual Player Analysis */}
          <div className="grid grid-cols-1 gap-6 mb-8">
            {players.map(player => {
              const playerResponses = player.responses || [];
              console.log(`Player ${player.name} responses:`, playerResponses);
              
              return (
                <div key={player.id} className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{player.name}</h3>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-gray-600">{player.role}</p>
                        {player.id === currentPlayerId && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            You
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                          {playerResponses.length} decision{playerResponses.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                  </div>
                  
                  {playerResponses.length > 0 ? (
                    <div className="space-y-6">
                      {playerResponses.map((response, index) => {
                        console.log(`Rendering decision ${index} for player ${player.name}:`, response);
                        return (
                          <DecisionAnalysis
                            key={`${player.id}-${response.decisionId}-${index}`}
                            response={response}
                            decisionIndex={index}
                            playerName={player.name}
                            scenario={currentScenario}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No responses recorded yet</p>
                      <p className="text-xs text-gray-400 mt-1">
                        This player hasn't made any decisions in the simulation
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Resource Assessment */}
          {allResponses.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <AlertTriangle className="w-6 h-6 text-orange-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">Resource Assessment</h3>
              </div>
              <ResourceAnalysis 
                responses={allResponses} 
                scenario={currentScenario} 
                players={players}
              />
            </div>
          )}

          {/* Discrepancy Analysis */}
          {allResponses.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
              <div className="flex items-center mb-4">
                <Users className="w-6 h-6 text-purple-600 mr-2" />
                <h3 className="text-xl font-semibold text-gray-900">Discrepancy Analysis</h3>
              </div>
              <DiscrepancyAnalysis 
                responses={allResponses} 
                scenario={currentScenario} 
                players={players}
              />
            </div>
          )}

          {/* Improvement Dashboard */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-6">
              <FileSpreadsheet className="w-6 h-6 text-green-600 mr-2" />
              <h3 className="text-xl font-semibold text-gray-900">Improvement Dashboard</h3>
            </div>
            <ImprovementDashboard 
              responses={allResponses} 
              scenario={currentScenario} 
              players={players}
            />
          </div>
        </>
      )}
    </div>
  );
}