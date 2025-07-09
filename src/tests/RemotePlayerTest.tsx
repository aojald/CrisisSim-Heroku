import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import { SimulationProvider } from '../context/SimulationContext';
import { ThemeProvider } from '../context/ThemeContext';
import JoinSimulation from '../components/JoinSimulation';
import Simulation from '../components/Simulation';
import wsClient from '../utils/websocket';
import { clearSimulations, createSimulation } from '../utils/simulationManager';

// Mock WebSocket
class MockWebSocket {
  onopen: (() => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: any) => void) | null = null;
  readyState = WebSocket.CONNECTING;

  constructor() {
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 0);
  }

  send(data: string) {
    const message = JSON.parse(data);
    // Simulate server responses based on message type
    if (message.type === 'join') {
      this.simulateJoinResponse(message.data);
    } else if (message.type === 'decision') {
      this.simulateDecisionResponse(message.data);
    }
  }

  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }

  private simulateJoinResponse(data: any) {
    const response = {
      type: 'simulation_state',
      data: {
        code: data.code,
        scenario: data.scenario,
        players: [data.player],
        status: 'active',
        startedAt: Date.now()
      }
    };
    this.onmessage?.({ data: JSON.stringify(response) });
  }

  private simulateDecisionResponse(data: any) {
    const response = {
      type: 'decision_ack',
      data: { decisionId: data.decision.decisionId }
    };
    this.onmessage?.({ data: JSON.stringify(response) });
  }
}

// Mock scenario data
const mockScenario = {
  id: 'test-scenario',
  type: 'Ransomware',
  title: 'Test Scenario',
  description: 'Test scenario description',
  industry: ['Technology'],
  companySize: ['Medium'],
  severity: 'High',
  timeline: [
    {
      id: 'decision-1',
      text: 'Test decision 1',
      timeLimit: 300,
      roleContext: {
        CEO: 'CEO context',
        CFO: 'CFO context',
        COO: 'COO context',
        CIO: 'CIO context',
        CISO: 'CISO context',
        'HR Director': 'HR context',
        CLO: 'CLO context',
        CCO: 'CCO context'
      },
      options: [
        {
          id: 'option-1',
          text: 'Option 1',
          impact: {
            compliance: 80,
            stakeholder: 70,
            business: 60,
            time: 90
          },
          feedback: 'Option 1 feedback'
        }
      ],
      requiredResources: [
        {
          id: 'resource-1',
          name: 'Test Resource',
          type: 'procedure',
          description: 'Test resource description',
          required: true
        }
      ]
    }
  ],
  regulatoryRequirements: ['Requirement 1'],
  prerequisites: ['Prerequisite 1'],
  supportingDocuments: []
};

describe('Remote Player Experience', () => {
  beforeEach(() => {
    // Clear any existing simulations
    clearSimulations();
    
    // Reset WebSocket client
    wsClient.close();
    
    // Mock WebSocket
    global.WebSocket = MockWebSocket as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('Join simulation with valid code', async () => {
    // Create a test simulation
    const code = 'TEST123';
    createSimulation(mockScenario, [{ role: 'CEO', name: 'Test Player' }], code);

    const { container } = render(
      <ThemeProvider>
        <SimulationProvider>
          <JoinSimulation />
        </SimulationProvider>
      </ThemeProvider>
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.queryByText('Connecting to simulation...')).toBeNull();
    });

    // Verify available roles are displayed
    expect(screen.getByText('Available Roles')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();

    // Select role and join
    fireEvent.click(screen.getByText('CEO'));
    fireEvent.click(screen.getByText('Join Simulation'));

    // Verify successful join
    await waitFor(() => {
      expect(screen.queryByText('Joining...')).toBeNull();
    });

    // Verify simulation view is rendered
    expect(container.querySelector('.simulation-view')).toBeInTheDocument();
  });

  test('Visual elements are correctly displayed', async () => {
    render(
      <ThemeProvider>
        <SimulationProvider>
          <Simulation />
        </SimulationProvider>
      </ThemeProvider>
    );

    // Verify main interface elements
    expect(screen.getByText('Decision Point 1')).toBeInTheDocument();
    expect(screen.getByText(mockScenario.timeline[0].text)).toBeInTheDocument();
    
    // Verify answer options
    expect(screen.getByText('Option 1')).toBeInTheDocument();
    
    // Verify progress indicators
    expect(container.querySelector('.progress-indicator')).toBeInTheDocument();
    
    // Verify confidence rating
    expect(screen.getByText('Rate your confidence level')).toBeInTheDocument();
    
    // Verify resource selection
    expect(screen.getByText('Test Resource')).toBeInTheDocument();
  });

  test('User interaction flow', async () => {
    render(
      <ThemeProvider>
        <SimulationProvider>
          <Simulation />
        </SimulationProvider>
      </ThemeProvider>
    );

    // Select confidence rating
    fireEvent.click(screen.getByText('4'));
    
    // Select resource
    fireEvent.click(screen.getByText('Test Resource'));
    
    // Select answer option
    fireEvent.click(screen.getByText('Option 1'));

    // Verify feedback is displayed
    await waitFor(() => {
      expect(screen.getByText('Option 1 feedback')).toBeInTheDocument();
    });

    // Verify progress update
    expect(screen.getByText('Progress: 100%')).toBeInTheDocument();
  });

  test('Error handling and recovery', async () => {
    // Simulate connection error
    const mockWs = new MockWebSocket();
    mockWs.onerror?.({ message: 'Connection failed' });

    render(
      <ThemeProvider>
        <SimulationProvider>
          <JoinSimulation />
        </SimulationProvider>
      </ThemeProvider>
    );

    // Verify error message
    await waitFor(() => {
      expect(screen.getByText('Failed to connect to simulation server. Please try again.')).toBeInTheDocument();
    });

    // Verify retry button
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  test('State synchronization', async () => {
    const code = 'TEST123';
    const simulation = createSimulation(mockScenario, [{ role: 'CEO', name: 'Test Player' }], code);

    // Simulate another player's progress
    simulation.players[0].currentStep = 1;
    
    render(
      <ThemeProvider>
        <SimulationProvider>
          <Simulation />
        </SimulationProvider>
      </ThemeProvider>
    );

    // Verify synchronized state
    await waitFor(() => {
      expect(screen.getByText('Decision Point 2')).toBeInTheDocument();
    });
  });

  test('Visual transitions', async () => {
    render(
      <ThemeProvider>
        <SimulationProvider>
          <Simulation />
        </SimulationProvider>
      </ThemeProvider>
    );

    // Select an option
    fireEvent.click(screen.getByText('Option 1'));

    // Verify transition classes
    await waitFor(() => {
      expect(container.querySelector('.animate-fade-in')).toBeInTheDocument();
    });
  });
});