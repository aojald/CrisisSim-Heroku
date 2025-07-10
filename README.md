# Executive Cyber Crisis Simulator

A comprehensive crisis management simulation platform designed for executive training in cybersecurity incident response. This interactive tool helps C-level executives and senior management develop critical decision-making skills during cyber crisis scenarios.

## 🎯 Purpose

The Executive Cyber Crisis Simulator provides realistic, high-pressure training scenarios where executives can:

- **Practice Crisis Decision-Making**: Make critical decisions under time pressure in realistic cyber incident scenarios
- **Understand Role-Specific Responsibilities**: Each C-level role (CEO, CFO, COO, CIO, CISO, HR Director, CLO, CCO) receives tailored context and challenges
- **Learn Cross-Functional Coordination**: Experience how different executive roles must collaborate during a crisis
- **Assess Response Readiness**: Identify gaps in crisis preparedness and resource availability
- **Build Confidence**: Gain experience handling various cyber threats in a safe, simulated environment

## 🚀 Live Demo

**Try the live demo at: [https://crisis.redteam.fr](https://crisis.redteam.fr)**

### Demo Features
- **Embedded Scenario Library**: Pre-built scenarios covering ransomware, data breaches, DDoS attacks, insider threats, and financial fraud
- **Multi-language Support**: Scenarios available in English and French
- **Industry-Specific Content**: Scenarios tailored for different industries (Healthcare, Technology, Finance, etc.)
- **Company Size Variations**: Content adapted for small, medium, and large organizations

### Demo Credentials
```
Username: demo
Password: demo2025
```

**Note**: For production deployments, always use custom admin credentials via environment variables (see Configuration section below).

## ⚠️ Important Security & Data Notes

### No Data Persistence
- **No Database**: This application does not use a database - all data is stored in memory only
- **Session-Based**: Simulations exist only during the active session
- **Custom Scenarios**: If you create custom scenarios, **always export the YAML file** before closing the browser
- **Community Sharing**: Consider sharing your custom scenarios with the community via GitHub issues or pull requests

### Security Considerations
- **Demo Authentication**: Uses hardcoded credentials for demonstration purposes only
- **No Sensitive Data**: Do not store sensitive, confidential, or proprietary information in YAML scenario files
- **Local Use Recommended**: For sensitive training, deploy locally rather than using the public demo

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher

### Quick Start

#### Option 1: Automated Scripts (Recommended)

**Linux/macOS:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Windows:**
```cmd
start-dev.bat
```

#### Option 2: Manual Setup

**Terminal 1 - Backend Server:**
```bash
npm install
npm run dev:server
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev:vite
```

### Development URLs
- **Frontend Application**: http://localhost:5173
- **Backend Socket.IO Server**: http://localhost:3001
- **Health Check**: http://localhost:3001/health

### Available Scripts
- `npm run dev` - Start both servers concurrently
- `npm run dev:vite` - Start Vite development server only (port 5173)
- `npm run dev:server` - Start Socket.IO server only (port 3001)
- `npm run build` - Build for production with type checking
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## ⚙️ Configuration

### Admin Credentials Configuration

The application supports configurable admin credentials via environment variables. This is especially important for production deployments.

#### Environment Variables

- **`ADMIN_USERNAME`** (optional): Admin username
  - Default: `demo`
  - Example: `ADMIN_USERNAME=admin`

- **`ADMIN_PASSWORD`** (optional): Admin password  
  - Default: `demo2025`
  - Example: `ADMIN_PASSWORD=your_secure_password`
  - **Important**: If set, the password will be updated on every server startup

- **`JWT_SECRET`** (recommended for production): JWT token signing secret
  - Default: `your-secret-key-change-in-production`
  - Example: `JWT_SECRET=a-very-long-random-secret-key`

#### Usage Examples

**Development with custom credentials:**
```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=secure123 npm run dev
```

**Production deployment:**
```bash
ADMIN_USERNAME=admin ADMIN_PASSWORD=your_secure_password NODE_ENV=production npm start
```

**Heroku deployment:**
```bash
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-secure-password  
heroku config:set JWT_SECRET=your-jwt-secret
```

For complete configuration options, see [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md).

## 🚀 Deployment to Heroku

### Prerequisites
- [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) installed
- Heroku account
- Git repository initialized

### Option 1: One-Click Deploy

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

### Option 2: Manual Deployment

1. **Login to Heroku**
   ```bash
   heroku login
   ```

2. **Create a new Heroku app**
   ```bash
   heroku create your-app-name
   ```

3. **Set environment variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set ADMIN_USERNAME=admin
   heroku config:set ADMIN_PASSWORD=your-secure-password
   heroku config:set JWT_SECRET=your-random-jwt-secret
   ```

4. **Deploy the application**
   ```bash
   git add .
   git commit -m "Deployment to Heroku"
   git push heroku main
   ```

5. **Verify deployment**
   ```bash
   heroku open
   ```

### Troubleshooting Heroku Deployment

If you encounter the error `TypeError: Missing parameter name at 1: https://git.new/pathToRegexpError`, it's likely due to a dependency issue with path-to-regexp. Try these solutions:

1. **Pin express version in package.json**
   ```json
   "express": "5.0.0-beta.1"
   ```

2. **Update dependencies**
   ```bash
   npm update express path-to-regexp
   ```

3. **Check for path patterns**
   Ensure all Express route patterns are correctly formatted without invalid characters.

4. **Verify Procfile**
   Make sure your Procfile contains:
   ```
   web: node server/index.js
   ```

5. **Check logs for specific errors**
   ```bash
   heroku logs --tail
   ```

## 🎮 How to Use

### Single Player Mode
1. Log in with demo credentials
2. Select "Create New" simulation
3. Choose your executive role
4. Select organization profile (industry, company size)
5. Pick a scenario from the library
6. Start the simulation

### Multiplayer Mode
1. Host creates a simulation and shares the join code
2. Other players join using the code
3. Each player selects their executive role
4. Host starts the simulation when all players are ready
5. Players make decisions simultaneously and see each other's choices

### Creating Custom Scenarios
1. Go to "Edit Scenario" from the main menu
2. Use the scenario editor to create new content
3. **Important**: Export your scenario as YAML before leaving
4. Import the YAML file to restore your scenario later

## 📋 Known Issues & TODO

### UI/UX Improvements Needed
- [ ] **Resource Availability UI**: The yes/no interface for resource availability is unclear and needs better visual design
- [ ] **Mobile Responsiveness**: Application is not optimized for mobile phones and tablets
- [ ] **Chat Notifications**: Multiplayer mode lacks proper notifications for new chat messages **FIXED**

### Missing Features
- [ ] **PDF Export**: No ability to export simulation results and analysis as PDF reports
- [ ] **PowerPoint Export**: Missing PPTX export functionality for executive presentations
- [ ] **Advanced Analytics**: Limited post-simulation analysis and reporting capabilities
- [ ] **Scenario Templates**: Need more scenario creation templates and wizards
- [ ] **User Management**: No proper user accounts or session management

### Technical Improvements
- [ ] **Data Persistence**: Add optional database support for scenario storage
- [ ] **Real-time Sync**: Improve real-time synchronization in multiplayer mode
- [ ] **Performance**: Optimize for larger group simulations (10+ participants)
- [ ] **Accessibility**: Improve screen reader support and keyboard navigation

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + Socket.IO
- **Build Tool**: Vite
- **Deployment**: Heroku-ready with Procfile

### Key Components
- **Scenario Engine**: YAML-based scenario definition and execution
- **Real-time Communication**: Socket.IO for multiplayer coordination
- **Decision Analysis**: Impact scoring and feedback system
- **Resource Management**: Crisis resource availability tracking

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Scenario Contributions
- Create new crisis scenarios using the built-in editor
- Export as YAML and submit via GitHub issues
- Focus on realistic, industry-specific situations

### Code Contributions
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Bug Reports
- Use GitHub issues to report bugs
- Include steps to reproduce
- Specify browser and operating system

## 📄 License

This project is open source. Please check the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join discussions in GitHub Discussions

---

**⚠️ Disclaimer**: This is a training simulation tool. Real crisis response should always follow your organization's established procedures and involve appropriate authorities.
