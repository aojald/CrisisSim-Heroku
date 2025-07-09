import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';
import { existsSync } from 'fs';
import { userService } from './database.js';

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

// Add JSON parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Add security headers
app.use((req, res, next) => {
  // CORS headers
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  // Security headers
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }

  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  debug('Health check requested');
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Store failed login attempts for basic rate limiting
const failedAttempts = new Map();

// Simple rate limiting function
const checkRateLimit = (ip) => {
  const now = Date.now();
  const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: now };

  // Reset counter if 15 minutes have passed
  if (now - attempts.lastAttempt > 15 * 60 * 1000) {
    attempts.count = 0;
  }

  // Check if rate limit exceeded
  if (attempts.count >= 5) {
    return false;
  }

  return true;
};

// Record failed attempt
const recordFailedAttempt = (ip) => {
  const now = Date.now();
  const attempts = failedAttempts.get(ip) || { count: 0, lastAttempt: now };
  attempts.count += 1;
  attempts.lastAttempt = now;
  failedAttempts.set(ip, attempts);
};

// Authentication endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip || req.connection.remoteAddress;

    debug(`Login attempt from ${clientIp} for user: ${username}`);

    // Check rate limiting
    if (!checkRateLimit(clientIp)) {
      debug(`Rate limit exceeded for ${clientIp}`);
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.'
      });
    }

    // Validate required fields
    if (!username || !password) {
      debug('Missing username or password');
      recordFailedAttempt(clientIp);
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    // Simulate authentication delay (prevent timing attacks)
    await new Promise(resolve => setTimeout(resolve, 800));

    // Validate credentials using database
    const user = await userService.validateCredentials(username, password);

    if (!user) {
      debug(`Invalid credentials for user: ${username}`);
      recordFailedAttempt(clientIp);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    // User info is already returned from validateCredentials
    const userInfo = user;

    debug(`Successful login for user: ${username}`);

    // Clear failed attempts on successful login
    failedAttempts.delete(clientIp);

    res.json({
      success: true,
      user: userInfo,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    debug('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    debug('No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // In a real app, you'd verify a JWT token here
    // For now, we'll use a simple session-based approach
    const username = req.headers['x-username'];

    if (!username) {
      return res.status(401).json({ error: 'Username required' });
    }

    const user = await userService.getUserByUsername(username);
    if (!user) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    debug('Authentication error:', error);
    res.status(403).json({ error: 'Invalid token' });
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    debug(`Non-admin user ${req.user?.username} attempted admin action`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Admin API endpoints
// Get all users
app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    debug(`Admin ${req.user.username} requested all users`);
    const users = await userService.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    debug('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Create new user
app.post('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    debug(`Admin ${req.user.username} creating user: ${username}`);

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Username and password are required'
      });
    }

    const user = await userService.createUser(username, password, role || 'user');
    debug(`User created successfully: ${username}`);

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    debug('Error creating user:', error);
    if (error.message === 'User already exists') {
      res.status(409).json({ success: false, error: 'User already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create user' });
    }
  }
});

// Update user
app.put('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;

    debug(`Admin ${req.user.username} updating user: ${id}`);

    const updates = {};
    if (username) updates.username = username;
    if (password) updates.password = password;
    if (role) updates.role = role;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No updates provided'
      });
    }

    const user = await userService.updateUser(parseInt(id), updates);
    debug(`User updated successfully: ${id}`);

    res.json({ success: true, user });
  } catch (error) {
    debug('Error updating user:', error);
    if (error.message === 'User not found') {
      res.status(404).json({ success: false, error: 'User not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to update user' });
    }
  }
});

// Delete user
app.delete('/api/admin/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    debug(`Admin ${req.user.username} deleting user: ${id}`);

    // Prevent admin from deleting themselves
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    await userService.deleteUser(parseInt(id));
    debug(`User deleted successfully: ${id}`);

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    debug('Error deleting user:', error);
    if (error.message === 'User not found') {
      res.status(404).json({ success: false, error: 'User not found' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to delete user' });
    }
  }
});

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  const distPath = join(__dirname, '../dist');
  debug(`Serving static files from: ${distPath}`);
  debug(`Dist directory exists: ${existsSync(distPath)}`);

  // Serve static files
  app.use(express.static(distPath));

  // Handle React Router routes - send all non-API requests to index.html
  app.get('*', (req, res) => {
    // Skip socket.io paths
    if (req.path.startsWith('/socket.io')) {
      return res.status(404).send('Not found');
    }

    debug(`Serving React app for: ${req.path}`);
    const indexPath = join(__dirname, '../dist/index.html');

    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      debug('index.html not found');
      res.status(404).send('Application not found');
    }
  });
}

// Create HTTP server with Express app
const server = createServer(app);

// Get port from environment or default to 3001
const PORT = process.env.PORT || 3001;

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

// Start server with proper error handling
server.listen(PORT, '0.0.0.0', () => {
  debug(`Socket.IO server is running on port ${PORT}`);
  debug(`Environment: ${process.env.NODE_ENV || 'development'}`);
}).on('error', (err) => {
  console.error('Server failed to start:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  debug('SIGTERM received, shutting down gracefully');
  server.close(() => {
    debug('Process terminated');
    process.exit(0);
  });
});