import React from "react";
import logo from "../assets/DarkLogo.png";
import { User, MailCheck, FileText, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Contacts", icon: <User size={18} />, href: "/" },
  { label: "Cadence", icon: <MailCheck size={18} />, href: "#" },
  { label: "Templates", icon: <FileText size={18} />, href: "/templates" },
  { label: "Settings", icon: <Settings size={18} />, href: "#" },
];

export default function Sidebar() {
  const location = useLocation(); // lets us highlight the active link

  return (
    <div className="group relative h-screen">
      <div
        className="h-full bg-gray-900 text-white flex flex-col items-center p-4
                   shadow-lg shadow-gray-700/40 border-r border-gray-800
                   w-20 group-hover:w-60 transition-all duration-300 ease-in-out overflow-hidden"
      >
        {/* Logo */}
        <div className="mb-8 w-full px-2 hidden group-hover:block">
          <img src={logo} alt="ReachVue" className="h-12 mx-auto" />
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? "bg-gray-800" : "hover:bg-gray-800"
                }`}
              >
                {item.icon}
                <span className="hidden group-hover:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
