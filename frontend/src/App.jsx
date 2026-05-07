import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Upload from "./pages/Upload";
import AnalysisView from "./pages/AnalysisView";
import TopicInput from "./pages/TopicInput";
import ComparisonView from "./pages/ComparisonView";
import LiteratureReview from "./pages/LiteratureReview";
import AppShell from "./components/layout/AppShell";
import ProtectedRoute from "./components/guards/ProtectedRoute";

// Wrapper to determine if Shell should be shown
const LayoutWrapper = ({ children }) => {
  const { pathname } = useLocation();
  const isLoginPage = pathname === "/";
  if (isLoginPage) return children;
  return <AppShell>{children}</AppShell>;
};

function App() {
  return (
    <Router>
      <LayoutWrapper>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <Upload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analysis"
            element={
              <ProtectedRoute>
                <AnalysisView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/topic-input"
            element={
              <ProtectedRoute>
                <TopicInput />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comparison"
            element={
              <ProtectedRoute>
                <ComparisonView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/literature-review"
            element={
              <ProtectedRoute>
                <LiteratureReview />
              </ProtectedRoute>
            }
          />
        </Routes>
      </LayoutWrapper>
    </Router>
  );
}

export default App;
