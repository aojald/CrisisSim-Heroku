import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Users, Copy, Check, AlertTriangle } from 'lucide-react';
import { Scenario, CLevel } from '../../types';

interface Props {
  scenario: Scenario;
  players: Array<{ name: string; role: CLevel }>;
  simulationCode: string;
  showCode: boolean;
  onStart: () => void;
  onClose: () => void;
  isConnecting: boolean;
}

export default function StartModal({ 
  scenario, 
  players, 
  simulationCode, 
  showCode, 
  onStart, 
  onClose,
  isConnecting 
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(simulationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Configuration Complete</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Scenario</h3>
              <p className="text-gray-600">{scenario.title}</p>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Players</h3>
              <div className="space-y-2">
                {players.map((player, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{player.name}</p>
                      <p className="text-sm text-gray-600">{player.role}</p>
                    </div>
                    {index === 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                        Host
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Simulation Code Section - Only shown for multiplayer */}
            {showCode && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-4">Simulation Code</h3>
                <div className="flex flex-col items-center">
                  {/* QR Code Limitation Notice */}
                  <div className="mb-3 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start w-full">
                    <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800">
                      <strong>Note:</strong> QR code scanning is not available. Please share the code manually.
                    </p>
                  </div>
                  <QRCodeSVG 
                    value={`${window.location.origin}?code=${simulationCode}`}
                    size={160}
                    className="mb-4 opacity-50"
                  />
                  <div className="flex items-center space-x-2">
                    <code className="bg-white px-4 py-2 rounded-lg text-lg font-mono border border-blue-200">
                      {simulationCode}
                    </code>
                    <button
                      onClick={handleCopy}
                      className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      {copied ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-sm text-blue-600 mt-2">
                    Share this code with other players to join the simulation
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={onStart}
                disabled={isConnecting}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Users className="w-4 h-4 mr-2" />
                {isConnecting ? 'Connecting...' : (showCode ? 'Create Waiting Room' : 'Start Simulation')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}