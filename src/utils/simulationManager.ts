import { Scenario, CLevel, SimulationStatus } from '../types';

// Single in-memory store for active simulations
const simulations = new Map<string, Simulation>();

interface Simulation {
  id: string;
  code: string;
  scenario: Scenario;
  players: Player[];
  status: SimulationStatus;
  startedAt: number;
  mode: 'single' | 'multi';
}

interface Player {
  id: string;
  name: string;
  role: CLevel;
  currentStep: number;
  responses: any[];
  status: 'active' | 'disconnected';
  lastActivity: number;
}

function validateScenario(scenario: Scenario): boolean {
  if (!scenario) return false;
  
  // Ensure required arrays are initialized
  scenario.industry = scenario.industry || [];
  scenario.companySize = scenario.companySize || [];
  scenario.timeline = scenario.timeline || [];
  scenario.regulatoryRequirements = scenario.regulatoryRequirements || [];
  scenario.prerequisites = scenario.prerequisites || [];
  scenario.supportingDocuments = scenario.supportingDocuments || [];

  // Validate required fields
  return !!(
    scenario.type &&
    scenario.id &&
    scenario.title &&
    scenario.description &&
    scenario.severity
  );
}

export function createSimulationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export function createSimulation(
  scenario: Scenario,
  player: { role: CLevel; name: string },
  code: string,
  mode: 'single' | 'multi' = 'single'
): string {
  if (!validateScenario(scenario)) {
    throw new Error('Invalid scenario data');
  }

  const simulationId = `sim-${Date.now()}`;
  const simulation: Simulation = {
    id: simulationId,
    code: code.toUpperCase(),
    scenario,
    players: [],
    status: mode === 'single' ? 'active' : 'waiting',
    startedAt: Date.now(),
    mode
  };

  // Add initial player
  const initialPlayer: Player = {
    id: `player-${Date.now()}`,
    name: player.name,
    role: player.role,
    currentStep: 0,
    responses: [],
    status: 'active',
    lastActivity: Date.now()
  };

  simulation.players.push(initialPlayer);
  simulations.set(simulation.code, simulation);
  return simulation.code;
}

export function getSimulation(code: string): Simulation | null {
  return simulations.get(code.toUpperCase()) || null;
}

export function getAvailableRoles(code: string): Array<{ role: CLevel; name: string }> {
  const simulation = getSimulation(code);
  if (!simulation) return [];

  // For single-player mode, return all roles
  if (simulation.mode === 'single') {
    return ['CEO', 'CFO', 'COO', 'CIO', 'CISO', 'HR Director', 'CLO', 'CCO'].map(role => ({
      role: role as CLevel,
      name: role
    }));
  }

  // For multiplayer, return only unassigned roles
  const takenRoles = simulation.players.map(p => p.role);
  return ['CEO', 'CFO', 'COO', 'CIO', 'CISO', 'HR Director', 'CLO', 'CCO']
    .filter(role => !takenRoles.includes(role as CLevel))
    .map(role => ({
      role: role as CLevel,
      name: role
    }));
}

export function addPlayer(code: string, player: Player): boolean {
  const simulation = getSimulation(code);
  if (!simulation) return false;

  // For single player, only allow one player
  if (simulation.mode === 'single' && simulation.players.length > 0) {
    return false;
  }

  // For multiplayer, check if role is available
  if (simulation.mode === 'multi') {
    const roleExists = simulation.players.some(p => p.role === player.role);
    if (roleExists) return false;
  }

  simulation.players.push({
    ...player,
    currentStep: 0,
    responses: [],
    status: 'active',
    lastActivity: Date.now()
  });

  return true;
}

export function updatePlayer(code: string, playerId: string, updates: Partial<Player>): boolean {
  const simulation = getSimulation(code);
  if (!simulation) return false;

  const playerIndex = simulation.players.findIndex(p => p.id === playerId);
  if (playerIndex === -1) return false;

  simulation.players[playerIndex] = {
    ...simulation.players[playerIndex],
    ...updates,
    lastActivity: Date.now()
  };

  return true;
}

export function removePlayer(code: string, playerId: string): boolean {
  const simulation = getSimulation(code);
  if (!simulation || simulation.mode === 'single') return false;

  simulation.players = simulation.players.filter(p => p.id !== playerId);
  
  // Update status if no players left
  if (simulation.players.length === 0) {
    simulations.delete(code);
  }

  return true;
}

export function startSimulation(code: string): boolean {
  const simulation = getSimulation(code);
  if (!simulation) return false;

  simulation.status = 'active';
  simulation.startedAt = Date.now();
  return true;
}

export function clearSimulations(): void {
  simulations.clear();
}