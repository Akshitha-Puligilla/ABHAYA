import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import ReportIncident from "./components/ReportIncident";
import AuthorityDashboard from "./components/AuthorityDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/report" element={<ReportIncident />} />
        <Route path="/dashboard" element={<AuthorityDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
