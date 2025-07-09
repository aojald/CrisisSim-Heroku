import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug logging function
const debug = (message, data = null) => {
  const timestamp = new Date().toISOString();
  console.log(`🔌 [${timestamp}] SERVER: ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

console.log('🚀 Starting Socket.IO server...');

// Create Express app
const app = express();

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  
  // Handle React Router routes - send all non-API requests to index.html
  app.get('*', (req, res) => {
    if (req.path.startsWith('/socket.io')) {
      return; // Let socket.io handle its own routes
    }
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  debug('Health check requested');
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Create HTTP server with Express app
const server = createServer(app);

// Create Socket.IO server with proper CORS
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["*"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  path: '/socket.io'
});

// Store active simulations
const simulations = new Map();

// Validate decision data
function validateDecision(decision, simulation, player) {
  if (!decision || !simulation || !player) {
    return false;
  }

  // Get current decision point
  const currentStep = player.currentStep || 0;
  const timeline = simulation.scenario?.timeline;
  if (!timeline || !timeline[currentStep]) {
    return false;
  }

  const currentDecision = timeline[currentStep];

  // Validate decision matches current step
  if (decision.decisionId !== currentDecision.id) {
    debug('Decision ID mismatch', {
      expected: currentDecision.id,
      received: decision.decisionId
    });
    return false;
  }

  // Validate option exists
  const validOption = currentDecision.options.some(opt => opt.id === decision.optionId);
  if (!validOption) {
    debug('Invalid option ID', { optionId: decision.optionId });
    return false;
  }

  // Validate confidence level
  if (!decision.confidenceLevel || decision.confidenceLevel < 1 || decision.confidenceLevel > 5) {
    debug('Invalid confidence level', { confidenceLevel: decision.confidenceLevel });
    return false;
  }

  // Validate response time
  if (typeof decision.responseTime !== 'number' || decision.responseTime < 0) {
    debug('Invalid response time', { responseTime: decision.responseTime });
    return false;
  }

  return true;
}

// Check if all players have responded
function checkAllPlayersResponded(simulation) {
  if (!simulation || !simulation.players) return false;
  debug('Checking all players responded:', {
    mode: simulation.mode,
    playerCount: simulation.players.size
  });

  // For single player, always return true
  if (simulation.mode === 'single') {
    debug('Single player mode - auto-advancing');
    return true;
  }

  // For multiplayer, check all players
  const currentResponses = new Set();
  simulation.players.forEach(player => {
    if (player.responses && player.responses.length > player.currentStep) {
      currentResponses.add(player.id);
    }
  });
  debug(`Player responses: ${currentResponses.size}/${simulation.players.size}`);
  return currentResponses.size === simulation.players.size;
}

// Advance simulation to next step
function advanceSimulation(simulation) {
  if (!simulation) return;
  debug('Advancing simulation:', { 
    code: simulation.code, 
    mode: simulation.mode,
    playerCount: simulation.players.size
  });
  
  const isSinglePlayer = simulation.mode === 'single';
  
  simulation.players.forEach(player => {
    player.currentStep = (player.currentStep || 0) + 1;
    debug(`Advancing player ${player.id} to step ${player.currentStep}`);
    const currentStep = player.currentStep;
    // Delay both emissions together
    setTimeout(() => {
      io.to(simulation.code).emit('advance_simulation', { 
              playerId: player.id,
              mode: isSinglePlayer ? 'single' : 'multi',
              timestamp: Date.now(),
              step: currentStep
            });
            debug(`Emitted advance_simulation to room ${simulation.code} for player ${player.id}`);
      
            // Always emit updated state with all player data
            io.to(simulation.code).emit('simulation_state', {
              players: Array.from(simulation.players.values()),
              scenario: simulation.scenario,
              status: simulation.status,
              mode: simulation.mode,
              startedAt: simulation.startedAt,
              roles: simulation.roles,
              hostId: simulation.hostId,
              currentStep
            });
            debug(`Emitted simulation_state to room ${simulation.code} for player ${player.id}`);
          }, 100); // 100ms delay to avoid race condition
        });
  
  // Check if simulation is complete
  const isComplete = Array.from(simulation.players.values()).every(player => 
    (player.currentStep ?? 0) >= simulation.scenario.timeline.length
  );

  if (isComplete) {
    simulation.status = 'completed';
    debug('Simulation completed:', { code: simulation.code });
    io.to(simulation.code).emit('simulation_completed', {
      code: simulation.code,
      players: Array.from(simulation.players.values())
    });
  }
}

// Handle socket connections
io.on('connection', (socket) => {
  debug(`New client connected: ${socket.id}`);
  
  let simulationCode = null;
  let playerId = null;

// New peek_simulation handler
  socket.on('peek_simulation', (data, callback) => {
    try {
      debug('Received peek_simulation request:', data);
      const { code } = data;
      const simulation = simulations.get(code);

      if (!simulation) {
        debug(`Simulation ${code} not found for peek`);
        callback?.({ error: 'Simulation not found' });
        return;
      }

      const stateData = {
        players: Array.from(simulation.players.values()),
        scenario: simulation.scenario,
        status: simulation.status,
        startedAt: simulation.startedAt,
        roles: simulation.roles,
        mode: simulation.mode,
        hostId: simulation.hostId
      };

      debug(`Sending simulation peek state for ${code}:`, stateData);
      callback?.({ success: true, state: stateData });
    } catch (err) {
      debug('Error in peek_simulation:', err);
      callback?.({ error: 'Failed to peek simulation state' });
    }
  });
  
  // Join simulation handler
  socket.on('join_simulation', async (data, callback) => {
    try {
      debug('Received join_simulation request:', data);
      
      const { code, player, scenario, isHost } = data;
      simulationCode = code;
      playerId = player.id;

      // Join socket room
      socket.join(code);
      debug(`Client ${socket.id} joined room: ${code}`);

      // Create or get simulation
      if (!simulations.has(code)) {
        if (!isHost) {
          debug(`Simulation ${code} not found for non-host join`);
          callback?.({ error: 'Simulation not found' });
          return;
        }
        debug(`Creating new simulation: ${code}`);
        simulations.set(code, {
          code: code, // Explicitly set the code property
          players: new Map(),
          scenario,
          startedAt: Date.now(),
          status: 'waiting',
          roles: data.roles || [],
          mode: data.mode || 'multi',
          hostId: playerId
        });
      }

      const simulation = simulations.get(code);
      debug(`Current simulation state:`, simulation);
      
      // Ensure simulation.code is set (for older simulations if any)
      if (!simulation.code) {
        simulation.code = code;
      }
      // Add player
      simulation.players.set(player.id, {
        ...player,
        socketId: socket.id,
        isHost,
        currentStep: 0,
        responses: [],
        lastActivity: Date.now()
      });

      // Update role assignment
      const role = simulation.roles.find(r => r.role === player.role);
      if (role) {
        role.assigned = true;
        role.playerId = player.id;
      }

      // Send join acknowledgment
      debug(`Sending join acknowledgment to ${socket.id}`);
      callback?.({ success: true });
      socket.emit('join_ack', { playerId: player.id });

      // Send current state to new player
      const stateData = {
        players: Array.from(simulation.players.values()),
        scenario: simulation.scenario,
        status: simulation.status,
        startedAt: simulation.startedAt,
        roles: simulation.roles,
        mode: simulation.mode,
        hostId: simulation.hostId
      };
      debug(`Sending simulation state to ${socket.id}:`, stateData);
      socket.emit('simulation_state', stateData);

      // Notify others about new player
      debug(`Broadcasting player_joined event for ${player.id}`);
      socket.to(code).emit('player_joined', { player });

      // For single player, start immediately
      if (simulation.mode === 'single') {
        debug(`Starting single-player simulation ${code}`);
        const stateData = {
          players: Array.from(simulation.players.values()),
          scenario: simulation.scenario,
          status: 'active',
          startedAt: simulation.startedAt,
          hostId: simulation.hostId,
          mode: 'single'
        };
        simulation.status = 'active';
        io.to(code).emit('simulation_started', stateData);
        socket.emit('simulation_state', stateData);
      }
    } catch (err) {
      debug(`Error in join_simulation:`, err);
      callback?.({ error: err.message || 'Failed to join simulation' });
    }
  });

  // Handle decision
  socket.on('decision', (data, callback) => {
    try {
      debug('Received decision:', data);
      
      const { code, playerId, decision } = data;
      const simulation = simulations.get(code);
      
      if (!simulation) {
        callback?.({ error: 'Simulation not found' });
        return;
      }

      const player = simulation.players.get(playerId);
      if (!player) {
        callback?.({ error: 'Player not found' });
        return;
      }

      // Validate decision
      if (!validateDecision(decision, simulation, player)) {
        callback?.({ error: 'Invalid decision data' });
        return;
      }

      // Add decision to player's responses
      player.responses = player.responses || [];
      player.responses.push(decision);
      player.lastActivity = Date.now();

      // Broadcast decision to all players
      io.to(code).emit('decision_made', {
        playerId,
        decision
      });

      debug('Checking if all players have responded');
      const allResponded = checkAllPlayersResponded(simulation);
      debug('All players responded:', allResponded);

      // For single player or when all players have responded
      if (simulation.mode === 'single' || allResponded) {
        debug('All players have responded, advancing simulation');
        advanceSimulation(simulation);
      }
      
      // Send success response
      callback?.({ success: true });
    } catch (err) {
      debug('Error processing decision:', err);
      callback?.({ error: err.message || 'Failed to process decision' });
    }
  });

  // Start simulation handler
  socket.on('start_simulation', (data, callback) => {
    try {
      debug('Received start_simulation request:', data);
      
      const { code } = data;
      const simulation = simulations.get(code);
      
      if (!simulation) {
        debug(`Simulation ${code} not found for start request`);
        callback?.({ error: 'Simulation not found' });
        return;
      }

      // Only host can start
      const player = simulation.players.get(playerId);
      if (!player?.isHost) {
        debug(`Non-host player ${playerId} attempted to start simulation`);
        callback?.({ error: 'Only host can start simulation' });
        return;
      }

      simulation.status = 'active';
      simulation.startedAt = Date.now();

      const stateData = {
        scenario: simulation.scenario,
        players: Array.from(simulation.players.values()),
        status: 'active',
        startedAt: simulation.startedAt,
        hostId: simulation.hostId
      };

      debug(`Starting simulation ${code}:`, stateData);
      io.to(code).emit('simulation_started', stateData);
      callback?.({ success: true });
    } catch (err) {
      debug(`Error in start_simulation:`, err);
      callback?.({ error: 'Failed to start simulation' });
    }
  });

  // Handle state request
  socket.on('get_state', (data, callback) => {
    try {
      debug('Received get_state request:', data);
      const { code, playerId } = data;
      const simulation = simulations.get(code);

      if (!simulation) {
        debug(`Simulation ${code} not found for get_state`);
        callback?.({ error: 'Simulation not found' });
        return;
      }

      const player = simulation.players.get(playerId);
      if (!player) {
        debug(`Player ${playerId} not found in simulation ${code}`);
        callback?.({ error: 'Player not found' });
        return;
      }

      const stateData = {
        players: Array.from(simulation.players.values()),
        scenario: simulation.scenario,
        status: simulation.status,
        startedAt: simulation.startedAt,
        roles: simulation.roles,
        mode: simulation.mode,
        hostId: simulation.hostId
      };

      debug(`Sending simulation state for ${code}:`, stateData);
      callback?.({ success: true, state: stateData });
    } catch (err) {
      debug('Error in get_state:', err);
      callback?.({ error: 'Failed to get simulation state' });
    }
  });

  // Handle ping
  socket.on('ping', (callback) => {
    debug(`Received ping from ${socket.id}`);
    callback?.({ success: true });
  });

  // Handle chat messages
  socket.on('chat_message', (data, callback) => {
    try {
      debug('Received chat message:', data);
      
      const { code, message } = data;
      const simulation = simulations.get(code);
      
      if (!simulation) {
        callback?.({ error: 'Simulation not found' });
        return;
      }

      // Validate message
      if (!message || !message.text || !message.playerId) {
        callback?.({ error: 'Invalid message data' });
        return;
      }

      // Verify player is in simulation
      const player = simulation.players.get(message.playerId);
      if (!player) {
        callback?.({ error: 'Player not found in simulation' });
        return;
      }

      // Broadcast message to all players in the simulation
      debug(`Broadcasting chat message to simulation ${code}`);
      io.to(code).emit('chat_message', {
        message: {
          ...message,
          timestamp: Date.now()
        }
      });

      // Send success response
      callback?.({ success: true });
    } catch (err) {
      debug('Error processing chat message:', err);
      callback?.({ error: err.message || 'Failed to process chat message' });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    debug(`Client disconnected: ${socket.id}`);
    
    if (simulationCode && playerId) {
      const simulation = simulations.get(simulationCode);
      if (simulation) {
        // Remove player
        simulation.players.delete(playerId);
        debug(`Removed player ${playerId} from simulation ${simulationCode}`);

        // Update role assignment
        const role = simulation.roles.find(r => r.playerId === playerId);
        if (role) {
          role.assigned = false;
          role.playerId = undefined;
          debug(`Unassigned role ${role.role} from player ${playerId}`);
        }

        // Notify others
        io.to(simulationCode).emit('player_left', {
          simulationId: simulationCode,
          playerId
        });

        // Clean up empty simulations
        if (simulation.players.size === 0) {
          simulations.delete(simulationCode);
          debug(`Removed empty simulation ${simulationCode}`);
        }
      }
    }
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  debug(`Socket.IO server is running on port ${PORT}`);
  debug(`Environment: ${process.env.NODE_ENV || 'development'}`);
});