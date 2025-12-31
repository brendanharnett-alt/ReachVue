// src/App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ContactsPage from "./pages/ContactsPage";
import TemplatesPage from "./pages/TemplatesPage";
import SettingsPage from "./pages/SettingsPage";

const BASE_URL = "http://localhost:3000";

export default function App() {
  const [emailSettings, setEmailSettings] = useState(null);

  // Load email settings once when app mounts
  useEffect(() => {
    const fetchEmailSettings = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/user/settings/email`);
        if (res.ok) {
          const data = await res.json();
          setEmailSettings(data);
        } else {
          console.error("Failed to fetch email settings:", res.status);
          // Set defaults if fetch fails
          setEmailSettings({
            email_client: "outlook",
            email_signature_html: "",
            auto_signature: true,
          });
        }
      } catch (err) {
        console.error("Error fetching email settings:", err);
        // Set defaults on error
        setEmailSettings({
          email_client: "outlook",
          email_signature_html: "",
          auto_signature: true,
        });
      }
    };

    fetchEmailSettings();
  }, []);

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
            {/* Settings page route */}
            <Route
              path="/settings"
              element={
                <SettingsPage
                  emailSettings={emailSettings}
                  setEmailSettings={setEmailSettings}
                />
              }
            />
          </Routes>
        </div>
      </div>
    </Router>
  );
}
