import { useState, useEffect } from 'react';
import { useSimulation } from '../context/SimulationContext';
import { simulationStore } from '../store/SimulationStore';

export function useSimulationJoin(code: string | null) {
  const { dispatch } = useSimulation();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;

    const joinSimulation = async () => {
      setIsJoining(true);
      setError(null);

      try {
        const joined = await simulationStore.joinSimulation(code);
        if (!joined) {
          throw new Error('Failed to join simulation');
        }

        // Listen for state updates
        const handleStateUpdate = (simulation: any) => {
          dispatch({ 
            type: 'SYNC_SIMULATION_STATE', 
            payload: {
              players: simulation.players,
              scenario: simulation.scenario,
              status: simulation.status,
              simulationCode: simulation.code
            }
          });

          if (simulation.status === 'active') {
            dispatch({ type: 'START_SIMULATION' });
          }
        };

        simulationStore.on('stateUpdated', handleStateUpdate);
        
        return () => {
          simulationStore.off('stateUpdated', handleStateUpdate);
          simulationStore.cleanup();
        };
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to join simulation');
      } finally {
        setIsJoining(false);
      }
    };

    joinSimulation();
  }, [code, dispatch]);

  return { isJoining, error };
}