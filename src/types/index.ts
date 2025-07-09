export type CLevel = 'CEO' | 'CFO' | 'COO' | 'CIO' | 'CISO' | 'HR Director' | 'CLO' | 'CCO';
export type Industry = 'Technology' | 'Healthcare' | 'Finance' | 'Retail' | 'Manufacturing';
export type CompanySize = 'Small' | 'Medium' | 'Large';
export type ScenarioType = 'Ransomware' | 'DataBreach' | 'DDoS' | 'InsiderThreat' | 'FinancialFraud';
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;
export type SeverityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type SimulationStatus = 'configuring' | 'waiting' | 'ready' | 'active' | 'completed';

export interface Player {
  id: string;
  role: CLevel;
  name: string;
  responses: UserResponse[];
  currentStep: number;
  score: {
    compliance: number;
    stakeholder: number;
    business: number;
    timeManagement: number;
  };
}

export interface Resource {
  id: string;
  name: string;
  type: 'procedure' | 'contact' | 'documentation' | 'tool' | 'clearance';
  description: string;
  required: boolean;
}

export interface Option {
  id: string;
  text: string;
  impact: {
    compliance: number;
    stakeholder: number;
    business: number;
    time: number;
  };
  feedback: string;
  requiredResources: Resource[];
}

export interface Decision {
  id: string;
  text: string;
  roleContext: Record<CLevel, string>;
  options: Option[];
  timeLimit: number;
  requiredResources: Resource[];
}

export interface Scenario {
  id: string;
  type: ScenarioType;
  title: string;
  description: string;
  industry: Industry[];
  companySize: CompanySize[];
  severity: SeverityLevel;
  timeline: Decision[];
  regulatoryRequirements: string[];
  prerequisites: string[];
  supportingDocuments: {
    id: string;
    title: string;
    url: string;
    type: string;
  }[];
}

export interface UserResponse {
  decisionId: string;
  optionId: string;
  responseTime: number;
  confidenceLevel: ConfidenceLevel;
  availableResources: string[];
}

export interface SimulationState {
  players: Player[];
  industry: Industry | null;
  companySize: CompanySize | null;
  currentScenario: Scenario | null;
  currentPlayerId: string | null;
  simulationStarted: boolean;
  simulationCode: string | null;
  simulationStatus: SimulationStatus;
}