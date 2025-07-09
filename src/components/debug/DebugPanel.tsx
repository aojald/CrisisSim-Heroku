import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { Bug, X, RefreshCw, Users, Target, Shield, Clock, Brain, CheckCircle2, AlertTriangle } from 'lucide-react';
import wsClient from '../../utils/websocket';

export default function DebugPanel() {
  const { state } = useSimulation();
  const [isOpen, setIsOpen] = useState(true);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const checkConnection = () => {
      setWsStatus(wsClient.isConnected() ? 'connected' : 'disconnected');
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);
    checkConnection();

    // Listen for WebSocket messages
    const handleMessage = (message: any) => {
      setLastMessage(JSON.stringify(message, null, 2));
    };

    wsClient.on('message', handleMessage);

    return () => {
      clearInterval(interval);
      wsClient.off('message', handleMessage);
    };
  }, []);

  const getPlayerStatus = (player: any) => {
    if (player.currentStep >= state.currentScenario!.timeline.length) {
      return 'completed';
    }
    if (player.currentStep === 0 && player.responses.length === 0) {
      return 'waiting';
    }
    return 'in-progress';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'completed':
        return 'text-green-500';
      case 'in-progress':
        return 'text-blue-500';
      case 'disconnected':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100]">
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 w-96 transition-all duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-2.5rem)]'
      }`}>
        {/* Header */}
        <div 
          className="p-2 flex items-center justify-between cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            <Bug className="w-5 h-5 text-purple-600 mr-2" />
            <h3 className="font-medium text-gray-900">Debug Panel</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setRefreshKey(prev => prev + 1);
              }}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(!isOpen);
              }}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4" key={refreshKey}>
          {/* Connection Status */}
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${
                wsStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="text-sm font-medium">WebSocket Status</span>
            </div>
            <span className={`text-sm ${getStatusColor(wsStatus)}`}>
              {wsStatus}
            </span>
          </div>

          {/* Simulation Info */}
          <div className="space-y-2">
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Shield className="w-4 h-4 mr-1" />
              Simulation Code: {state.simulationCode || 'N/A'}
            </div>
            <div className="flex items-center text-sm font-medium text-gray-700">
              <Target className="w-4 h-4 mr-1" />
              Scenario: {state.currentScenario?.title || 'N/A'}
            </div>
          </div>

          {/* Players */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1 text-gray-700" />
              <h4 className="text-sm font-medium text-gray-700">Players ({state.players.length})</h4>
            </div>
            <div className="space-y-2">
              {state.players.map((player) => {
                const status = getPlayerStatus(player);
                return (
                  <div key={player.id} className="bg-gray-50 p-2 rounded-lg text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{player.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs ${
                        getStatusColor(status)
                      } bg-opacity-10`}>
                        {status}
                      </span>
                    </div>
                    <div className="text-gray-600 space-y-1">
                      <div className="flex items-center">
                        <Shield className="w-3 h-3 mr-1" />
                        Role: {player.role}
                      </div>
                      <div className="flex items-center">
                        <Target className="w-3 h-3 mr-1" />
                        Step: {player.currentStep + 1}/{state.currentScenario?.timeline.length}
                      </div>
                      <div className="flex items-center">
                        <Brain className="w-3 h-3 mr-1" />
                        Responses: {player.responses.length}
                      </div>
                    </div>
                    {player.responses.length > 0 && (
                      <div className="mt-2 space-y-1">
                        <div className="text-xs font-medium text-gray-700">Last Response:</div>
                        <div className="text-xs text-gray-600">
                          Confidence: {player.responses[player.responses.length - 1].confidenceLevel}/5
                        </div>
                        <div className="text-xs text-gray-600">
                          Time: {player.responses[player.responses.length - 1].responseTime}s
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Last WebSocket Message */}
          {lastMessage && (
            <div className="space-y-1">
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-gray-700" />
                <h4 className="text-sm font-medium text-gray-700">Last Message</h4>
              </div>
              <pre className="text-xs bg-gray-50 p-2 rounded-lg overflow-x-auto">
                {lastMessage}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}