import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { Shield, Clock, Target, Users, MessageSquare, AlertTriangle, CheckCircle2, UserX, Activity, Zap } from 'lucide-react';
import { Player } from '../types';
import wsClient from '../utils/websocket';

export default function PlayerDashboard() {
  const { state } = useSimulation();
  const [showJoinAnimation, setShowJoinAnimation] = useState<string | null>(null);
  const [connectedPlayers, setConnectedPlayers] = useState<Player[]>([]);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [updateTimeout, setUpdateTimeout] = useState<number | null>(null);

  const { currentPlayerId, currentScenario } = state;
  const currentPlayer = connectedPlayers.find(p => p.id === currentPlayerId);

  // Debounce player updates
  const updatePlayers = useCallback((players: Player[]) => {
    if (updateTimeout) {
      window.clearTimeout(updateTimeout);
    }
    
    const timeoutId = window.setTimeout(() => {
      setConnectedPlayers(players);
      setLastUpdate(Date.now());
    }, 250); // Debounce for 250ms
    
    setUpdateTimeout(timeoutId);
  }, []);

  useEffect(() => {
    // Handle player list updates with debouncing
    const handlePlayerListUpdate = (data: any) => {
      if (data.players) {
        updatePlayers(data.players);
      }
    };

    // Handle new player joins with animation
    const handlePlayerJoined = (data: any) => {
      if (data.player) {
        setShowJoinAnimation(data.player.id);
        setTimeout(() => setShowJoinAnimation(null), 3000);
        
        setConnectedPlayers(prev => {
          const exists = prev.some(p => p.id === data.player.id);
          if (!exists) {
            return [...prev, data.player];
          }
          return prev;
        });
      }
    };

    // Handle player disconnections
    const handlePlayerLeft = (data: any) => {
      if (data.playerId) {
        setConnectedPlayers(prev => prev.filter(p => p.id !== data.playerId));
      }
    };

    wsClient.on('player_list_update', handlePlayerListUpdate);
    wsClient.on('player_joined', handlePlayerJoined);
    wsClient.on('player_left', handlePlayerLeft);

    return () => {
      wsClient.off('player_list_update', handlePlayerListUpdate);
      wsClient.off('player_joined', handlePlayerJoined);
      wsClient.off('player_left', handlePlayerLeft);
      if (updateTimeout) {
        window.clearTimeout(updateTimeout);
      }
    };
  }, [updatePlayers, updateTimeout]);

  // Memoize player status calculations
  const getPlayerStatus = useCallback((player: Player) => {
    if (!currentScenario) return 'waiting';
    
    if (player.currentStep >= currentScenario.timeline.length) {
      return 'completed';
    }
    if (player.currentStep === 0 && player.responses.length === 0) {
      return 'waiting';
    }
    return 'in-progress';
  }, [currentScenario]);

  // Memoize status color mapping
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'in-progress':
        return 'text-blue-500 bg-blue-50 border-blue-200';
      case 'disconnected':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  }, []);

  // Memoize progress calculations
  const getPlayerProgress = useCallback((player: Player) => {
    if (!currentScenario) return 0;
    return Math.round((player.currentStep / currentScenario.timeline.length) * 100);
  }, [currentScenario]);

  // Memoize aggregate statistics
  const stats = useMemo(() => {
    if (!connectedPlayers.length) return { avgProgress: 0, avgResponseTime: 0 };

    const progress = connectedPlayers.reduce((acc, p) => acc + getPlayerProgress(p), 0);
    const times = connectedPlayers.flatMap(p => p.responses.map(r => r.responseTime));
    
    return {
      avgProgress: Math.round(progress / connectedPlayers.length),
      avgResponseTime: times.length > 0 
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0
    };
  }, [connectedPlayers, getPlayerProgress]);

  if (!currentScenario || !currentPlayer) return null;

  return (
    <div className="fixed right-6 top-24 w-80 z-50">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-b border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-blue-900">Active Players</h3>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-blue-600 bg-white/50 px-2 py-1 rounded-full">
                {connectedPlayers.length} {connectedPlayers.length === 1 ? 'Player' : 'Players'}
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="divide-y divide-gray-100 max-h-[calc(100vh-200px)] overflow-y-auto">
          {connectedPlayers.map((player) => {
            const status = getPlayerStatus(player);
            const progress = getPlayerProgress(player);
            const statusColor = getStatusColor(status);
            const isNewPlayer = showJoinAnimation === player.id;

            return (
              <div
                key={player.id}
                className={`p-4 transition-all duration-300 ${
                  player.id === currentPlayerId
                    ? 'bg-blue-50'
                    : 'hover:bg-gray-50'
                } ${
                  isNewPlayer ? 'animate-slide-right' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium">
                      {player.name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{player.name}</h4>
                      <p className="text-sm text-gray-500">{player.role}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusColor} flex items-center`}>
                    {status === 'completed' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {status === 'in-progress' && <Activity className="w-3 h-3 mr-1" />}
                    {status === 'waiting' && <Clock className="w-3 h-3 mr-1" />}
                    {status}
                  </span>
                </div>

                <div className="mt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === 'completed'
                          ? 'bg-green-500'
                          : status === 'in-progress'
                          ? 'bg-blue-500'
                          : 'bg-gray-300'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">Avg. Time</div>
              <div className="text-lg font-semibold text-gray-900">
                {stats.avgResponseTime}s
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-gray-500">Avg. Progress</div>
              <div className="text-lg font-semibold text-gray-900">
                {stats.avgProgress}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}