// src/main.tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.tsx";
import App from "./App.tsx";
import "./index.css";
import { FeedProvider } from "./context/FeedContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FeedProvider>
          <App />
        </FeedProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
