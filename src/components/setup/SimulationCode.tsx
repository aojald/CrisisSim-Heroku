import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, AlertTriangle } from 'lucide-react';

interface Props {
  code: string;
}

export default function SimulationCode({ code }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-blue-50 rounded-lg p-6 mb-6 border border-blue-100">
      <h3 className="text-lg font-medium text-blue-900 mb-4">Simulation Code</h3>
      <div className="flex flex-col items-center">
        {/* QR Code Limitation Notice */}
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start">
          <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            <strong>Note:</strong> QR code scanning is currently not available due to deployment limitations. 
            Please share the code manually instead.
          </p>
        </div>
        <QRCodeSVG 
          value={`${window.location.origin}?code=${code}`}
          size={160} 
          className="mb-4 opacity-50"
        />
        <div className="flex items-center space-x-2">
          <code className="bg-white px-4 py-2 rounded-lg text-lg font-mono border border-blue-200">
            {code}
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
  );
}