import React, { useCallback } from 'react';
import { Upload, FileWarning, CheckCircle } from 'lucide-react';
import { Scenario } from '../../types';
import { parseYamlScenario, saveScenario } from '../../utils/scenarioManager';

interface Props {
  onScenarioUpload: (scenarios: Scenario[]) => void;
}

export default function ScenarioUpload({ onScenarioUpload }: Props) {
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const scenarios: Scenario[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const content = await file.text();
        const scenario = parseYamlScenario(content);
        
        if (scenario) {
          scenarios.push(scenario);
          await saveScenario(scenario);
        } else {
          errors.push(`Failed to parse ${file.name}`);
        }
      } catch (err) {
        errors.push(`Error processing ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    if (scenarios.length > 0) {
      onScenarioUpload(scenarios);
      setSuccess(`Successfully uploaded ${scenarios.length} scenario(s)`);
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      setError(null);
    }
  }, [onScenarioUpload]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Upload Scenarios</h2>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">
            Drag and drop your YAML scenario files here, or click to select
          </p>
          <input
            type="file"
            accept=".yaml,.yml"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
            multiple
          />
          <label
            htmlFor="file-upload"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
          >
            Select Files
          </label>
          <p className="text-sm text-gray-500 mt-2">
            Supported formats: YAML (.yaml, .yml)
          </p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 rounded-md flex items-start">
            <FileWarning className="w-5 h-5 text-red-400 mr-2 flex-shrink-0 mt-0.5" />
            <pre className="text-sm text-red-700 whitespace-pre-wrap">{error}</pre>
          </div>
        )}

        {success && (
          <div className="mt-4 p-4 bg-green-50 rounded-md flex items-start">
            <CheckCircle className="w-5 h-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}
      </div>
    </div>
  );
}