import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Copy, Check, Clock, Play, AlertTriangle, Info } from 'lucide-react';
import { Scenario, CLevel } from '../../types';
import wsClient from '../../utils/socket';

interface Props {
  scenario: Scenario;
  simulationCode: string;
  expectedPlayers: Array<{ name: string; role: CLevel }>;
  hostPlayer: { name: string; role: CLevel };
  onStart: () => void;
  isStarting: boolean;
}

export default function WaitingRoom({ 
  scenario, 
  simulationCode, 
  expectedPlayers,
  hostPlayer,
  onStart, 
  isStarting 
}: Props) {
  const [copied, setCopied] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const [connectedPlayers, setConnectedPlayers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [startAttempts, setStartAttempts] = useState(0);

  // Listen for player updates and simulation state
  useEffect(() => {
    const handlePlayerListUpdate = (data: any) => {
      if (data.players) {
        setConnectedPlayers(prev => {
          const merged = mergePlayers(prev, data.players);
          checkReadyState(merged);
          return merged;
        });
      }
    };

    const handlePlayerJoined = (data: any) => {
      if (data.player) {
        setConnectedPlayers(prev => {
          const exists = prev.some(p => p.id === data.player.id);
          if (!exists) {
            const newList = [...prev, data.player];
            checkReadyState(newList);
            return newList;
          }
          return prev;
        });
      }
    };

    const handlePlayerLeft = (data: any) => {
      if (data.playerId) {
        setConnectedPlayers(prev => {
          const filtered = prev.filter(p => p.id !== data.playerId);
          checkReadyState(filtered);
          return filtered;
        });
      }
    };

    const handleSimulationState = (data: any) => {
      if (data.players) {
        setConnectedPlayers(prev => {
          const merged = mergePlayers(prev, data.players);
          checkReadyState(merged);
          return merged;
        });
      }
      
      if (data.status === 'active' || data.startedAt) {
        onStart();
      }
    };

    const checkReadyState = (players: any[]) => {
      // Count host as a player
      const totalPlayers = players.length;
      const hasRemotePlayer = players.some(p => !p.isHost);
      
      // Ready to start if we have at least one remote player
      setReadyToStart(hasRemotePlayer);
    };

    const mergePlayers = (existing: any[], incoming: any[]) => {
      const merged = [...existing];
      incoming.forEach(newPlayer => {
        const index = merged.findIndex(p => p.id === newPlayer.id);
        if (index >= 0) {
          merged[index] = { ...merged[index], ...newPlayer };
        } else {
          merged.push(newPlayer);
        }
      });
      return merged;
    };

    // Subscribe to events
    wsClient.on('player_list_update', handlePlayerListUpdate);
    wsClient.on('player_joined', handlePlayerJoined);
    wsClient.on('player_left', handlePlayerLeft);
    wsClient.on('simulation_state', handleSimulationState);
    wsClient.on('simulation_started', handleSimulationState);

    // Add host to initial players list
    setConnectedPlayers([{
      id: 'host',
      name: hostPlayer.name,
      role: hostPlayer.role,
      isHost: true,
      status: 'active'
    }]);

    return () => {
      wsClient.off('player_list_update', handlePlayerListUpdate);
      wsClient.off('player_joined', handlePlayerJoined);
      wsClient.off('player_left', handlePlayerLeft);
      wsClient.off('simulation_state', handleSimulationState);
      wsClient.off('simulation_started', handleSimulationState);
    };
  }, [simulationCode, hostPlayer, onStart]);

  const handleCopy = () => {
    navigator.clipboard.writeText(simulationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStartSimulation = async () => {
    if (!readyToStart || isStarting) return;
    setStartAttempts(prev => prev + 1);

    try {
      setError(null);
      await wsClient.startSimulation();
    } catch (error) {
      console.error('Failed to start simulation:', error);
      setError('Failed to start simulation. Please try again.');
      
      // Auto-retry if under 3 attempts
      if (startAttempts < 3) {
        setTimeout(handleStartSimulation, 1000);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Waiting for Players</h2>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <span className="text-sm text-gray-600">
                {connectedPlayers.length} of {expectedPlayers.length} joined
              </span>
            </div>
          </div>

          {/* Share Code Section */}
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-blue-900 mb-4">Share Join Code</h3>
            <div className="flex flex-col items-center">
              {/* QR Code Limitation Notice */}
              <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start w-full">
                <Info className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  <strong>QR Code Notice:</strong> QR code scanning is currently unavailable due to deployment limitations. 
                  Please manually share the simulation code below with other players.
                </p>
              </div>
              <QRCodeSVG 
                value={`${window.location.origin}?code=${simulationCode}`}
                size={160}
                className="mb-4 opacity-50"
              />
              <div className="flex items-center space-x-2">
                <code className="bg-white px-4 py-2 rounded-lg text-lg font-mono border border-blue-200">
                  {simulationCode}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  {copied ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="text-sm text-blue-600 mt-2">
                Manually share this code with other players to join the simulation
              </p>
            </div>
          </div>

          {/* Players List */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Connected Players</h3>
            <div className="space-y-2">
              {connectedPlayers.map((player) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.isHost
                      ? 'bg-green-50 border-green-200'
                      : 'bg-blue-50 border-blue-200'
                  } border`}
                >
                  <div>
                    <p className="font-medium text-gray-900">{player.name}</p>
                    <p className="text-sm text-gray-600">{player.role}</p>
                  </div>
                  {player.isHost ? (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                      Host
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                      Connected
                    </span>
                  )}
                </div>
              ))}

              {expectedPlayers.map((expected) => {
                const isConnected = connectedPlayers.some(p => p.role === expected.role);
                if (!isConnected) {
                  return (
                    <div
                      key={expected.role}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{expected.name}</p>
                        <p className="text-sm text-gray-600">{expected.role}</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                        Waiting
                      </span>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Start Button */}
          <div className="flex items-center justify-between pt-4 border-t">
            {!readyToStart && (
              <div className="flex items-center text-yellow-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                <p className="text-sm">Waiting for players to join...</p>
              </div>
            )}
            <button
              onClick={handleStartSimulation}
              disabled={!readyToStart || isStarting}
              className={`flex items-center px-6 py-2 rounded-lg ml-auto ${
                readyToStart && !isStarting
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Play className="w-4 h-4 mr-2" />
              {isStarting ? 'Starting...' : 'Start Simulation'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}