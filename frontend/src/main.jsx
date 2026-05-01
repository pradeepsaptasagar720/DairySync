import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import RoutesConfig from "./RoutesConfig";

import { AuthProvider } from "./hooks/useAuth"; // 👈 IMPORTANT
import { DairyInfoProvider } from "./hooks/useDairyInfo";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <DairyInfoProvider>
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <RoutesConfig />
        </BrowserRouter>
      </DairyInfoProvider>
    </AuthProvider>
  </React.StrictMode>
);
