import React, { useState } from 'react';
import { X, Search, Shield, Brush as Virus, DollarSign, Zap, Server, UserX, Database, Mail, Lock, Link } from 'lucide-react';

const cyberTerms = {
  'Ransomware': {
    icon: <Lock className="w-5 h-5 text-red-600 dark:text-red-400" />,
    definition: 'Malicious software that encrypts files and demands payment for decryption',
    impact: 'System lockout, data loss, operational disruption',
    examples: ['WannaCry', 'NotPetya', 'Ryuk']
  },
  'Data Breach': {
    icon: <Database className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
    definition: 'Unauthorized access to sensitive or confidential data',
    impact: 'Privacy violations, regulatory fines, reputation damage',
    examples: ['Customer PII exposure', 'Financial data theft', 'Trade secret compromise']
  },
  'DDoS Attack': {
    icon: <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />,
    definition: 'Overwhelming systems with traffic to cause service disruption',
    impact: 'Service outages, customer dissatisfaction, revenue loss',
    examples: ['Network flooding', 'Application layer attacks', 'DNS amplification']
  },
  'Phishing': {
    icon: <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    definition: 'Deceptive attempts to steal sensitive information',
    impact: 'Credential theft, unauthorized access, malware infection',
    examples: ['Email spoofing', 'CEO fraud', 'Spear phishing']
  },
  'Malware': {
    icon: <Virus className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    definition: 'Malicious software designed to harm systems or steal data',
    impact: 'System damage, data theft, performance degradation',
    examples: ['Trojans', 'Worms', 'Spyware']
  },
  'Insider Threat': {
    icon: <UserX className="w-5 h-5 text-pink-600 dark:text-pink-400" />,
    definition: 'Security risks from within the organization',
    impact: 'Data leaks, sabotage, intellectual property theft',
    examples: ['Disgruntled employees', 'Negligent staff', 'Compromised accounts']
  },
  'Zero-Day Exploit': {
    icon: <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />,
    definition: 'Attack using previously unknown software vulnerability',
    impact: 'System compromise before patches available',
    examples: ['Browser exploits', 'Operating system vulnerabilities', 'Application flaws']
  },
  'Supply Chain Attack': {
    icon: <Link className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />,
    definition: 'Compromising organizations through vendor/partner systems',
    impact: 'Widespread compromise, third-party risk',
    examples: ['Software update poisoning', 'Vendor system compromise', 'Third-party breaches']
  }
};

interface Props {
  onClose: () => void;
}

export default function CyberGuide({ onClose }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);

  const filteredTerms = Object.entries(cyberTerms).filter(([term]) =>
    term.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Cyber Security Quick Reference</h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search cyber security terms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {filteredTerms.map(([term, info]) => (
            <div
              key={term}
              className={`rounded-lg border transition-all duration-200 cursor-pointer ${
                selectedTerm === term
                  ? 'border-blue-500 dark:border-blue-400 shadow-md'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-600 hover:shadow-sm'
              }`}
              onClick={() => setSelectedTerm(selectedTerm === term ? null : term)}
            >
              <div className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {info.icon}
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{term}</h3>
                </div>

                <p className="text-gray-600 dark:text-gray-300 text-sm mb-3">
                  {info.definition}
                </p>

                {selectedTerm === term && (
                  <div className="mt-4 space-y-4 animate-fade-in">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Business Impact</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{info.impact}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Common Examples</h4>
                      <ul className="space-y-1">
                        {info.examples.map((example, index) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                            <div className="w-1.5 h-1.5 bg-blue-400 dark:bg-blue-500 rounded-full mr-2"></div>
                            {example}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}