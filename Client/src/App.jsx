// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ContactsPage from "./pages/ContactsPage";
import TemplatesPage from "./pages/TemplatesPage";

export default function App() {
  return (
    <Router>
      <div className="relative h-screen">
        <Sidebar />
        <div className="ml-20 bg-gray-50 h-full overflow-y-auto transition-all duration-300 ease-in-out">
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
