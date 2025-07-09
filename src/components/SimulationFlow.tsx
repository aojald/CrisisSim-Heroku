import React from 'react';
import { useSimulation } from '../context/SimulationContext';
import Setup from './Setup';
import Simulation from './Simulation';
import JoinSimulation from './JoinSimulation';

export default function SimulationFlow() {
  const { state } = useSimulation();
  const { currentScenario, simulationStarted } = state;

  // Get code from URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const code = searchParams.get('code')?.toUpperCase();

  // Show join screen if there's a code
  if (code) {
    // If we have a scenario and simulation is started, show simulation
    if (currentScenario && simulationStarted) {
      return <Simulation />;
    }
    // Otherwise show join screen
    return <JoinSimulation />;
  }

  // For host/local player
  if (simulationStarted && currentScenario) {
    return <Simulation />;
  }

  return <Setup />;
}