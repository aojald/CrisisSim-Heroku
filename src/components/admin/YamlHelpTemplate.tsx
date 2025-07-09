import React from 'react';
import { FileText, Copy } from 'lucide-react';

export default function YamlHelpTemplate() {
  const template = `# Example Crisis Scenario Template
# This template demonstrates a complete 10-decision point scenario structure

# Basic Scenario Information
type: Ransomware                    # Type of incident (Ransomware|DataBreach|DDoS|InsiderThreat|FinancialFraud)
id: scenario-template-001           # Unique identifier for the scenario
title: Critical Infrastructure Attack    # Display title for the scenario
description: >                      # Detailed scenario description
  A sophisticated ransomware attack has encrypted critical infrastructure systems.
  The attackers are demanding a significant ransom payment and threatening
  to leak sensitive data.

# Target Organization Profiles
industry:                          # List of applicable industries
  - Technology
  - Healthcare
  - Finance
companySize:                       # List of applicable company sizes
  - Medium
  - Large
severity: Critical                 # Incident severity (Low|Medium|High|Critical)

# Timeline of Decision Points
timeline:
  # Decision Point 1: Initial Response
  - id: d1
    text: >
      IT team reports complete encryption of critical systems and ransom demand received.
      How do you proceed with the initial response?
    timeLimit: 300                 # Time limit in seconds for this decision
    roleContext:                   # Role-specific context for each decision
      CEO: Focus on strategic impact and stakeholder confidence
      CFO: Consider financial implications of ransom vs. recovery
      COO: Evaluate operational impact and continuity options
      CIO: Assess technical damage and recovery capabilities
      CISO: Analyze attack vectors and containment strategies
      HR Director: Plan for workforce communication and impact
      CLO: Review legal obligations and reporting requirements
      CCO: Prepare external communication strategy
    options:                       # Available choices for this decision
      - id: o1
        text: Immediately engage incident response team and notify law enforcement
        impact:                    # Impact scores (0-100) for different aspects
          compliance: 90
          stakeholder: 85
          business: 75
          time: 80
        feedback: >
          Excellent choice. Quick engagement of IR team and law enforcement
          is critical for proper incident handling.
        requiredResources:         # Resources needed for this option
          - id: ir-plan
            name: Incident Response Plan
            type: procedure        # procedure|contact|documentation|tool|clearance
            description: Documented procedures for handling cyber incidents
            required: true

  # Decision Point 2: Communication Strategy
  - id: d2
    text: >
      Media has caught wind of the incident. How do you handle external communications?
    timeLimit: 240
    roleContext:
      CEO: Consider reputational impact and investor relations
      CFO: Evaluate market impact and financial disclosures
      COO: Assess impact on customer operations
      CIO: Provide technical details for public statement
      CISO: Advise on security details to disclose
      HR Director: Manage internal communication alignment
      CLO: Review legal implications of public statements
      CCO: Develop comprehensive communication strategy
    options:
      - id: o1
        text: Issue preliminary statement acknowledging incident investigation
        impact:
          compliance: 85
          stakeholder: 90
          business: 80
          time: 85
        feedback: Transparent communication helps maintain stakeholder trust
        requiredResources: []

  # [Additional decision points 3-10 would follow the same structure...]

# Compliance Requirements
regulatoryRequirements:
  - Data breach notification within 72 hours
  - Maintain detailed incident logs
  - Preserve evidence for investigation
  - Report to relevant authorities
  - Document recovery procedures

# Required Preparations
prerequisites:
  - Incident Response Plan
  - Business Continuity Plan
  - Crisis Communication Plan
  - Cyber Insurance Policy

# Reference Materials
supportingDocuments:
  - id: ir-plan
    title: Incident Response Plan
    url: https://example.com/ir-plan
    type: pdf
  - id: comm-plan
    title: Crisis Communication Plan
    url: https://example.com/comm-plan
    type: pdf`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(template);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="w-6 h-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold text-gray-900">YAML Template Guide</h2>
        </div>
        <button
          onClick={handleCopyTemplate}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Copy className="w-4 h-4 mr-1.5" />
          Copy Template
        </button>
      </div>

      <div className="prose prose-sm max-w-none">
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
          <h3 className="text-blue-800 font-medium mb-2">Template Structure</h3>
          <ul className="text-blue-700 space-y-1 list-disc list-inside">
            <li>Basic scenario information (type, title, description)</li>
            <li>Target organization profiles (industry, size)</li>
            <li>10 decision points with role-specific context</li>
            <li>Multiple options per decision with impact scores</li>
            <li>Required resources and prerequisites</li>
            <li>Compliance requirements and supporting documents</li>
          </ul>
        </div>

        <div className="relative">
          <pre className="bg-gray-50 rounded-lg p-4 overflow-x-auto text-sm">
            <code className="language-yaml whitespace-pre-wrap">{template}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}