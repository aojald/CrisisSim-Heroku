import { io, Socket } from 'socket.io-client';
import { EventEmitter } from './eventEmitter';

export const debug = (message: string, data: any = null) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] CLIENT: ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

class SocketClient extends EventEmitter {
  private socket: Socket | null = null;
  private code: string | null = null;
  private playerId: string | null = null;
  private connectionPromise: Promise<void> | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 3;
  private readonly requestTimeout = 30000;
  private readonly pingIntervalTime = 30000;
  private isConnecting = false;

  async connect(): Promise<void> {
    if (this.socket?.connected) {
      debug('Socket already connected, ensuring handlers are set');
      this.setupEventHandlers(); // Re-ensure handlers
      return Promise.resolve();
    }

    if (this.isConnecting && this.connectionPromise) {
      debug('Already connecting, returning existing promise');
      return this.connectionPromise;
    }

    this.isConnecting = true;
    this.connectionPromise = new Promise((resolve, reject) => {
      try {
        debug('Attempting to connect socket');

        this.cleanup(); // Clean up any existing socket

        this.socket = io('/', {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 5000,
          path: '/socket.io',
          autoConnect: true
        });

        this.socket.on('connect', () => {
          debug(`Socket connected with ID: ${this.socket?.id}`);
          this.isConnecting = false;
          this.connectionPromise = null;
          this.reconnectAttempts = 0;
          this.startPingInterval();
          this.setupEventHandlers(); // Re-register handlers on connect
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          debug('Socket connection error:', error);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.cleanup();
            this.isConnecting = false;
            this.connectionPromise = null;
            reject(new Error('Failed to connect after multiple attempts'));
          }
        });

        this.socket.on('disconnect', (reason) => {
          debug(`Socket disconnected: ${reason}`);
          this.handleDisconnect();
        });

        this.socket.on('error', (error) => {
          debug('Socket error:', error);
          this.handleError(error);
        });

      } catch (error) {
        debug('Failed to connect socket:', error);
        this.cleanup();
        this.isConnecting = false;
        this.connectionPromise = null;
        reject(error);
      }
    });

    return this.connectionPromise;
  }

  private setupEventHandlers() {
    if (!this.socket) return;
    debug('Setting up socket event handlers');
    // Remove existing listeners to prevent duplicates
    this.socket.off('simulation_state');
    this.socket.off('simulation_started');
    this.socket.off('player_joined');
    this.socket.off('player_left');
    this.socket.off('decision_made');
    this.socket.off('advance_simulation');
    this.socket.off('join_ack');

    const validateStateData = (data: any) => {
      if (!data || typeof data !== 'object') {
        return { players: [], status: 'waiting' };
      }
      return {
        players: Array.isArray(data.players) ? data.players : [],
        scenario: data.scenario || null,
        status: data.status || 'waiting',
        mode: data.mode || (data.players?.length === 1 ? 'single' : 'multi'),
        startedAt: data.startedAt || Date.now(),
        roles: Array.isArray(data.roles) ? data.roles : [],
        hostId: data.hostId || null
      };
    };

    const handlers = {
      'simulation_state': (data: any) => {
        debug('Received simulation state:', data);
        const validatedData = validateStateData(data);
        this.emit('simulation_state', validatedData);
      },
      'simulation_started': (data: any) => {
        debug('Simulation started:', data);
        const validatedData = validateStateData(data);
        this.emit('simulation_started', validatedData);
        this.emit('game_start', data);
      },
      'player_joined': (data: any) => {
        debug('Player joined:', data);
        this.emit('player_joined', data);
      },
      'player_left': (data: any) => {
        debug('Player left:', data);
        this.emit('player_left', data);
      },
      'decision_made': (data: any) => {
        debug('Decision made:', data);
        this.emit('decision_made', data);
      },
      'advance_simulation': (data: any) => {
        debug('Advance simulation received:', data);
        const advanceData = {
          ...data,
          timestamp: Date.now(),
          mode: data.mode || 'multi'
        };
        debug('Emitting advance_simulation to listeners:', advanceData);
        this.emit('advance_simulation', advanceData);
      },
      'join_ack': (data: any) => {
        debug('Join acknowledged:', data);
        this.emit('join_ack', data);
      },
      'chat_message': (data: any) => {
        debug('Received chat message:', data);
        this.emit('chat_message', data);
      }
    };
    this.socket.on('test_event', (data: any) => debug('Test event received:', data));
    Object.entries(handlers).forEach(([event, handler]) => {
      this.socket?.on(event, handler);
    });
  }

  private startPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      if (this.socket?.connected) {
        debug('Sending ping');
        this.socket.emit('ping', (response: any) => {
          debug('Ping response:', response);
        });
      } else {
        debug('Ping skipped - socket not connected');
      }
    }, this.pingIntervalTime);
  }

  private handleDisconnect() {
    this.clearIntervals();

    if (this.socket && !this.socket.disconnected) {
      this.reconnectTimer = setTimeout(() => {
        debug('Attempting to reconnect...');
        this.connect().catch(error => {
          debug('Reconnection failed:', error);
        });
      }, 1000);
    }
  }

  private handleError(error: Error) {
    debug('Socket error occurred:', error);
    this.emit('error', error);
  }

  private clearIntervals() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  async joinSimulation(
    code: string,
    playerId: string,
    playerName: string,
    playerRole: string
  ): Promise<boolean> {
    try {
      debug('Joining simulation:', { code, playerId, playerName, playerRole });

      if (!this.isConnected()) {
        await this.connect();
      }

      const upperCode = code.toUpperCase();
      this.code = upperCode;
      this.playerId = playerId;

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('Join simulation request timed out'));
        }, this.requestTimeout);

        this.socket.emit('join_simulation', {
          code: upperCode,
          player: {
            id: playerId,
            name: playerName,
            role: playerRole,
            currentStep: 0,
            responses: [],
            status: 'active',
            lastActivity: Date.now()
          }
        }, async (response: any) => {
          clearTimeout(timeout);
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            await this.requestState();
            resolve(true);
          }
        });
      });
    } catch (error) {
      debug('Failed to join simulation:', error);
      throw error;
    }
  }

  async createSimulation(
    code: string,
    playerId: string,
    playerName: string,
    playerRole: string,
    scenario: any,
    mode: 'single' | 'multi' = 'multi',
    roles: Array<{ role: string; name: string; assigned: boolean }> = []
  ): Promise<boolean> {
    try {
      debug('Creating simulation:', {
        code,
        playerId,
        playerName,
        playerRole,
        mode,
        roles
      });

      if (!this.isConnected()) {
        await this.connect();
      }

      const upperCode = code.toUpperCase();
      this.code = upperCode;
      this.playerId = playerId;

      return new Promise((resolve, reject) => {
        if (!this.socket) {
          reject(new Error('Socket not connected'));
          return;
        }

        const timeout = setTimeout(() => {
          reject(new Error('Create simulation request timed out'));
        }, this.requestTimeout);

        this.socket.emit('join_simulation', {
          code: upperCode,
          player: {
            id: playerId,
            name: playerName,
            role: playerRole,
            currentStep: 0,
            responses: [],
            status: 'active',
            lastActivity: Date.now(),
            isHost: true
          },
          scenario,
          mode,
          roles,
          isHost: true
        }, async (response: any) => {
          clearTimeout(timeout);
          if (response?.error) {
            reject(new Error(response.error));
          } else {
            await this.requestState();
            resolve(true);
          }
        });
      });
    } catch (error) {
      debug('Failed to create simulation:', error);
      throw error;
    }
  }

  async startSimulation(): Promise<void> {
    if (!this.code || !this.socket) {
      throw new Error('Not in a simulation');
    }

    debug('Starting simulation:', this.code);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Start simulation request timed out'));
      }, this.requestTimeout);

      this.socket.emit('start_simulation', {
        code: this.code
      }, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  async sendDecision(decision: any): Promise<void> {
    if (!this.code || !this.playerId || !this.socket) {
      throw new Error('Not in a simulation');
    }

    if (!this.isConnected()) {
      debug('Socket not connected, attempting to reconnect');
      await this.connect().catch(err => {
        debug('Reconnection failed:', err);
        throw err;
      });
    }

    debug('Sending decision:', decision);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        debug('Send decision timed out');
        reject(new Error('Send decision request timed out'));
      }, this.requestTimeout);

      this.socket!.emit('decision', {
        code: this.code,
        playerId: this.playerId,
        decision: {
          ...decision,
          timestamp: Date.now()
        }
      }, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) {
          debug('Decision submission failed:', response.error);
          reject(new Error(response.error));
        } else {
          debug('Decision submitted successfully');
          resolve();
        }
      });
    });
  }

  async requestState(): Promise<void> {
    if (!this.code || !this.socket) {
      throw new Error('Not in a simulation');
    }

    if (!this.isConnected()) {
      debug('Socket not connected, attempting to reconnect');
      await this.connect().catch(err => {
        debug('Reconnection failed:', err);
        throw err;
      });
    }

    debug('Requesting simulation state');
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        debug('Request state timed out');
        reject(new Error('Request state timed out'));
      }, this.requestTimeout);

      this.socket!.emit('get_state', {
        code: this.code,
        playerId: this.playerId
      }, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) {
          debug('Get state failed:', response.error);
          reject(new Error(response.error));
        } else {
          debug('Received state successfully');
          resolve();
        }
      });
    });
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  private cleanup() {
    debug('Cleaning up socket connection');
    this.clearIntervals();
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.close();
      this.socket = null;
    }
  }

  close() {
    debug('Closing socket client');
    this.cleanup();
    this.code = null;
    this.playerId = null;
    this.isConnecting = false;
    this.connectionPromise = null;
    this.reconnectAttempts = 0;
  }

  async sendChatMessage(message: any): Promise<void> {
    if (!this.code || !this.socket) {
      throw new Error('Not in a simulation');
    }

    if (!this.isConnected()) {
      debug('Socket not connected, attempting to reconnect');
      await this.connect().catch(err => {
        debug('Reconnection failed:', err);
        throw err;
      });
    }

    debug('Sending chat message:', message);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        debug('Send chat message timed out');
        reject(new Error('Send chat message request timed out'));
      }, 10000); // Increased timeout for chat messages

      this.socket!.emit('chat_message', {
        code: this.code,
        message: {
          ...message,
          timestamp: Date.now()
        }
      }, (response: any) => {
        clearTimeout(timeout);
        if (response?.error) {
          debug('Chat message submission failed:', response.error);
          reject(new Error(response.error));
        } else {
          debug('Chat message sent successfully');
          resolve();
        }
      });
    });
  }
}

export default new SocketClient();