// src/App.jsx
import React from 'react';
import Sidebar from './components/Sidebar';
import ContactsTable from "./components/ContactsTable";


export default function App() {
  return (
    <div className="flex h-screen">
      <Sidebar />
       <div className="flex-1 overflow-y-auto bg-gray-50">
        <ContactsTable /> {/* 👈 Inject table content */}
      </div>
      
    </div>
  );
}
