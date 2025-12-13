// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ContactsPage from "./pages/ContactsPage";
import TemplatesPage from "./pages/TemplatesPage";

export default function App() {
  return (
    <Router>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <Routes>
            {/* Default route = your existing ContactsTable */}
            <Route path="/" element={<ContactsPage />} />
            {/* New Templates page route */}
            <Route path="/templates" element={<TemplatesPage />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
