import { EventEmitter } from '../utils/eventEmitter';
import { Scenario, Player, SimulationStatus } from '../types';
import wsClient from '../utils/socket';

class SimulationStore extends EventEmitter {
  private static instance: SimulationStore;
  private simulations: Map<string, SimulationData> = new Map();
  private currentCode: string | null = null;
  private currentPlayerId: string | null = null;

  private constructor() {
    super();
    this.setupSocketHandlers();
  }

  static getInstance(): SimulationStore {
    if (!SimulationStore.instance) {
      SimulationStore.instance = new SimulationStore();
    }
    return SimulationStore.instance;
  }

  private setupSocketHandlers() {
    wsClient.on('simulation_state', (data) => {
      this.updateSimulationState(data);
    });

    wsClient.on('player_joined', (data) => {
      this.handlePlayerJoined(data);
    });

    wsClient.on('player_left', (data) => {
      this.handlePlayerLeft(data);
    });

    wsClient.on('simulation_started', (data) => {
      this.handleSimulationStarted(data);
    });
  }

  async joinSimulation(code: string): Promise<boolean> {
    try {
      if (!wsClient.isConnected()) {
        await wsClient.connect();
      }

      const upperCode = code.toUpperCase();
      this.currentCode = upperCode;

      // Request initial state
      await wsClient.requestState();
      return true;
    } catch (error) {
      console.error('Failed to join simulation:', error);
      return false;
    }
  }

  async joinAsPlayer(code: string, name: string, role: string): Promise<boolean> {
    try {
      const playerId = `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      this.currentPlayerId = playerId;

      const joined = await wsClient.joinSimulation(code, playerId, name, role);
      return joined;
    } catch (error) {
      console.error('Failed to join as player:', error);
      return false;
    }
  }

  private updateSimulationState(data: any) {
    if (!this.currentCode) return;

    const simulation = {
      ...data,
      code: this.currentCode,
      lastUpdate: Date.now()
    };

    this.simulations.set(this.currentCode, simulation);
    this.emit('stateUpdated', simulation);
  }

  private handlePlayerJoined(data: any) {
    if (!this.currentCode) return;
    
    const simulation = this.simulations.get(this.currentCode);
    if (!simulation) return;

    simulation.players = [...simulation.players, data.player];
    this.emit('playerJoined', data.player);
  }

  private handlePlayerLeft(data: any) {
    if (!this.currentCode) return;
    
    const simulation = this.simulations.get(this.currentCode);
    if (!simulation) return;

    simulation.players = simulation.players.filter(p => p.id !== data.playerId);
    this.emit('playerLeft', data.playerId);
  }

  private handleSimulationStarted(data: any) {
    this.updateSimulationState({
      ...data,
      status: 'active'
    });
    this.emit('simulationStarted', data);
  }

  getCurrentSimulation(): SimulationData | null {
    return this.currentCode ? this.simulations.get(this.currentCode) || null : null;
  }

  getCurrentPlayer(): Player | null {
    const simulation = this.getCurrentSimulation();
    return simulation?.players.find(p => p.id === this.currentPlayerId) || null;
  }

  cleanup() {
    this.currentCode = null;
    this.currentPlayerId = null;
    this.simulations.clear();
    wsClient.close();
  }
}

interface SimulationData {
  code: string;
  scenario: Scenario;
  players: Player[];
  status: SimulationStatus;
  startedAt: number;
  lastUpdate: number;
}

export const simulationStore = SimulationStore.getInstance();