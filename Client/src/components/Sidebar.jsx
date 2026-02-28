import React from "react";
import icon from "../assets/Icon.svg";
import { User, MailCheck, FileText, Settings, Activity } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navItems = [
  { label: "Contacts", icon: <User size={18} />, href: "/" },
  { label: "Cadence", icon: <MailCheck size={18} />, href: "/cadences" },
  { label: "Templates", icon: <FileText size={18} />, href: "/templates" },
  { label: "Activity", icon: <Activity size={18} />, href: "/activity" },
  { label: "Settings", icon: <Settings size={18} />, href: "/settings" },
];

export default function Sidebar() {
  const location = useLocation(); // lets us highlight the active link

  return (
    <div className="group fixed left-0 top-0 h-screen z-40">
      <div
        className="h-full text-white flex flex-col items-center p-4
                   shadow-lg border-r
                   w-20 group-hover:w-60 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ backgroundColor: '#3B5FC7', borderColor: '#2d4aa8', boxShadow: '0 10px 15px -3px rgba(59, 95, 199, 0.3), 0 4px 6px -2px rgba(59, 95, 199, 0.2)' }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-3 py-2 mb-2 w-full">
          {/* Icon - always visible */}
          <img src={icon} alt="ReachVue" className="h-8 w-8 flex-shrink-0" />
          {/* Text - shown when expanded */}
          <span className="text-xl font-semibold hidden group-hover:inline">ReachVue</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2 w-full">
          {navItems.map((item) => {
            // Handle cadence detail pages - highlight if path starts with /cadences
            const isActive =
              item.href === "/cadences"
                ? location.pathname.startsWith("/cadences")
                : location.pathname === item.href;
            return (
              <Link
                key={item.label}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${
                  isActive ? "bg-white/20" : "hover:bg-white/10"
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
