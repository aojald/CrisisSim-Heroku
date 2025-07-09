import React, { useState, useEffect } from 'react';
import { 
  Activity, Shield, Users, Clock, Zap, 
  BarChart3, Database, AlertTriangle, CheckCircle2,
  Search, Filter, ArrowUpDown, RefreshCw, 
  Layers, PlayCircle, PauseCircle, StopCircle,
  Timer, UserCheck, UserX, Network
} from 'lucide-react';
import wsClient from '../../utils/websocket';

interface Simulation {
  id: string;
  code: string;
  startedAt: number;
  status: 'waiting' | 'active' | 'completed';
  players: Player[];
  currentStep: number;
  totalSteps: number;
  scenario?: {
    title: string;
    type: string;
    timeline: any[];
  };
}

interface Player {
  id: string;
  name: string;
  role: string;
  simulationId: string;
  currentStep: number;
  responses: any[];
  status: 'active' | 'idle' | 'disconnected';
  lastActivity: number;
  score?: {
    compliance: number;
    stakeholder: number;
    business: number;
    timeManagement: number;
  };
}

export default function MonitoringDashboard() {
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [filter, setFilter] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'status' | 'simulation'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [error, setError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const connectWebSocket = async () => {
      try {
        await wsClient.connect();
        setWsStatus('connected');
        setError(null);
      } catch (err) {
        console.error('WebSocket connection failed:', err);
        setWsStatus('disconnected');
        setError('Failed to connect to server');
        
        if (connectionAttempts < 3) {
          setTimeout(() => {
            setConnectionAttempts(prev => prev + 1);
          }, 2000);
        }
      }
    };

    connectWebSocket();

    return () => {
      wsClient.close();
    };
  }, [connectionAttempts]);

  useEffect(() => {
    // Handle simulation updates
    const handleSimulationUpdate = (data: any) => {
      if (!data || typeof data !== 'object') return;

      setSimulations(prevSims => {
        const updatedSims = [...prevSims];
        const index = updatedSims.findIndex(s => s.id === data.id);
        
        if (index >= 0) {
          updatedSims[index] = {
            ...updatedSims[index],
            ...data,
            players: data.players || updatedSims[index].players
          };
        } else {
          updatedSims.push(data);
        }
        
        return updatedSims;
      });
    };

    // Handle player updates
    const handlePlayerUpdate = (data: any) => {
      if (!data || typeof data !== 'object') return;

      setPlayers(prevPlayers => {
        const updatedPlayers = [...prevPlayers];
        const index = updatedPlayers.findIndex(p => p.id === data.id);
        
        if (index >= 0) {
          updatedPlayers[index] = { ...updatedPlayers[index], ...data };
        } else {
          updatedPlayers.push(data);
        }
        
        return updatedPlayers;
      });
    };

    // Handle simulation ended
    const handleSimulationEnded = (data: any) => {
      if (!data || !data.simulationId) return;

      setSimulations(prevSims => prevSims.filter(s => s.id !== data.simulationId));
      setPlayers(prevPlayers => prevPlayers.filter(p => p.simulationId !== data.simulationId));
    };

    // Handle player left
    const handlePlayerLeft = (data: any) => {
      if (!data || !data.playerId) return;
      setPlayers(prevPlayers => prevPlayers.filter(p => p.id !== data.playerId));
    };

    wsClient.on('simulations_update', handleSimulationUpdate);
    wsClient.on('players_update', handlePlayerUpdate);
    wsClient.on('simulation_ended', handleSimulationEnded);
    wsClient.on('player_left', handlePlayerLeft);

    // Initial data fetch
    const fetchStatus = () => {
      if (wsClient.isConnected()) {
        wsClient.sendMessage({ type: 'get_status' }).catch(err => {
          console.error('Failed to get status:', err);
          setError('Failed to fetch updates');
        });
      }
      setLastUpdate(new Date());
    };

    fetchStatus();
    const refreshInterval = setInterval(fetchStatus, 5000);

    return () => {
      clearInterval(refreshInterval);
      wsClient.off('simulations_update', handleSimulationUpdate);
      wsClient.off('players_update', handlePlayerUpdate);
      wsClient.off('simulation_ended', handleSimulationEnded);
      wsClient.off('player_left', handlePlayerLeft);
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-500 bg-green-50 border-green-200';
      case 'idle':
        return 'text-yellow-500 bg-yellow-50 border-yellow-200';
      case 'disconnected':
        return 'text-red-500 bg-red-50 border-red-200';
      default:
        return 'text-gray-500 bg-gray-50 border-gray-200';
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const getPlayerProgress = (player: Player, simulation?: Simulation) => {
    if (!simulation) {
      simulation = simulations.find(s => s.id === player.simulationId);
    }
    if (!simulation?.scenario?.timeline?.length) return 0;
    return Math.round((player.currentStep || 0) / simulation.scenario.timeline.length * 100);
  };

  const getTotalDecisions = () => {
    return players.reduce((acc, player) => {
      return acc + (player.responses?.length || 0);
    }, 0);
  };

  const getAverageResponseTime = () => {
    let totalTime = 0;
    let totalResponses = 0;

    players.forEach(player => {
      if (player.responses) {
        player.responses.forEach(response => {
          if (response.responseTime) {
            totalTime += response.responseTime;
            totalResponses++;
          }
        });
      }
    });

    return totalResponses > 0 ? Math.round(totalTime / totalResponses) : 0;
  };

  const filteredPlayers = players
    .filter(player => {
      if (!filter) return true;
      const searchTerm = filter.toLowerCase();
      return (
        player.name?.toLowerCase().includes(searchTerm) ||
        player.simulationId?.toLowerCase().includes(searchTerm) ||
        player.status?.toLowerCase().includes(searchTerm)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'time') {
        return sortOrder === 'asc' 
          ? a.lastActivity - b.lastActivity
          : b.lastActivity - a.lastActivity;
      }
      if (sortBy === 'status') {
        return sortOrder === 'asc'
          ? (a.status || '').localeCompare(b.status || '')
          : (b.status || '').localeCompare(a.status || '');
      }
      return sortOrder === 'asc'
        ? (a.simulationId || '').localeCompare(b.simulationId || '')
        : (b.simulationId || '').localeCompare(a.simulationId || '');
    });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Activity className="w-6 h-6 text-blue-600 mr-2" />
              <h1 className="text-2xl font-bold text-gray-900">Simulation Monitor</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                wsStatus === 'connected' 
                  ? 'text-green-700 bg-green-50' 
                  : 'text-red-700 bg-red-50'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  wsStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
                }`} />
                {wsStatus === 'connected' ? 'Connected' : 'Disconnected'}
              </div>
              <button 
                onClick={() => setLastUpdate(new Date())}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
          {error && (
            <div className="mt-2 text-sm text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Simulations</p>
                <p className="text-2xl font-bold text-gray-900">{simulations.filter(s => s.status === 'active').length}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <Zap className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Connected Players</p>
                <p className="text-2xl font-bold text-gray-900">{players.filter(p => p.status === 'active').length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Decisions</p>
                <p className="text-2xl font-bold text-gray-900">{getTotalDecisions()}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Last Update</p>
                <p className="text-2xl font-bold text-gray-900">{lastUpdate.toLocaleTimeString()}</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Active Simulations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Active Simulations</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Players</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Started</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {simulations.map(simulation => {
                  const simulationPlayers = players.filter(p => p.simulationId === simulation.id);
                  const avgProgress = simulationPlayers.length > 0
                    ? Math.round(simulationPlayers.reduce((acc, p) => acc + getPlayerProgress(p, simulation), 0) / simulationPlayers.length)
                    : 0;

                  return (
                    <tr key={simulation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {simulation.code}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          simulation.status === 'active'
                            ? 'bg-green-50 text-green-700'
                            : simulation.status === 'waiting'
                            ? 'bg-yellow-50 text-yellow-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}>
                          {simulation.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {simulationPlayers.length} players
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mr-2">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${avgProgress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">
                            {avgProgress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(simulation.startedAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Players List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Connected Players</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    placeholder="Search players..."
                    className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSortBy('time')}
                    className={`p-2 rounded-lg ${
                      sortBy === 'time' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSortBy('status')}
                    className={`p-2 rounded-lg ${
                      sortBy === 'status' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Player</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Simulation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPlayers.map(player => {
                  const simulation = simulations.find(s => s.id === player.simulationId);
                  const progress = getPlayerProgress(player, simulation);

                  return (
                    <tr key={`${player.id}-${player.simulationId}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-500 font-medium">
                                {player.name?.charAt(0).toUpperCase() || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{player.name}</div>
                            <div className="text-sm text-gray-500">ID: {player.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {player.role}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{simulation?.code || 'N/A'}</span>
                          <span className="text-gray-500 text-xs">{simulation?.scenario?.title || ''}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden mr-2">
                            <div 
                              className="h-full bg-blue-500 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(player.status)}`}>
                          {player.status === 'active' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                          {player.status === 'idle' && <AlertTriangle className="w-3 h-3 mr-1" />}
                          {player.status === 'disconnected' && <UserX className="w-3 h-3 mr-1" />}
                          {player.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatTime(player.lastActivity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}