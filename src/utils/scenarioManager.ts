import { parse, stringify } from 'yaml';
import { Scenario } from '../types';

// Cache for loaded scenarios
let scenariosCache: Scenario[] | null = null;

export async function validateScenario(scenario: any): Promise<string[]> {
  const errors: string[] = [];
  
  // Required fields
  const requiredFields = [
    'id', 'type', 'title', 'description', 'industry', 'companySize',
    'severity', 'timeline', 'regulatoryRequirements', 'prerequisites'
  ];

  requiredFields.forEach(field => {
    if (!scenario[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });

  // Validate arrays
  if (!Array.isArray(scenario.industry)) {
    errors.push('Industry must be an array');
  }
  if (!Array.isArray(scenario.companySize)) {
    errors.push('Company size must be an array');
  }
  if (!Array.isArray(scenario.timeline)) {
    errors.push('Timeline must be an array');
  }

  // Validate timeline
  scenario.timeline?.forEach((decision: any, index: number) => {
    if (!decision.id) errors.push(`Decision ${index + 1}: Missing ID`);
    if (!decision.text) errors.push(`Decision ${index + 1}: Missing text`);
    if (!decision.timeLimit) errors.push(`Decision ${index + 1}: Missing time limit`);
    if (!decision.options?.length) errors.push(`Decision ${index + 1}: No options defined`);
    
    decision.options?.forEach((option: any, optIndex: number) => {
      if (!option.id) errors.push(`Decision ${index + 1}, Option ${optIndex + 1}: Missing ID`);
      if (!option.text) errors.push(`Decision ${index + 1}, Option ${optIndex + 1}: Missing text`);
      if (!option.impact) errors.push(`Decision ${index + 1}, Option ${optIndex + 1}: Missing impact`);
      
      // Validate impact values
      if (option.impact) {
        ['compliance', 'stakeholder', 'business', 'time'].forEach(metric => {
          const value = option.impact[metric];
          if (typeof value !== 'number' || value < 0 || value > 100) {
            errors.push(`Decision ${index + 1}, Option ${optIndex + 1}: Invalid ${metric} impact value`);
          }
        });
      }
    });
  });

  return errors;
}

async function loadYamlScenarios(): Promise<Scenario[]> {
  const scenarios: Scenario[] = [];
  
  // Import all YAML files from the scenarios directory
  const modules = import.meta.glob('../data/scenarios/*.yaml', { eager: true, as: 'raw' });
  
  for (const path in modules) {
    try {
      const content = modules[path] as string;
      const scenario = parse(content) as Scenario;
      const validationErrors = await validateScenario(scenario);
      if (validationErrors.length === 0) {
        scenarios.push(scenario);
      } else {
        console.error(`Validation errors in ${path}:`, validationErrors);
      }
    } catch (error) {
      console.error(`Error loading scenario from ${path}:`, error);
    }
  }
  
  return scenarios;
}

export async function loadScenarios(): Promise<Scenario[]> {
  try {
    // Always load fresh data, don't use cache for now to ensure consistency
    const yamlScenarios = await loadYamlScenarios();
    const scenarios = [...yamlScenarios];

    // Load custom scenarios from localStorage
    const storageScenarios: Scenario[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('scenario-')) {
        try {
          const content = localStorage.getItem(key);
          if (content) {
            const scenario = parse(content) as Scenario;
            const validationErrors = await validateScenario(scenario);
            if (validationErrors.length === 0) {
              // Replace any YAML scenario with the same ID (local version takes precedence)
              const existingIndex = scenarios.findIndex(s => s.id === scenario.id);
              if (existingIndex >= 0) {
                scenarios[existingIndex] = scenario;
              } else {
                scenarios.push(scenario);
              }
              storageScenarios.push(scenario);
            }
          }
        } catch (error) {
          console.error(`Error parsing scenario from localStorage: ${key}`, error);
        }
      }
    }

    // Update cache with the latest data
    scenariosCache = scenarios;
    return scenarios;
  } catch (error) {
    console.error('Failed to load scenarios:', error);
    return [];
  }
}

export async function saveScenario(scenario: Scenario): Promise<boolean> {
  try {
    // Validate before saving
    const validationErrors = await validateScenario(scenario);
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return false;
    }

    // Clear the cache immediately
    scenariosCache = null;
    
    // Generate YAML content
    const yamlContent = stringify(scenario);
    
    // Save to localStorage with proper error handling
    try {
      localStorage.setItem(`scenario-${scenario.id}`, yamlContent);
    } catch (storageError) {
      console.error('Failed to save to localStorage:', storageError);
      return false;
    }

    // Verify the save was successful by reading it back
    const savedContent = localStorage.getItem(`scenario-${scenario.id}`);
    if (!savedContent || savedContent !== yamlContent) {
      console.error('Save verification failed');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Failed to save scenario:', error);
    return false;
  }
}

export function exportScenarioToYaml(scenario: Scenario): string {
  return stringify(scenario);
}

export function parseYamlScenario(yamlContent: string): Scenario | null {
  try {
    const scenario = parse(yamlContent);
    const validationErrors = validateScenario(scenario);
    
    if (validationErrors.length > 0) {
      console.error('Validation errors:', validationErrors);
      return null;
    }
    
    return scenario as Scenario;
  } catch (error) {
    console.error('Failed to parse YAML scenario:', error);
    return null;
  }
}

export function clearCache() {
  scenariosCache = null;
}