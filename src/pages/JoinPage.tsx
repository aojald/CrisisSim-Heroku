import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSimulation } from '../context/SimulationContext';
import { AlertTriangle, Users, Loader2, Shield, Clock, Activity, Play } from 'lucide-react';
import { CLevel } from '../types';
import PlayerManager from '../components/setup/PlayerManager';
import wsClient from '../utils/socket';

interface ActiveSimulation {
  code: string;
  status: string;
  mode: string;
  playerCount: number;
  startedAt: number;
  title: string;
  type: string;
}

export default function JoinPage() {
  const { dispatch } = useSimulation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [players, setPlayers] = useState<Array<{ name: string; role: CLevel }>>([]);
  const [activeSimulations, setActiveSimulations] = useState<ActiveSimulation[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);

  // Get code from URL and ensure it's uppercase
  const urlCode = searchParams.get('code')?.toUpperCase();

  useEffect(() => {
    const connectAndLoadSimulations = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Connect to socket server first
        if (!wsClient.isConnected()) {
          await wsClient.connect();
        }

        // Request list of active simulations
        const response = await new Promise<any>((resolve) => {
          wsClient.socket?.emit('list_simulations', resolve);
        });

        if (response.error) {
          throw new Error(response.error);
        }

        setActiveSimulations(response.simulations || []);

        // If URL has a code, select it
        if (urlCode) {
          setSelectedCode(urlCode);
          dispatch({ type: 'SET_SIMULATION_CODE', payload: urlCode });
          await wsClient.requestState();
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Connection failed:', err);
        if (connectionAttempts < 3) {
          setConnectionAttempts(prev => prev + 1);
          setTimeout(connectAndLoadSimulations, 2000);
        } else {
          setError('Failed to connect to server. Please try again.');
          setIsLoading(false);
        }
      }
    };

    connectAndLoadSimulations();

    // Handle simulation state updates
    const handleSimulationState = (data: any) => {
      if (!data.scenario) {
        setError('Invalid simulation code or simulation not found');
        return;
      }
      
      dispatch({ 
        type: 'SYNC_SIMULATION_STATE', 
        payload: {
          players: data.players || [],
          scenario: data.scenario,
          status: data.status,
          simulationCode: selectedCode
        }
      });
      
      if (data.status === 'active') {
        dispatch({ type: 'START_SIMULATION' });
        navigate('/');
      }
    };

    wsClient.on('simulation_state', handleSimulationState);
    wsClient.on('simulation_started', handleSimulationState);
    wsClient.on('join_ack', (data: any) => {
      if (data.playerId) {
        dispatch({ type: 'SET_CURRENT_PLAYER', payload: data.playerId });
      }
    });

    return () => {
      wsClient.off('simulation_state', handleSimulationState);
      wsClient.off('simulation_started', handleSimulationState);
      wsClient.off('join_ack');
    };
  }, [urlCode, connectionAttempts, dispatch, selectedCode, navigate]);

  const handleJoin = async () => {
    if (!selectedCode || players.length === 0) return;
    const player = players[0];
    
    setError(null);
    setIsConnecting(true);

    try {
      const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: playerId });

      const joined = await wsClient.joinSimulation(
        selectedCode,
        playerId,
        player.name,
        player.role
      );

      if (!joined) {
        throw new Error('Failed to join simulation');
      }
    } catch (error) {
      console.error('Failed to join simulation:', error);
      setError(error instanceof Error ? error.message : 'Failed to join simulation');
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: null });
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading available simulations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex items-center text-red-600 mb-4">
            <AlertTriangle className="w-6 h-6 mr-2" />
            <h2 className="text-lg font-semibold">Error</h2>
          </div>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Simulation
          </h1>
          <p className="text-gray-600">
            Select an active simulation to join
          </p>
        </div>

        {/* Active Simulations List */}
        <div className="bg-white rounded-xl shadow-lg border border-violet-100 overflow-hidden mb-6">
          <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 border-b border-violet-100">
            <div className="flex items-center text-violet-600">
              <Activity className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-semibold">Active Simulations</h2>
            </div>
          </div>

          <div className="p-4">
            {activeSimulations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No active simulations found
              </div>
            ) : (
              <div className="grid gap-4">
                {activeSimulations.map((sim) => (
                  <button
                    key={sim.code}
                    onClick={() => setSelectedCode(sim.code)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedCode === sim.code
                        ? 'border-violet-500 bg-violet-50'
                        : 'border-gray-200 hover:border-violet-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{sim.title}</h3>
                        <div className="text-sm text-gray-500 mt-1">
                          Code: {sim.code} • Players: {sim.playerCount}
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          sim.status === 'waiting'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {sim.status}
                        </span>
                        <Clock className="w-4 h-4 text-gray-400" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Role Selection */}
        {selectedCode && (
          <div className="bg-white rounded-xl shadow-lg border border-violet-100 overflow-hidden">
            <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 border-b border-violet-100">
              <div className="flex items-center text-violet-600">
                <Shield className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">Select Your Role</h2>
              </div>
            </div>

            <div className="p-4">
              <PlayerManager
                players={players}
                setPlayers={setPlayers}
                maxPlayers={1}
                singlePlayer={true}
              />

              <button
                onClick={handleJoin}
                disabled={players.length === 0 || isConnecting}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Join Simulation
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}