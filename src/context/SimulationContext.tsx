import React, { createContext, useContext, useReducer } from 'react';
import { SimulationState, Player, Industry, CompanySize, Scenario } from '../types';

type SimulationAction =
  | { type: 'SET_INDUSTRY'; payload: Industry }
  | { type: 'SET_COMPANY_SIZE'; payload: CompanySize }
  | { type: 'SET_SCENARIO'; payload: Scenario }
  | { type: 'ADD_PLAYER'; payload: Player }
  | { type: 'UPDATE_PLAYERS'; payload: Player[] }
  | { type: 'REMOVE_PLAYER'; payload: string }
  | { type: 'SET_CURRENT_PLAYER'; payload: string }
  | { type: 'START_SIMULATION' }
  | { type: 'RESET_SCENARIO' }
  | { type: 'SET_SIMULATION_CODE'; payload: string }
  | { type: 'ADD_RESPONSE'; payload: { playerId: string; response: any } }
  | { type: 'NEXT_STEP'; payload: { playerId: string; step: number } }
  | { type: 'UPDATE_PLAYER_STATUS'; payload: { playerId: string; status: string } }
  | { type: 'SYNC_SIMULATION_STATE'; payload: any };

const initialState: SimulationState = {
  players: [],
  industry: null,
  companySize: null,
  currentScenario: null,
  currentPlayerId: null,
  simulationStarted: false,
  simulationCode: null,
  simulationStatus: 'configuring'
};

function simulationReducer(state: SimulationState, action: SimulationAction): SimulationState {
  switch (action.type) {
    case 'SET_INDUSTRY':
      return { ...state, industry: action.payload };

    case 'SET_COMPANY_SIZE':
      return { ...state, companySize: action.payload };

    case 'SET_SCENARIO':
      return { ...state, currentScenario: action.payload };

    case 'ADD_PLAYER':
      const existingPlayer = state.players.find(p => p.id === action.payload.id);
      if (existingPlayer) {
        return {
          ...state,
          players: state.players.map(player =>
            player.id === action.payload.id
              ? { ...player, ...action.payload }
              : player
          )
        };
      }
      return {
        ...state,
        players: [...state.players, action.payload]
      };

    case 'UPDATE_PLAYERS':
      return {
        ...state,
        players: action.payload
      };

    case 'REMOVE_PLAYER':
      return {
        ...state,
        players: state.players.filter(player => player.id !== action.payload)
      };

    case 'SET_CURRENT_PLAYER':
      return { ...state, currentPlayerId: action.payload };

    case 'START_SIMULATION':
      return { 
        ...state, 
        simulationStarted: true,
        simulationStatus: 'active'
      };

    case 'RESET_SCENARIO':
      return {
        ...state,
        currentScenario: null,
        players: [],
        currentPlayerId: null,
        simulationStarted: false,
        simulationCode: null,
        simulationStatus: 'configuring'
      };

    case 'SET_SIMULATION_CODE':
      return { ...state, simulationCode: action.payload.toUpperCase() };

    case 'ADD_RESPONSE':
      console.log('ADD_RESPONSE action:', action.payload);
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.playerId
            ? {
                ...player,
                responses: [...(player.responses || []), action.payload.response]
              }
            : player
        )
      };

    case 'NEXT_STEP':
      console.log('NEXT_STEP action:', action.payload);
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.playerId
            ? { ...player, currentStep: action.payload.step }
            : player
        )
      };

    case 'UPDATE_PLAYER_STATUS':
      return {
        ...state,
        players: state.players.map(player =>
          player.id === action.payload.playerId
            ? { ...player, status: action.payload.status }
            : player
        )
      };

    case 'SYNC_SIMULATION_STATE':
      console.log('SYNC_SIMULATION_STATE action:', action.payload);
      if (!action.payload || typeof action.payload !== 'object') {
        return state;
      }
      
      const { players, scenario, status, mode } = action.payload;
      const updatedScenario = scenario ? {
        ...scenario,
        mode: mode || (players?.length === 1 ? 'single' : 'multi')
      } : state.currentScenario;
    
      // Merge incoming player data with existing data, preserving responses
      const updatedPlayers = players?.map(newPlayer => {
        const existingPlayer = state.players.find(p => p.id === newPlayer.id);
        
        // Merge responses from both sources, avoiding duplicates
        const existingResponses = existingPlayer?.responses || [];
        const newResponses = newPlayer.responses || [];
        const mergedResponses = [...existingResponses];
        
        // Add new responses that don't already exist
        newResponses.forEach(newResponse => {
          const exists = mergedResponses.some(existing => 
            existing.decisionId === newResponse.decisionId && 
            existing.timestamp === newResponse.timestamp
          );
          if (!exists) {
            mergedResponses.push(newResponse);
          }
        });
        
        return {
          ...newPlayer,
          currentStep: newPlayer.currentStep ?? existingPlayer?.currentStep ?? 0,
          responses: mergedResponses,
          score: newPlayer.score ?? existingPlayer?.score ?? {
            compliance: 0,
            stakeholder: 0,
            business: 0,
            timeManagement: 0
          }
        };
      }) || state.players;

      console.log('Updated players after sync:', updatedPlayers);
    
      return {
        ...state,
        players: updatedPlayers,
        currentScenario: updatedScenario,
        simulationStarted: status === 'active',
        simulationStatus: status === 'active' ? 'active' : state.simulationStatus
      };

    default:
      return state;
  }
}

const SimulationContext = createContext<{
  state: SimulationState;
  dispatch: React.Dispatch<SimulationAction>;
}>({
  state: initialState,
  dispatch: () => null
});

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(simulationReducer, initialState);

  return (
    <SimulationContext.Provider value={{ state, dispatch }}>
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error('useSimulation must be used within a SimulationProvider');
  }
  return context;
}