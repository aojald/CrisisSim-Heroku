# Executive Cyber Crisis Simulator

## Deployment

### Heroku Deployment

1. **Prerequisites:**
   - Heroku CLI installed
   - Git repository initialized
   - Heroku account

2. **Deploy to Heroku:**
   ```bash
   # Login to Heroku
   heroku login
   
   # Create Heroku app
   heroku create your-app-name
   
   # Set environment variables
   heroku config:set NODE_ENV=production
   
   # Deploy
   git add .
   git commit -m "Deploy to Heroku"
   git push heroku main
   ```

3. **One-click Deploy:**
   [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Environment Variables

Set these environment variables in Heroku:
- `NODE_ENV=production`
- `PORT` (automatically set by Heroku)

## Scenario YAML Structure

Scenarios are defined in YAML files with the following structure:

```yaml
# Title as comment
type: ScenarioType            # One of: Ransomware, DataBreach, DDoS, InsiderThreat, FinancialFraud
id: unique-identifier         # Unique scenario identifier
title: Scenario Title         # Display title
description: Description      # Detailed scenario description
industry:                     # List of applicable industries
  - Technology
  - Healthcare
  - Finance
companySize:                  # List of applicable company sizes
  - Small
  - Medium
  - Large
severity: SeverityLevel      # One of: Low, Medium, High, Critical

timeline:                    # Array of decision points
  - id: decision-id         # Unique decision identifier
    text: Decision text     # The situation/question presented to the user
    timeLimit: 300          # Time limit in seconds
    roleContext:            # Context specific to each role
      CEO: Context for CEO
      CFO: Context for CFO
      # ... other roles
    options:                # Array of possible choices
      - id: option-id       # Unique option identifier
        text: Option text   # The choice text
        impact:             # Impact scores (0-100)
          compliance: 90
          stakeholder: 85
          business: 75
          time: 80
        feedback: Feedback text  # Feedback shown after selection
        requiredResources:   # Resources needed for this option
          - id: resource-id
            name: Resource Name
            type: procedure  # One of: procedure, contact, documentation, tool, clearance
            description: Resource description
            required: true   # Whether this resource is mandatory

regulatoryRequirements:     # List of compliance requirements
  - Requirement 1
  - Requirement 2

prerequisites:              # List of required preparations
  - Prerequisite 1
  - Prerequisite 2

supportingDocuments:        # Additional reference materials
  - id: doc-id
    title: Document Title
    url: https://example.com/doc
    type: pdf
```

### Validation Rules

1. All required fields must be present:
   - id, type, title, description
   - industry, companySize, severity
   - timeline, regulatoryRequirements, prerequisites

2. Timeline validation:
   - Each decision must have an id, text, and timeLimit
   - Each decision must have at least one option
   - Each option must have an id, text, and impact scores
   - Impact scores must be between 0 and 100

3. Resource validation:
   - Resources must have id, name, type, and description
   - Type must be one of: procedure, contact, documentation, tool, clearance

### Best Practices

1. Use descriptive IDs that reflect the content
2. Keep decision text clear and concise
3. Provide detailed role-specific context
4. Balance impact scores across options
5. Include meaningful feedback for each option