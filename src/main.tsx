import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { SimulationProvider } from './context/SimulationContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SimulationProvider>
        <App />
      </SimulationProvider>
    </ThemeProvider>
  </StrictMode>
);