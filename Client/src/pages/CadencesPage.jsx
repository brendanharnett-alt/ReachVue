// src/pages/CadencesPage.jsx
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MailCheck, Eye, Edit, Play, MoreVertical, History, SkipForward, Clock, ChevronRight, ChevronDown } from "lucide-react";
import CreateCadenceModal from "@/components/modals/CreateCadenceModal";

// Mock cadence data
const mockCadences = [
  {
    id: 1,
    name: "Q1 Enterprise Outreach",
    description: "Targeting enterprise prospects for Q1 sales cycle",
    peopleCount: 24,
    lastActivity: "2 days ago",
    status: "Active",
  },
  {
    id: 2,
    name: "Follow-up Campaign",
    description: "Re-engaging warm leads from last quarter",
    peopleCount: 12,
    lastActivity: "5 days ago",
    status: "Active",
  },
  {
    id: 3,
    name: "Product Demo Follow-up",
    description: "Following up with prospects who attended demo",
    peopleCount: 8,
    lastActivity: "1 week ago",
    status: "Paused",
  },
  {
    id: 4,
    name: "New Customer Onboarding",
    description: "Welcome sequence for new customers",
    peopleCount: 5,
    lastActivity: "3 days ago",
    status: "Active",
  },
];

// Check if date is past due
function isPastDue(dateString) {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

// Format date as "June 15th, 2025"
function formatDateWithOrdinal(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  const year = date.getFullYear();

  const getOrdinal = (n) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${month} ${day}${getOrdinal(day)}, ${year}`;
}

// Generate mock To Do items (all due/past due steps across cadences)
const generateToDoItems = () => {
  const today = new Date();
  const getDateString = (daysFromToday) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().split("T")[0];
  };

  return [
    {
      id: 1,
      cadenceId: 1,
      cadenceName: "Q1 Enterprise Outreach",
      company: "General Electric",
      firstName: "John",
      lastName: "Doe",
      title: "VP of IT",
      currentStep: "Step 1: Intro",
      dueOn: getDateString(-1), // 1 day ago (past due)
    },
    {
      id: 2,
      cadenceId: 2,
      cadenceName: "Follow-up Campaign",
      company: "Dupont",
      firstName: "Elton",
      lastName: "John",
      title: "VP, Strategic Projects",
      currentStep: "Step 2: Multi-Action",
      dueOn: getDateString(-2), // 2 days ago (past due)
    },
    {
      id: 3,
      cadenceId: 2,
      cadenceName: "Follow-up Campaign",
      company: "Acme Co",
      firstName: "John",
      lastName: "Kennedy",
      title: "VP of Finance",
      currentStep: "Step 2: Email Follow Up",
      dueOn: getDateString(-2), // 2 days ago (past due)
    },
    {
      id: 4,
      cadenceId: 1,
      cadenceName: "Q1 Enterprise Outreach",
      company: "Microsoft",
      firstName: "Jane",
      lastName: "Smith",
      title: "Director of Sales",
      currentStep: "Step 3: Phone Call",
      dueOn: getDateString(0), // Today (due)
    },
    {
      id: 5,
      cadenceId: 4,
      cadenceName: "New Customer Onboarding",
      company: "Amazon",
      firstName: "Alice",
      lastName: "Johnson",
      title: "CTO",
      currentStep: "Step 1: Welcome Email",
      dueOn: getDateString(0), // Today (due)
    },
    {
      id: 6,
      cadenceId: 3,
      cadenceName: "Product Demo Follow-up",
      company: "Google",
      firstName: "Bob",
      lastName: "Williams",
      title: "VP of Engineering",
      currentStep: "Step 2: Follow-up Call",
      dueOn: getDateString(-3), // 3 days ago (past due)
    },
  ];
};

export default function CadencesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("todo");
  const [groupBy, setGroupBy] = useState("none");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [createCadenceModalOpen, setCreateCadenceModalOpen] = useState(false);
  const toDoItems = generateToDoItems();

  const toggleGroupExpand = (group) =>
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  // Group items by campaign when grouping is enabled
  const groupedData = useMemo(() => {
    if (groupBy === "none") return { All: toDoItems };

    if (groupBy === "campaign") {
      return toDoItems.reduce((acc, item) => {
        if (!acc[item.cadenceName]) acc[item.cadenceName] = [];
        acc[item.cadenceName].push(item);
        return acc;
      }, {});
    }

    return { All: toDoItems };
  }, [toDoItems, groupBy]);

  const groupedItems = groupedData;

  const handleCreateCadence = () => {
    setCreateCadenceModalOpen(true);
  };

  const handleCadenceCreated = (cadenceData) => {
    // Placeholder - no backend wiring yet
    console.log("Cadence created:", cadenceData);
    // TODO: Add cadence to list, refresh data, etc.
  };

  const handleEdit = (cadenceId, e) => {
    e.stopPropagation(); // Prevent row click
    // Placeholder - no implementation yet
    console.log("Edit cadence:", cadenceId);
  };

  const handleView = (cadenceId, e) => {
    e.stopPropagation(); // Prevent row click
    navigate(`/cadences/${cadenceId}`);
  };

  const handleRowClick = (cadenceId) => {
    navigate(`/cadences/${cadenceId}`);
  };

  const handleToDoRowClick = (cadenceId) => {
    navigate(`/cadences/${cadenceId}`);
  };

  const handleSkip = (itemId, e) => {
    e.stopPropagation();
    console.log("Skip for item:", itemId);
  };

  const handlePostpone = (itemId, e) => {
    e.stopPropagation();
    console.log("Postpone for item:", itemId);
  };

  const handleHistoricalActions = (itemId, e) => {
    e.stopPropagation();
    console.log("Historical actions for item:", itemId);
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MailCheck className="h-6 w-6 text-gray-700" />
            Cadences
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize outreach into structured campaigns
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleCreateCadence}>
          <Plus className="h-4 w-4" />
          Create Cadence
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("todo")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "todo"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          To Do
        </button>
        <button
          onClick={() => setActiveTab("cadences")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "cadences"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Cadences
        </button>
      </div>

      {/* To Do Tab Content */}
      {activeTab === "todo" && (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Group by Dropdown */}
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Group by
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setGroupBy("none")}>
                  None
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("campaign")}>
                  Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
              <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Company</th>
                  <th className="px-4 py-3 text-left">Full Name</th>
                  <th className="px-4 py-3 text-left">Title</th>
                  <th className="px-4 py-3 text-left">Current Step</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                  <th className="px-4 py-3 text-left">Due on</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedItems).map(([group, rows]) => (
                  <React.Fragment key={group}>
                    {groupBy !== "none" && (
                      <tr
                        className="bg-gray-100 font-semibold cursor-pointer"
                        onClick={() => toggleGroupExpand(group)}
                      >
                        <td className="p-2">
                          {expandedGroups[group] ? (
                            <ChevronDown className="h-4 w-4 inline" />
                          ) : (
                            <ChevronRight className="h-4 w-4 inline" />
                          )}
                        </td>
                        <td className="p-2 text-blue-700" colSpan={1}>
                          {group}{" "}
                          <span className="text-gray-500 text-sm">
                            ({rows.length})
                          </span>
                        </td>
                        <td colSpan={5}></td>
                      </tr>
                    )}

                    {(groupBy === "none" || expandedGroups[group]) &&
                      rows.map((item) => {
                        const pastDue = isPastDue(item.dueOn);
                        return (
                          <tr
                            key={item.id}
                            className="border-b hover:bg-gray-50 transition group cursor-pointer"
                            onClick={() => handleToDoRowClick(item.cadenceId)}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900">
                              {item.company}
                            </td>
                            <td className="px-4 py-3 text-gray-700">
                              {item.firstName} {item.lastName}
                            </td>
                            <td className="px-4 py-3 text-gray-600">{item.title}</td>
                            <td className="px-4 py-3">
                              <div className="flex items-start">
                                <div className="w-6 flex items-center justify-start flex-shrink-0 mt-0.5">
                                  <button
                                    className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                      pastDue
                                        ? "bg-gray-200 hover:bg-gray-300"
                                        : "border border-gray-300 bg-transparent hover:border-gray-400"
                                    }`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log("Execute action for item:", item.id);
                                    }}
                                  >
                                    <Play
                                      className={`h-3 w-3 ${
                                        pastDue
                                          ? "text-blue-700 fill-blue-700"
                                          : "text-gray-900"
                                      }`}
                                    />
                                  </button>
                                </div>
                                <div className="ml-2 flex flex-col">
                                  <span className="text-gray-700">{item.currentStep}</span>
                                  <span className="text-xs text-gray-400 mt-0.5 inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 w-fit">
                                    {item.cadenceName}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-start">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button
                                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4 text-gray-500" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start">
                                    <DropdownMenuItem
                                      onClick={(e) => handleHistoricalActions(item.id, e)}
                                    >
                                      <History className="h-4 w-4 mr-2" />
                                      View History
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => handleSkip(item.id, e)}
                                    >
                                      <SkipForward className="h-4 w-4 mr-2" />
                                      Skip Step
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => handlePostpone(item.id, e)}
                                    >
                                      <Clock className="h-4 w-4 mr-2" />
                                      Postpone
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                            <td
                              className={`px-4 py-3 font-medium ${
                                pastDue ? "text-red-600" : "text-green-600"
                              }`}
                            >
                              {formatDateWithOrdinal(item.dueOn)}
                            </td>
                          </tr>
                        );
                      })}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Cadences Tab Content */}
      {activeTab === "cadences" && (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Cadence Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left"># of People</th>
              <th className="px-4 py-3 text-left">Last Activity</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockCadences.map((cadence) => (
              <tr
                key={cadence.id}
                className="border-b hover:bg-gray-50 transition cursor-pointer"
                onClick={() => handleRowClick(cadence.id)}
              >
                <td className="px-4 py-3 font-medium text-blue-600 hover:underline">
                  {cadence.name}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {cadence.description || (
                    <span className="italic text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-700">{cadence.peopleCount}</td>
                <td className="px-4 py-3 text-gray-600">{cadence.lastActivity}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      cadence.status === "Active"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {cadence.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={(e) => handleView(cadence.id, e)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={(e) => handleEdit(cadence.id, e)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}

      {/* Create Cadence Modal */}
      <CreateCadenceModal
        open={createCadenceModalOpen}
        onClose={() => setCreateCadenceModalOpen(false)}
        onSuccess={handleCadenceCreated}
      />
    </div>
  );
}

