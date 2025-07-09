import React, { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { AlertTriangle, Users, Loader2, Shield, CheckCircle } from 'lucide-react';
import { CLevel } from '../types';
import PlayerManager from './setup/PlayerManager';
import wsClient, { debug } from '../utils/socket';

export default function JoinSimulation() {
  const { dispatch, state } = useSimulation();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [players, setPlayers] = useState<Array<{ name: string; role: CLevel }>>([]);
  const [availableRoles, setAvailableRoles] = useState<CLevel[]>([]);
  const [takenNames, setTakenNames] = useState<string[]>([]);
  const [hasJoined, setHasJoined] = useState(false);

  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code')?.toUpperCase();

  // Calculate truly available roles (not taken by existing players)
  const actuallyAvailableRoles = availableRoles.filter(role => 
    !state.players.some(player => player.role === role)
  );

  // New function to peek simulation state
  const peekSimulation = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if (!wsClient.isConnected()) {
        reject(new Error('Socket not connected'));
        return;
      }
      wsClient.socket.emit('peek_simulation', { code }, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response.state);
        }
      });
    });
  };

  useEffect(() => {
    let mounted = true;

    const connectSocket = async () => {
      try {
        if (!mounted) return;
        setIsLoading(true);
        setError(null);

        if (!wsClient.isConnected()) {
          await wsClient.connect();
        }

        if (code) {
          dispatch({ type: 'SET_SIMULATION_CODE', payload: code });
          // Peek simulation state instead of probe join
          const stateData = await peekSimulation();
          handleSimulationState(stateData); // Process state immediately
        }

        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Connection failed:', err);
        if (mounted && connectionAttempts < 3) {
          setConnectionAttempts(prev => prev + 1);
          setTimeout(connectSocket, 2000);
        } else if (mounted) {
          setError('Failed to connect to server or simulation not found. Please try again.');
          setIsLoading(false);
        }
      }
    };

    const handleSimulationState = (data: any) => {
      if (!mounted) return;

      if (!data.scenario) {
        setError('Invalid simulation code or simulation not found');
        debug('Invalid simulation state received:', data);
        return;
      }

      debug('Received simulation state:', { mode: data.mode, status: data.status });

      if (data.mode === 'multi') {
        const allRoles = data.roles ? data.roles.map((r: { role: CLevel }) => r.role) : [];
        const assignedRoles = data.players.map((p: { role: CLevel }) => p.role);
        const available = allRoles.filter((role: CLevel) => !assignedRoles.includes(role));
        const names = data.players.map((p: { name: string }) => p.name);

        setAvailableRoles(available);
        setTakenNames(names);
      }

      dispatch({ 
        type: 'SYNC_SIMULATION_STATE', 
        payload: {
          players: data.players || [],
          scenario: data.scenario,
          status: data.status,
          simulationCode: code,
          mode: data.mode
        }
      });

      if (data.status === 'active') {
        dispatch({ type: 'START_SIMULATION' });
      }
    };

    const handleJoinAck = (data: any) => {
      if (!mounted) return;
      if (data.playerId) {
        dispatch({ type: 'SET_CURRENT_PLAYER', payload: data.playerId });
        setHasJoined(true);
      }
    };

    wsClient.on('simulation_state', handleSimulationState);
    wsClient.on('simulation_started', handleSimulationState);
    wsClient.on('join_ack', handleJoinAck);

    connectSocket();

    return () => {
      mounted = false;
      wsClient.off('simulation_state', handleSimulationState);
      wsClient.off('simulation_started', handleSimulationState);
      wsClient.off('join_ack', handleJoinAck);
    };
  }, [code, connectionAttempts, dispatch]);

  const handleJoin = async () => {
    if (!code || players.length === 0 || isConnecting || hasJoined) return;
    const player = players[0];

    if (state.currentScenario?.mode === 'multi' && !actuallyAvailableRoles.includes(player.role)) {
      setError('Selected role is not available. Please choose an available role.');
      return;
    }

    if (takenNames.includes(player.name)) {
      setError('This name is already taken. Consider choosing a unique name.');
      return;
    }

    setError(null);
    setIsConnecting(true);

    try {
      const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: playerId });

      const joined = await wsClient.joinSimulation(
        code,
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
      setHasJoined(false);
    } finally {
      setIsConnecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Connecting to simulation...</p>
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
          <a
            href="/"
            className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  if (hasJoined) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg border border-green-100 overflow-hidden">
            <div className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-b border-green-100">
              <div className="flex items-center text-green-600">
                <CheckCircle className="w-5 h-5 mr-2" />
                <h2 className="text-lg font-semibold">Successfully Joined!</h2>
              </div>
            </div>
            <div className="p-6 text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Welcome to Simulation {code}
                </h3>
                <p className="text-gray-600">
                  You have successfully joined the simulation. Please wait for the host to start the session.
                </p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Your Role:</strong> {players[0]?.role}<br />
                  <strong>Your Name:</strong> {players[0]?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join Simulation
          </h1>
          <p className="text-gray-600">
            Select your role to join {code}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-violet-100 overflow-hidden">
          <div className="p-4 bg-gradient-to-br from-violet-50 to-violet-100 border-b border-violet-100">
            <div className="flex items-center text-violet-600">
              <Shield className="w-5 h-5 mr-2" />
              <h2 className="text-lg font-semibold">Select Your Role</h2>
            </div>
          </div>

          <div className="p-4">
            {state.currentScenario?.mode === 'multi' && (
              <div className="mb-4 text-sm text-gray-700">
                <p className="font-semibold">Available Roles:</p>
                {availableRoles.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {availableRoles.map(role => (
                      <li key={role}>{role}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No roles available yet</p>
                )}
                <p className="font-semibold mt-2">Taken Names:</p>
                {takenNames.length > 0 ? (
                  <ul className="list-disc list-inside">
                    {takenNames.map(name => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-500">No names taken yet</p>
                )}
              </div>
            )}

            <PlayerManager
              players={players}
              setPlayers={setPlayers}
              maxPlayers={1}
              singlePlayer={state.currentScenario?.mode === 'single'}
              availableRoles={state.currentScenario?.mode === 'multi' ? actuallyAvailableRoles : undefined}
            />
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center">
                <AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={players.length === 0 || isConnecting || hasJoined || (state.currentScenario?.mode === 'multi' && actuallyAvailableRoles.length === 0)}
              className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Joining...
                </>
              ) : hasJoined ? (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Joined Successfully
                </>
              ) : (
                <>
                  <Users className="w-5 h-5 mr-2" />
                  Join Simulation
                </>
              )}
            </button>
            
            {state.currentScenario?.mode === 'multi' && actuallyAvailableRoles.length === 0 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                All roles in this simulation have been assigned. Please wait for the host to start or for a player to leave.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}