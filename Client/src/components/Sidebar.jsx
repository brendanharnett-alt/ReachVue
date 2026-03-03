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
    <div className="group fixed left-0 top-0 h-screen z-50">
      <div
        className="h-full text-white flex flex-col
                   shadow-[4px_0_16px_rgba(0,0,0,0.12)] border-r border-black/10
                   w-20 group-hover:w-60 transition-all duration-300 ease-in-out overflow-hidden"
        style={{ backgroundColor: '#3a5b91' }}
      >
        {/* Header */}
        <div className="flex items-center pt-6 pb-2 mb-2 w-full">
          {/* Fixed-width icon area - always w-20 to match collapsed sidebar */}
          <div className="w-20 h-8 flex items-center justify-center flex-shrink-0">
            <img src={icon} alt="ReachVue" className="h-11 w-11" />
          </div>
          {/* Text - shown when expanded, positioned closer with negative margin */}
          <span className="text-2xl font-semibold hidden group-hover:inline pr-3 self-center -ml-5">ReachVue</span>
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
                className={`flex items-center py-2 rounded-lg text-sm transition ${
                  isActive ? "bg-white/20" : "hover:bg-white/10"
                }`}
              >
                {/* Fixed-width icon area - always w-20 to match collapsed sidebar */}
                <div className="w-20 h-6 flex items-center justify-center flex-shrink-0">
                  {item.icon}
                </div>
                {/* Text - shown when expanded, positioned closer with negative margin */}
                <span className="hidden group-hover:inline pr-3 self-center -ml-5">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
