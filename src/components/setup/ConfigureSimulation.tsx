import React, { useState, useEffect } from 'react';
import { useSimulation } from '../../context/SimulationContext';
import { CLevel, Industry, CompanySize, Scenario } from '../../types';
import { Shield, Building2, Users, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import PlayerManager from './PlayerManager';
import OrganizationProfile from './OrganizationProfile';
import ScenarioSelector from './ScenarioSelector';
import StartModal from './StartModal';
import WaitingRoom from './WaitingRoom';
import wsClient from '../../utils/socket';

interface Props {
  onBack: () => void;
}

export default function ConfigureSimulation({ onBack }: Props) {
  const { state, dispatch } = useSimulation();
  const [players, setPlayers] = useState<Array<{ name: string; role: CLevel }>>([]);
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showWaitingRoom, setShowWaitingRoom] = useState(false);
  const [simulationCode, setSimulationCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [hostPlayer, setHostPlayer] = useState<{ name: string; role: CLevel } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!simulationCode) {
      setSimulationCode(Math.random().toString(36).substring(2, 8).toUpperCase());
    }
  }, []);

  // Listen for simulation state updates
  useEffect(() => {
    const handleSimulationState = (data: any) => {
      console.log('Received simulation state:', data);
      
      // Update global simulation state
      dispatch({ 
        type: 'SYNC_SIMULATION_STATE', 
        payload: {
          players: data.players || [],
          scenario: data.scenario,
          status: data.status,
          simulationCode: simulationCode
        }
      });

      // Show waiting room for host if status is waiting
      if ((data.status === 'waiting' || data.status === 'ready') && hostPlayer) {
        setShowWaitingRoom(true);
        setShowStartModal(false);
      }

      // Start simulation if status is active
      if (data.status === 'active') {
        dispatch({ type: 'START_SIMULATION' });
      }
    };

    wsClient.on('simulation_state', handleSimulationState);
    wsClient.on('simulation_started', handleSimulationState);

    return () => {
      wsClient.off('simulation_state', handleSimulationState);
      wsClient.off('simulation_started', handleSimulationState);
    };
  }, [dispatch, simulationCode, hostPlayer]);

  const handleScenarioSelect = (scenario: Scenario) => {
    setError(null);

    if (!state.industry) {
      setError('Please select an industry first');
      return;
    }

    if (!state.companySize) {
      setError('Please select a company size first');
      return;
    }

    if (players.length === 0) {
      setError('Please add at least one player');
      return;
    }

    setSelectedScenario(scenario);
    setShowStartModal(true);
  };

  const handleCreateSimulation = async () => {
    if (!selectedScenario || !simulationCode || isConnecting) return;

    setError(null);
    setIsConnecting(true);

    try {
      // Validate configuration
      if (!state.industry || !state.companySize) {
        throw new Error('Please select industry and company size');
      }

      if (players.length === 0) {
        throw new Error('Please add at least one player');
      }

      // Determine simulation mode based on number of players
      const mode = players.length === 1 ? 'single' : 'multi';

      // Set host player first to ensure it's available for state updates
      setHostPlayer(players[0]);

      // Generate host player ID
      const hostId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Set simulation code and player ID in context
      dispatch({ type: 'SET_SIMULATION_CODE', payload: simulationCode });
      dispatch({ type: 'SET_CURRENT_PLAYER', payload: hostId });
      dispatch({ 
        type: 'SET_SCENARIO', 
        payload: { 
          ...selectedScenario, 
          mode 
        } 
      });

      // Create roles configuration for all expected players
      const roles = players.map(player => ({
        role: player.role,
        name: player.name,
        assigned: false
      }));

      // Connect to socket server if not already connected
      if (!wsClient.isConnected()) {
        await wsClient.connect();
      }

      // Create simulation
      const joined = await wsClient.createSimulation(
        simulationCode,
        hostId,
        players[0].name,
        players[0].role,
        selectedScenario,
        mode,
        roles // Pass all expected roles
      );

      if (!joined) {
        throw new Error('Failed to create simulation');
      }

      // Update simulation status to waiting
      if (players.length > 1) {
        dispatch({ type: 'SYNC_SIMULATION_STATE', payload: { status: 'waiting' } });
      } else {
        dispatch({ type: 'SYNC_SIMULATION_STATE', payload: { status: 'active', mode: 'single' } });
      }

      if (mode === 'single') {
        // For single player, start immediately
        await wsClient.startSimulation();
      } else {
        // For multiplayer, show waiting room
        setShowWaitingRoom(true);
        setShowStartModal(false);
      }
    } catch (error) {
      console.error('Failed to create simulation:', error);
      setError(error instanceof Error ? error.message : 'Failed to create simulation');
      setShowWaitingRoom(false);
      setShowStartModal(false);
      setHostPlayer(null);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleStartSimulation = async () => {
    if (!simulationCode || !selectedScenario || isStarting) return;

    setIsStarting(true);
    try {
      await wsClient.startSimulation();
    } catch (error) {
      console.error('Failed to start simulation:', error);
      setError('Failed to start simulation. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  // If waiting room should be shown, render only that
  if (showWaitingRoom && selectedScenario && simulationCode && hostPlayer) {
    return (
      <WaitingRoom
        scenario={selectedScenario}
        simulationCode={simulationCode}
        expectedPlayers={players}
        hostPlayer={hostPlayer}
        onStart={handleStartSimulation}
        isStarting={isStarting}
      />
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Configure your simulation
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto text-sm">
          Add players and select your organization profile
        </p>
      </div>

      <PlayerManager
        players={players}
        setPlayers={setPlayers}
      />

      <OrganizationProfile />

      <ScenarioSelector
        onSelect={handleScenarioSelect}
        error={error}
      />

      {showStartModal && selectedScenario && simulationCode && (
        <StartModal
          scenario={selectedScenario}
          players={players}
          simulationCode={simulationCode}
          showCode={players.length > 1}
          onStart={handleCreateSimulation}
          onClose={() => setShowStartModal(false)}
          isConnecting={isConnecting}
        />
      )}
    </div>
  );
}