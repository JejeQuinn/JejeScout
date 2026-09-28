import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initConnectionKeeper } from './utils/connectionKeeper';

// Initialize background tab heartbeat and auto-reconnection
initConnectionKeeper();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

