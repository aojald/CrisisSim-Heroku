# Development Setup Guide

## Quick Start

### Option 1: Automated Script (Recommended)

**Linux/Mac:**
```bash
chmod +x start-dev.sh
./start-dev.sh
```

**Windows:**
```cmd
start-dev.bat
```

### Option 2: Manual Setup (Two Terminals)

**Terminal 1 - Backend Server:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend Server:**
```bash
npm run dev:vite
```

## Available Scripts

- `npm run dev:vite` - Start Vite development server (port 5173)
- `npm run dev:server` - Start Socket.IO server (port 3001)
- `npm run build` - Build for production with type checking
- `npm run build:vite` - Build without type checking
- `npm run build:check` - Type check only
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Development URLs

- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3001
- **Health Check:** http://localhost:3001/health

## Nginx Setup

If using nginx, ensure your configuration proxies:
- Port 80 → Frontend (5173)
- Socket.IO paths → Backend (3001)

## Troubleshooting

### Dependencies Issues
```bash
rm -rf node_modules package-lock.json
npm install
```

### Port Conflicts
- Frontend: Change port in `vite.config.ts`
- Backend: Change PORT in `server/index.js`

### Build Issues
```bash
npm run build:check  # Check TypeScript errors
npm run lint         # Check linting errors
```