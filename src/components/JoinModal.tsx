import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, X, Users } from 'lucide-react';
import { CLevel } from '../types';

interface Props {
  code: string;
  onClose: () => void;
  onJoin: (name: string, role: CLevel) => void;
}

const roles: CLevel[] = ['CEO', 'CFO', 'COO', 'CIO', 'CISO', 'HR Director', 'CLO', 'CCO'];

export default function JoinModal({ code, onClose, onJoin }: Props) {
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<CLevel | ''>('');
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join/${code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && selectedRole) {
      onJoin(name, selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-blue-600 mr-2" />
            <h2 className="text-lg font-semibold">Join Simulation</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex flex-col items-center mb-6">
            <QRCodeSVG value={joinUrl} size={200} />
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 mb-2">Simulation Code:</p>
              <div className="flex items-center justify-center space-x-2">
                <code className="bg-gray-100 px-3 py-1 rounded-lg text-lg font-mono">
                  {code}
                </code>
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-500" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as CLevel)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={!name || !selectedRole}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Join Simulation
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}