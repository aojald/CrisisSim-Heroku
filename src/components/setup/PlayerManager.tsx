import React, { useState } from 'react';
import { CLevel } from '../../types';
import { UserPlus, X } from 'lucide-react';

const roles: CLevel[] = ['CEO', 'CFO', 'COO', 'CIO', 'CISO', 'HR Director', 'CLO', 'CCO'];

interface Props {
  players: Array<{ name: string; role: CLevel }>;
  setPlayers: React.Dispatch<React.SetStateAction<Array<{ name: string; role: CLevel }>>>;
  initialRole?: CLevel;
  maxPlayers?: number;
  singlePlayer?: boolean;
  availableRoles?: CLevel[];
}

export default function PlayerManager({ players, setPlayers, initialRole, maxPlayers = 8, singlePlayer = false, availableRoles }: Props) {
  // Calculate selectable roles first
  const selectableRoles = availableRoles 
    ? availableRoles.filter(role => !players.some(p => p.role === role))
    : roles.filter(role => !players.some(p => p.role === role));

  const [newPlayer, setNewPlayer] = useState<{ name: string; role: CLevel }>({
    name: '',
    role: initialRole || selectableRoles[0] || roles[0]
  });
  const [playerError, setPlayerError] = useState<string | null>(null);

  // Update the selected role when availableRoles changes
  React.useEffect(() => {
    if (availableRoles && !availableRoles.includes(newPlayer.role)) {
      const firstAvailable = selectableRoles[0];
      if (firstAvailable) {
        setNewPlayer(prev => ({ ...prev, role: firstAvailable }));
      }
    }
  }, [availableRoles, newPlayer.role, selectableRoles]);
  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    setPlayerError(null);

    if (!newPlayer.name.trim()) {
      setPlayerError('Please enter a player name');
      return;
    }

    // Check if role is available when availableRoles is provided
    if (availableRoles && !availableRoles.includes(newPlayer.role)) {
      setPlayerError('This role is not available. Please choose an available role.');
      return;
    }
    
    // Only check against existing players if availableRoles is not provided (for local player management)
    if (!availableRoles && players.some(p => p.role === newPlayer.role)) {
      setPlayerError('This role is already taken');
      return;
    }

    if (players.length >= maxPlayers) {
      setPlayerError('Maximum number of players reached');
      return;
    }

    setPlayers([...players, { ...newPlayer }]);
    
    // Reset form with next available role
    const nextAvailableRoles = availableRoles 
      ? availableRoles.filter(role => !players.some(p => p.role === role) && role !== newPlayer.role)
      : roles.filter(role => !players.some(p => p.role === role) && role !== newPlayer.role);
    
    setNewPlayer({
      name: '',
      role: nextAvailableRoles[0] || roles[0]
    });
  };

  const handleRemovePlayer = (index: number) => {
    const removedRole = players[index].role;
    setPlayers(players.filter((_, i) => i !== index));
    
    // If current role is not available, update form
    if (newPlayer.role === removedRole) {
      setNewPlayer(prev => ({ ...prev, role: removedRole }));
    }
  };


  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-violet-100 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {singlePlayer ? 'Player Information' : 'Players'}
      </h3>
      
      {(!singlePlayer || players.length === 0) && (
        <form onSubmit={handleAddPlayer} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              value={newPlayer.name}
              onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
              placeholder="Player name"
              className="input"
            />
            <div className="flex gap-2">
              <select
                value={newPlayer.role}
                onChange={(e) => setNewPlayer({ ...newPlayer, role: e.target.value as CLevel })}
                className="input flex-1"
                disabled={selectableRoles.length === 0}
              >
                {selectableRoles.length === 0 ? (
                  <option value="">No roles available</option>
                ) : (
                  selectableRoles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                  ))
                )}
              </select>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!newPlayer.name.trim() || selectableRoles.length === 0}
              >
                <UserPlus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {playerError && (
            <p className="text-sm text-red-500 mt-2">{playerError}</p>
          )}
        </form>
      )}

      <div className="space-y-2">
        {players.map((player, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <p className="font-medium text-gray-900">{player.name}</p>
              <p className="text-sm text-gray-600">{player.role}</p>
            </div>
            {(!singlePlayer || players.length > 1) && (
              <button
                onClick={() => handleRemovePlayer(index)}
                className="text-red-500 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}