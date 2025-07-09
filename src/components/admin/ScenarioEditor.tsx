import React, { useState, useEffect } from 'react';
import { Scenario, Decision, CLevel, Option, Resource, Industry, CompanySize, ScenarioType } from '../../types';
import { Edit2, Plus, Trash2, Save, ChevronDown, ChevronUp, AlertTriangle, Download, Building2, Users, FileText, HelpCircle, Eye, X } from 'lucide-react';
import { saveScenario, exportScenarioToYaml } from '../../utils/scenarioManager';
import YamlHelpTemplate from './YamlHelpTemplate';
import ScenarioPreview from './ScenarioPreview';
import AutoResizeTextarea from '../AutoResizeTextarea';

// Define the scenario types
const scenarioTypes: ScenarioType[] = ['Ransomware', 'DataBreach', 'DDoS', 'InsiderThreat', 'FinancialFraud'];

// Define available industries and company sizes
const availableIndustries: Industry[] = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing'];
const availableCompanySizes: CompanySize[] = ['Small', 'Medium', 'Large'];

// Define the roles
const roles: CLevel[] = ['CEO', 'CFO', 'COO', 'CIO', 'CISO', 'HR Director', 'CLO', 'CCO'];

// Define resource types
const resourceTypes = ['procedure', 'contact', 'documentation', 'tool', 'clearance'];

interface Props {
  scenario: Scenario;
  onSave: (updatedScenario: Scenario) => void;
  onCancel: () => void;
}

// Initialize empty scenario structure
const createEmptyScenario = (): Scenario => ({
  id: `scenario-${Date.now()}`,
  type: 'Ransomware',
  title: '',
  description: '',
  industry: [],
  companySize: [],
  severity: 'Medium',
  timeline: [],
  regulatoryRequirements: [],
  prerequisites: [],
  supportingDocuments: []
});

// Initialize empty decision structure
const createEmptyDecision = (): Decision => ({
  id: `d${Date.now()}`,
  text: '',
  roleContext: {
    CEO: '',
    CFO: '',
    COO: '',
    CIO: '',
    CISO: '',
    'HR Director': '',
    CLO: '',
    CCO: ''
  },
  options: [],
  timeLimit: 300,
  requiredResources: []
});

// Initialize empty option structure
const createEmptyOption = (): Option => ({
  id: `o${Date.now()}`,
  text: '',
  impact: {
    compliance: 0,
    stakeholder: 0,
    business: 0,
    time: 0
  },
  feedback: '',
  requiredResources: []
});

// Initialize empty resource structure
const createEmptyResource = (): Resource => ({
  id: `r${Date.now()}`,
  name: '',
  type: 'procedure',
  description: '',
  required: false
});

export default function ScenarioEditor({ scenario, onSave, onCancel }: Props) {
  // Initialize scenario with proper structure
  const [editedScenario, setEditedScenario] = useState<Scenario>(() => {
    const initialScenario = { ...createEmptyScenario(), ...scenario };
    // Ensure timeline has proper structure
    initialScenario.timeline = initialScenario.timeline.map(decision => ({
      ...createEmptyDecision(),
      ...decision,
      requiredResources: decision.requiredResources || [],
      options: (decision.options || []).map(option => ({
        ...createEmptyOption(),
        ...option,
        requiredResources: option.requiredResources || []
      }))
    }));
    return initialScenario;
  });

  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showHelpButton, setShowHelpButton] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowHelpButton(scrollPosition < 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const validateScenario = (): string[] => {
    const errors: string[] = [];
    
    if (!editedScenario.title.trim()) {
      errors.push('Scenario title is required');
    }
    if (!editedScenario.description.trim()) {
      errors.push('Scenario description is required');
    }
    if (editedScenario.industry.length === 0) {
      errors.push('At least one industry must be selected');
    }
    if (editedScenario.companySize.length === 0) {
      errors.push('At least one company size must be selected');
    }
    if (editedScenario.timeline.length === 0) {
      errors.push('At least one decision point is required');
    }

    editedScenario.timeline.forEach((decision, index) => {
      if (!decision.text.trim()) {
        errors.push(`Decision point ${index + 1} text is required`);
      }
      if (decision.options.length === 0) {
        errors.push(`Decision point ${index + 1} must have at least one option`);
      }
      if (decision.timeLimit <= 0) {
        errors.push(`Decision point ${index + 1} must have a valid time limit`);
      }
      decision.options.forEach((option, optIndex) => {
        if (!option.text.trim()) {
          errors.push(`Option ${optIndex + 1} in decision point ${index + 1} text is required`);
        }
        Object.entries(option.impact).forEach(([key, value]) => {
          if (isNaN(value) || value < 0 || value > 100) {
            errors.push(`Invalid ${key} impact value for option ${optIndex + 1} in decision point ${index + 1}`);
          }
        });
      });
    });

    return errors;
  };

  const handleTimelineChange = (index: number, updatedDecision: Decision) => {
    const newTimeline = [...editedScenario.timeline];
    newTimeline[index] = updatedDecision;
    setEditedScenario({ ...editedScenario, timeline: newTimeline });
    setHasUnsavedChanges(true);
  };

  const handleRoleContextChange = (decisionIndex: number, role: CLevel, value: string) => {
    const newTimeline = [...editedScenario.timeline];
    const decision = newTimeline[decisionIndex];
    decision.roleContext = {
      ...decision.roleContext,
      [role]: value
    };
    setEditedScenario({ ...editedScenario, timeline: newTimeline });
    setHasUnsavedChanges(true);
  };

  const addDecisionPoint = () => {
    const newDecision = createEmptyDecision();
    setEditedScenario({
      ...editedScenario,
      timeline: [...editedScenario.timeline, newDecision]
    });
    setExpandedStep(newDecision.id);
    setHasUnsavedChanges(true);
  };

  const addOption = (decisionIndex: number) => {
    const newOption = createEmptyOption();
    const newTimeline = [...editedScenario.timeline];
    newTimeline[decisionIndex].options.push(newOption);
    setEditedScenario({ ...editedScenario, timeline: newTimeline });
    setHasUnsavedChanges(true);
  };

  const handleImpactChange = (
    decisionIndex: number,
    optionIndex: number,
    impactType: keyof Option['impact'],
    value: string
  ) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    const clampedValue = Math.max(0, Math.min(100, numValue));
    
    const newTimeline = [...editedScenario.timeline];
    const option = newTimeline[decisionIndex].options[optionIndex];
    option.impact = {
      ...option.impact,
      [impactType]: clampedValue
    };
    
    setEditedScenario({ ...editedScenario, timeline: newTimeline });
    setHasUnsavedChanges(true);
  };

  const handleTimeLimitChange = (decisionIndex: number, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    const clampedValue = Math.max(0, numValue);
    
    const newTimeline = [...editedScenario.timeline];
    newTimeline[decisionIndex].timeLimit = clampedValue;
    setEditedScenario({ ...editedScenario, timeline: newTimeline });
    setHasUnsavedChanges(true);
  };

  const removeDecisionPoint = (index: number) => {
    if (window.confirm('Are you sure you want to delete this decision point?')) {
      const newTimeline = editedScenario.timeline.filter((_, i) => i !== index);
      setEditedScenario({ ...editedScenario, timeline: newTimeline });
      setHasUnsavedChanges(true);
    }
  };

  const removeOption = (decisionIndex: number, optionIndex: number) => {
    if (window.confirm('Are you sure you want to delete this option?')) {
      const newTimeline = [...editedScenario.timeline];
      newTimeline[decisionIndex].options = newTimeline[decisionIndex].options.filter((_, i) => i !== optionIndex);
      setEditedScenario({ ...editedScenario, timeline: newTimeline });
      setHasUnsavedChanges(true);
    }
  };

  const addResource = (decisionIndex: number) => {
    const newResource = createEmptyResource();
    const newTimeline = [...editedScenario.timeline];
    newTimeline[decisionIndex].requiredResources.push(newResource);
    setEditedScenario({ ...editedScenario, timeline: newTimeline });
    setHasUnsavedChanges(true);
  };

  const updateResource = (decisionIndex: number, resourceIndex: number, updates: Partial<Resource>) => {
    const newTimeline = [...editedScenario.timeline];
    const decision = newTimeline[decisionIndex];
    decision.requiredResources[resourceIndex] = {
      ...decision.requiredResources[resourceIndex],
      ...updates
    };
    setEditedScenario({ ...editedScenario, timeline: newTimeline });
    setHasUnsavedChanges(true);
  };

  const removeResource = (decisionIndex: number, resourceIndex: number) => {
    if (window.confirm('Are you sure you want to delete this resource?')) {
      const newTimeline = [...editedScenario.timeline];
      newTimeline[decisionIndex].requiredResources = newTimeline[decisionIndex].requiredResources.filter((_, i) => i !== resourceIndex);
      setEditedScenario({ ...editedScenario, timeline: newTimeline });
      setHasUnsavedChanges(true);
    }
  };

  const handleExportYaml = () => {
    try {
      const yamlContent = exportScenarioToYaml(editedScenario);
      const blob = new Blob([yamlContent], { type: 'text/yaml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${editedScenario.id}.yaml`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export YAML:', error);
      setValidationErrors(['Failed to export scenario to YAML. Please try again.']);
    }
  };

  const handleSave = async () => {
    const errors = validateScenario();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      setValidationErrors([]);
      const success = await saveScenario(editedScenario);
      if (success) {
        onSave(editedScenario);
        setHasUnsavedChanges(false);
      } else {
        setValidationErrors(['Failed to save scenario. Please try again.']);
      }
    } catch (error) {
      console.error('Failed to save scenario:', error);
      setValidationErrors(['An unexpected error occurred while saving. Please try again.']);
    }
  };

  const handleIndustryToggle = (industry: Industry) => {
    const newIndustries = editedScenario.industry.includes(industry)
      ? editedScenario.industry.filter(i => i !== industry)
      : [...editedScenario.industry, industry];
    
    setEditedScenario({ ...editedScenario, industry: newIndustries });
    setHasUnsavedChanges(true);
  };

  const handleCompanySizeToggle = (size: CompanySize) => {
    const newSizes = editedScenario.companySize.includes(size)
      ? editedScenario.companySize.filter(s => s !== size)
      : [...editedScenario.companySize, size];
    
    setEditedScenario({ ...editedScenario, companySize: newSizes });
    setHasUnsavedChanges(true);
  };

  const renderResourceManager = (decisionIndex: number) => {
    const decision = editedScenario.timeline[decisionIndex];
    if (!decision) return null;

    if (!decision.requiredResources) {
      const updatedDecision = {
        ...decision,
        requiredResources: []
      };
      const newTimeline = [...editedScenario.timeline];
      newTimeline[decisionIndex] = updatedDecision;
      setEditedScenario({ ...editedScenario, timeline: newTimeline });
      return null;
    }

    return (
      <div className="mt-4 border-t pt-4">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-medium text-gray-900">Required Resources</h4>
          <button
            onClick={() => addResource(decisionIndex)}
            className="btn btn-secondary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Resource
          </button>
        </div>

        <div className="space-y-4">
          {decision.requiredResources.map((resource, resourceIndex) => (
            <div key={resource.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Resource Name</label>
                  <input
                    type="text"
                    value={resource.name}
                    onChange={(e) => updateResource(decisionIndex, resourceIndex, { name: e.target.value })}
                    className="input"
                    placeholder="Resource Name"
                  />
                </div>

                <div>
                  <label className="label">Type</label>
                  <select
                    value={resource.type}
                    onChange={(e) => updateResource(decisionIndex, resourceIndex, { type: e.target.value as Resource['type'] })}
                    className="input"
                  >
                    {resourceTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Description</label>
                  <AutoResizeTextarea
                    value={resource.description}
                    onChange={(e) => updateResource(decisionIndex, resourceIndex, { description: e.target.value })}
                    className="textarea w-full"
                    placeholder="Resource Description"
                  />
                </div>

                <div className="md:col-span-2 flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={resource.required}
                      onChange={(e) => updateResource(decisionIndex, resourceIndex, { required: e.target.checked })}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Required Resource</span>
                  </label>

                  <button
                    onClick={() => removeResource(decisionIndex, resourceIndex)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 relative pb-24">
      {/* Fixed Help Button */}
      <div className={`fixed bottom-6 right-6 z-50 transition-opacity duration-300 ${
        showHelpButton ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <HelpCircle className="w-5 h-5 mr-2" />
          {showHelp ? 'Hide Template' : 'Show Template'}
        </button>
      </div>

      {/* Help Template Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">YAML Template Guide</h2>
              <button
                onClick={() => setShowHelp(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <YamlHelpTemplate />
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <ScenarioPreview
          scenario={editedScenario}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Main Editor Content */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {editedScenario.title || 'New Scenario'}
          </h2>
        </div>

        {/* Basic Information */}
        <div className="space-y-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">Title</label>
              <input
                type="text"
                value={editedScenario.title}
                onChange={(e) => {
                  setEditedScenario({ ...editedScenario, title: e.target.value });
                  setHasUnsavedChanges(true);
                }}
                className="input"
                placeholder="Scenario Title"
              />
            </div>

            <div>
              <label className="label">Type</label>
              <select
                value={editedScenario.type}
                onChange={(e) => {
                  setEditedScenario({ ...editedScenario, type: e.target.value as ScenarioType });
                  setHasUnsavedChanges(true);
                }}
                className="input"
              >
                {scenarioTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="label">Description</label>
            <AutoResizeTextarea
              value={editedScenario.description}
              onChange={(e) => {
                setEditedScenario({ ...editedScenario, description: e.target.value });
                setHasUnsavedChanges(true);
              }}
              className="textarea w-full"
              placeholder="Scenario Description"
            />
          </div>

          {/* Industry Selection */}
          <div>
            <label className="label flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-500" />
              Applicable Industries
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
              {availableIndustries.map((industry) => (
                <button
                  key={industry}
                  onClick={() => handleIndustryToggle(industry)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    editedScenario.industry.includes(industry)
                      ? 'bg-blue-100 text-blue-700 border-2 border-blue-200'
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  {industry}
                </button>
              ))}
            </div>
          </div>

          {/* Company Size Selection */}
          <div>
            <label className="label flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-500" />
              Applicable Company Sizes
            </label>
            <div className="grid grid-cols-3 gap-2">
              {availableCompanySizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleCompanySizeToggle(size)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    editedScenario.companySize.includes(size)
                      ? 'bg-green-100 text-green-700 border-2 border-green-200'
                      : 'bg-gray-50 text-gray-600 border-2 border-gray-100 hover:bg-gray-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Decision Points ({editedScenario.timeline.length})
            </h3>
            <button
              onClick={addDecisionPoint}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Decision Point
            </button>
          </div>

          {editedScenario.timeline.map((decision, index) => (
            <div key={decision.id} className="bg-white border rounded-lg shadow-sm">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedStep(expandedStep === decision.id ? null : decision.id)}
              >
                <div className="flex items-center space-x-3">
                  <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full font-medium">
                    {index + 1}
                  </span>
                  <h4 className="font-medium text-gray-900 line-clamp-1">
                    {decision.text || 'New Decision Point'}
                  </h4>
                </div>
                {expandedStep === decision.id ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </div>

              {expandedStep === decision.id && (
                <div className="border-t p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="label">Decision Text</label>
                      <AutoResizeTextarea
                        value={decision.text}
                        onChange={(e) => {
                          const updatedDecision = { ...decision, text: e.target.value };
                          handleTimelineChange(index, updatedDecision);
                        }}
                        className="textarea w-full"
                        placeholder="Describe the decision point..."
                      />
                    </div>

                    <div>
                      <label className="label">Time Limit (seconds)</label>
                      <input
                        type="number"
                        value={decision.timeLimit}
                        onChange={(e) => handleTimeLimitChange(index, e.target.value)}
                        className="input w-32"
                        min="0"
                      />
                    </div>

                    {/* Role Context */}
                    <div className="border-t pt-4">
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Role-Specific Context</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {roles.map((role) => (
                          <div key={role}>
                            <label className="label">{role}</label>
                            <AutoResizeTextarea
                              value={decision.roleContext[role] || ''}
                              onChange={(e) => handleRoleContextChange(index, role, e.target.value)}
                              className="textarea w-full"
                              placeholder={`Context specific to ${role}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Options */}
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-medium text-gray-900">Options</h4>
                        <button
                          onClick={() => addOption(index)}
                          className="btn btn-secondary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Option
                        </button>
                      </div>

                      <div className="space-y-4">
                        {decision.options.map((option, optionIndex) => (
                          <div key={option.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-4">
                              <AutoResizeTextarea
                                value={option.text}
                                onChange={(e) => {
                                  const newOptions = [...decision.options];
                                  newOptions[optionIndex] = { ...option, text: e.target.value };
                                  const updatedDecision = { ...decision, options: newOptions };
                                  handleTimelineChange(index, updatedDecision);
                                }}
                                className="textarea flex-1 mr-4"
                                placeholder="Option text"
                              />
                              <button
                                onClick={() => removeOption(index, optionIndex)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                              {Object.entries(option.impact).map(([key, value]) => (
                                <div key={key}>
                                  <label className="label capitalize">
                                    {key} Impact
                                  </label>
                                  <input
                                    type="number"
                                    value={value}
                                    onChange={(e) => handleImpactChange(index, optionIndex, key as keyof Option['impact'], e.target.value)}
                                    className="input"
                                    min="0"
                                    max="100"
                                  />
                                </div>
                              ))}
                            </div>

                            <div>
                              <label className="label">Feedback</label>
                              <AutoResizeTextarea
                                value={option.feedback}
                                onChange={(e) => {
                                  const newOptions = [...decision.options];
                                  newOptions[optionIndex] = { ...option, feedback: e.target.value };
                                  const updatedDecision = { ...decision, options: newOptions };
                                  handleTimelineChange(index, updatedDecision);
                                }}
                                className="textarea w-full"
                                placeholder="Feedback for this option"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Required Resources Section */}
                    {renderResourceManager(index)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            <h3 className="font-medium text-red-800">Please fix the following errors:</h3>
          </div>
          <ul className="list-disc list-inside text-sm text-re d-700">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Fixed Action Buttons */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-white px-6 py-3 rounded-lg shadow-lg border border-gray-200">
        <button
          onClick={() => setShowPreview(true)}
          className="btn btn-secondary"
        >
          <Eye className="w-4 h-4 mr-2" />
          Preview Flow
        </button>
        <button
          onClick={handleExportYaml}
          className="btn btn-secondary"
        >
          <Download className="w-4 h-4 mr-2" />
          Export YAML
        </button>
        <button
          onClick={handleSave}
          disabled={!hasUnsavedChanges}
          className={`btn ${
            hasUnsavedChanges
              ? 'btn-primary'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </button>
      </div>
    </div>
  );
}