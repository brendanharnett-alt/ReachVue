// src/components/Sidebar.jsx
import React from 'react';
import logo from '../assets/DarkLogo.png';
import { User, MailCheck, Tag, Settings } from 'lucide-react';

const navItems = [
  { label: 'Contacts', icon: <User size={18} />, href: '#' },
  { label: 'Cadence', icon: <MailCheck size={18} />, href: '#' },
  { label: 'Tags', icon: <Tag size={18} />, href: '#' },
  { label: 'Settings', icon: <Settings size={18} />, href: '#' },
];

export default function Sidebar() {
  return (
  <div className="w-60 h-screen bg-gray-900 text-white flex flex-col items-center p-4 shadow-lg shadow-gray-700/40 border-r border-gray-800">
      {/* Logo */}
      <div className="mb-8 flex items-center justify-start">
        <img src={logo} alt="ReachVue" className="h-12" />
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-800 text-sm transition"
          >
            {item.icon}
            {item.label}
          </a>
        ))}
      </nav>
    </div>
  );
}
