// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import { RealtimeProvider } from "./context/RealtimeContext.tsx";
import App from "./App.tsx";
import "./index.css";
import { FeedProvider } from "./context/FeedContext.tsx";
import { NotificationProvider } from "./context/NotificationContext.tsx";
import { ThemeProvider } from './context/ThemeContext';
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
      <AuthProvider>
          <RealtimeProvider>
        <FeedProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </FeedProvider>
        </RealtimeProvider>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);
