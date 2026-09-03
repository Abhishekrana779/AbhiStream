import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { WatchlistProvider } from "./context/WatchlistContext";
import { ThemeProvider } from "./context/ThemeContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <WatchlistProvider>
            <App />
          </WatchlistProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
);