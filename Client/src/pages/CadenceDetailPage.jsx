// src/pages/CadenceDetailPage.jsx
import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  Play,
  SkipForward,
  Clock,
  History,
  MoreVertical,
  Linkedin,
  Mail,
  Phone,
  GripVertical,
  Plus,
  Edit,
  Copy,
  Trash2,
} from "lucide-react";
import MultiActionModal from "@/components/modals/MultiActionModal";
import CadenceContactPanel from "@/components/panels/CadenceContactPanel";

// Generate mock data with dates relative to today
const generateMockPeople = () => {
  const today = new Date();
  const getDateString = (daysFromToday) => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromToday);
    return date.toISOString().split("T")[0];
  };

  return [
    {
      id: 1,
      company: "General Electric",
      firstName: "John",
      lastName: "Doe",
      title: "VP of IT",
      currentStep: "Step 1: Intro",
      dueOn: getDateString(3), // 3 days from today
      lastStepCompletedAt: null,
    },
    {
      id: 2,
      company: "Dupont",
      firstName: "Elton",
      lastName: "John",
      title: "VP, Strategic Projects",
      currentStep: "Step 2: Multi-Action",
      dueOn: getDateString(-2), // 2 days ago (past due)
      lastStepCompletedAt: getDateString(-3), // 3 days ago
    },
    {
      id: 3,
      company: "Acme Co",
      firstName: "John",
      lastName: "Kennedy",
      title: "VP of Finance",
      currentStep: "Step 2: Email Follow Up",
      dueOn: getDateString(-2), // 2 days ago (past due)
      lastStepCompletedAt: getDateString(-5), // 5 days ago
    },
    {
      id: 4,
      company: "Walmart",
      firstName: "Mohammed",
      lastName: "Ali",
      title: "Head of Analytics",
      currentStep: "Step 3: Phone Call",
      dueOn: getDateString(3), // 3 days from today
      lastStepCompletedAt: getDateString(-10), // 10 days ago
    },
    {
      id: 5,
      company: "Citibank",
      firstName: "Bob",
      lastName: "Barker",
      title: "SVP, Infrastructure",
      currentStep: "Step 4: Email Bump",
      dueOn: getDateString(4), // 4 days from today
      lastStepCompletedAt: getDateString(-10), // 10 days ago
    },
  ];
};

// Get cadence name from ID (mock lookup)
const getCadenceName = (id) => {
  const cadences = {
    1: "Q1 Enterprise Outreach",
    2: "Follow-up Campaign",
    3: "Product Demo Follow-up",
    4: "New Customer Onboarding",
  };
  return cadences[id] || `Cadence ${id}`;
};

// Generate cadence structure (14-day cadence)
const generateCadenceStructure = (cadenceId) => {
  // Different structures for different cadences
  const structures = {
    1: [
      { day: 0, actions: [{ type: "email", label: "Initial Outreach Email" }] },
      { day: 2, actions: [{ type: "linkedin", label: "LinkedIn Connection Request" }] },
      { day: 4, actions: [{ type: "email", label: "Follow-up Email" }] },
      { day: 7, actions: [{ type: "phone", label: "Phone Call" }] },
      { day: 9, actions: [{ type: "email", label: "Value Proposition Email" }] },
      { day: 11, actions: [{ type: "linkedin", label: "LinkedIn Message" }] },
      { day: 14, actions: [{ type: "email", label: "Final Follow-up Email" }] },
    ],
    2: [
      { day: 0, actions: [{ type: "email", label: "Re-engagement Email" }] },
      { day: 3, actions: [{ type: "linkedin", label: "LinkedIn Touch" }] },
      { day: 5, actions: [{ type: "email", label: "Case Study Email" }] },
      { day: 7, actions: [{ type: "phone", label: "Warm Call" }] },
      { day: 10, actions: [{ type: "email", label: "Closing Email" }] },
      { day: 12, actions: [{ type: "linkedin", label: "LinkedIn Follow-up" }] },
      { day: 14, actions: [{ type: "email", label: "Last Attempt Email" }] },
    ],
    3: [
      { day: 0, actions: [{ type: "email", label: "Thank You Email" }] },
      { day: 2, actions: [{ type: "email", label: "Additional Resources" }] },
      { day: 4, actions: [{ type: "phone", label: "Follow-up Call" }] },
      { day: 6, actions: [{ type: "email", label: "Implementation Guide" }] },
      { day: 8, actions: [{ type: "linkedin", label: "LinkedIn Engagement" }] },
      { day: 10, actions: [{ type: "email", label: "Check-in Email" }] },
      { day: 12, actions: [{ type: "phone", label: "Success Call" }] },
      { day: 14, actions: [{ type: "email", label: "Feedback Request" }] },
    ],
    4: [
      { day: 0, actions: [{ type: "email", label: "Welcome Email" }] },
      { day: 1, actions: [{ type: "email", label: "Getting Started Guide" }] },
      { day: 3, actions: [{ type: "phone", label: "Onboarding Call" }] },
      { day: 5, actions: [{ type: "email", label: "Training Resources" }] },
      { day: 7, actions: [{ type: "linkedin", label: "LinkedIn Welcome" }] },
      { day: 9, actions: [{ type: "email", label: "Progress Check Email" }] },
      { day: 11, actions: [{ type: "phone", label: "Support Call" }] },
      { day: 14, actions: [{ type: "email", label: "Success Metrics Email" }] },
    ],
  };

  return structures[cadenceId] || structures[1];
};

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

// Format relative time like "3 Days Ago" or absolute date
function formatLastStepCompleted(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "1 Day Ago";
  if (diffDays < 7) return `${diffDays} Days Ago`;
  // For older dates, show formatted date like "June 9th, 2025"
  return formatDateWithOrdinal(dateString);
}

// Check if date is past due
function isPastDue(dateString) {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

// Add unique IDs to actions if they don't have them
function ensureActionIds(structure) {
  return structure.map((step) => ({
    ...step,
    actions: step.actions.map((action, idx) => ({
      ...action,
      id: action.id || `action-${step.day}-${idx}-${Date.now()}`,
    })),
  }));
}

export default function CadenceDetailPage() {
  const { cadenceId } = useParams();
  const navigate = useNavigate();
  const cadenceName = getCadenceName(parseInt(cadenceId));
  const mockPeopleInCadence = generateMockPeople();
  const [multiActionModalOpen, setMultiActionModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [activeTab, setActiveTab] = useState("people");
  const [cadenceStructure, setCadenceStructure] = useState(() => {
    const structure = generateCadenceStructure(parseInt(cadenceId));
    return ensureActionIds(structure);
  });
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromDay, setDraggedFromDay] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  // Mock actions for multi-action steps
  const getMultiActions = (personId) => {
    return [
      {
        id: 1,
        name: "Send Email",
        dueOn: null,
      },
      {
        id: 2,
        name: "Phone Call",
        dueOn: null,
      },
      {
        id: 3,
        name: "LinkedIn Message",
        dueOn: null,
      },
    ];
  };

  const handleOpenMultiActionModal = (person) => {
    setSelectedPerson(person);
    setMultiActionModalOpen(true);
  };

  const handleExecuteAction = (person, e) => {
    e.stopPropagation();
    if (person.currentStep.includes("Multi-Action")) {
      handleOpenMultiActionModal(person);
    } else {
      // Placeholder - no implementation yet
      console.log("Execute action for person:", person.id);
    }
  };

  const handleStepTextClick = (person) => {
    if (person.currentStep.includes("Multi-Action")) {
      handleOpenMultiActionModal(person);
    }
  };

  const handleLinkedInClick = (e) => {
    e.stopPropagation();
    // Open IBM CEO Arvind Krishna's LinkedIn profile
    window.open("https://www.linkedin.com/in/arvindkrishna/", "_blank");
  };

  const handleSkip = (personId, e) => {
    e.stopPropagation();
    // Placeholder - no implementation yet
    console.log("Skip for person:", personId);
  };

  const handlePostpone = (personId, e) => {
    e.stopPropagation();
    // Placeholder - no implementation yet
    console.log("Postpone for person:", personId);
  };

  const handleHistoricalActions = (personId, e) => {
    e.stopPropagation();
    // Placeholder - no implementation yet
    console.log("Historical actions for person:", personId);
  };

  const getActionIcon = (type) => {
    switch (type) {
      case "email":
        return <Mail className="h-4 w-4 text-gray-500" />;
      case "phone":
        return <Phone className="h-4 w-4 text-gray-500" />;
      case "linkedin":
        return <Linkedin className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDragStart = (e, dayIndex, actionIndex) => {
    setDraggedItem({ dayIndex, actionIndex });
    setDraggedFromDay(dayIndex);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${dayIndex}-${actionIndex}`);
  };

  const handleDragOver = (e, dayIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    if (dayIndex !== null) {
      setDragOverDay(dayIndex);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDay(null);
  };

  const handleDrop = (e, targetDayIndex, targetActionIndex = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedItem) return;

    const newStructure = JSON.parse(JSON.stringify(cadenceStructure));
    const sourceStep = newStructure[draggedItem.dayIndex];
    const action = { ...sourceStep.actions[draggedItem.actionIndex] };

    // If dropping in the same position, do nothing
    if (
      draggedItem.dayIndex === targetDayIndex &&
      draggedItem.actionIndex === targetActionIndex
    ) {
      setDraggedItem(null);
      setDraggedFromDay(null);
      setDragOverDay(null);
      return;
    }

    // Remove from source
    sourceStep.actions.splice(draggedItem.actionIndex, 1);

    // Adjust target index if moving within same day and dropping before source
    let adjustedTargetIndex = targetActionIndex;
    if (
      draggedItem.dayIndex === targetDayIndex &&
      targetActionIndex !== null &&
      targetActionIndex > draggedItem.actionIndex
    ) {
      adjustedTargetIndex = targetActionIndex - 1;
    }

    // Add to target
    const targetStep = newStructure[targetDayIndex];
    if (adjustedTargetIndex !== null && adjustedTargetIndex >= 0) {
      targetStep.actions.splice(adjustedTargetIndex, 0, action);
    } else {
      targetStep.actions.push(action);
    }

    setCadenceStructure(newStructure);
    setDraggedItem(null);
    setDraggedFromDay(null);
    setDragOverDay(null);
  };

  const handleAddStep = (dayIndex) => {
    const newStructure = [...cadenceStructure];
    newStructure[dayIndex].actions.push({
      id: `action-${dayIndex}-${newStructure[dayIndex].actions.length}-${Date.now()}`,
      type: "email",
      label: "New Step",
    });
    setCadenceStructure(newStructure);
  };

  const handleEditAction = (dayIndex, actionIndex) => {
    // Placeholder - would open edit modal
    console.log("Edit action:", dayIndex, actionIndex);
  };

  const handleCopyAction = (dayIndex, actionIndex) => {
    const newStructure = [...cadenceStructure];
    const action = { ...newStructure[dayIndex].actions[actionIndex] };
    action.id = `action-${dayIndex}-${newStructure[dayIndex].actions.length}-${Date.now()}`;
    newStructure[dayIndex].actions.push(action);
    setCadenceStructure(newStructure);
  };

  const handleDeleteAction = (dayIndex, actionIndex) => {
    const newStructure = [...cadenceStructure];
    newStructure[dayIndex].actions.splice(actionIndex, 1);
    setCadenceStructure(newStructure);
  };

  const handleCadenceAction = (action) => {
    switch (action) {
      case "addStep":
        // Add step to day 0 by default
        handleAddStep(0);
        break;
      case "editName":
        // Placeholder - would open edit modal
        console.log("Edit name/description");
        break;
      case "copy":
        // Placeholder - would copy entire cadence
        console.log("Copy cadence");
        break;
      default:
        break;
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/cadences")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Cadences
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{cadenceName}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {mockPeopleInCadence.length} people in cadence
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("people")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "people"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          People
        </button>
        <button
          onClick={() => setActiveTab("structure")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "structure"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Cadence Structure
        </button>
      </div>

      {/* People Tab Content */}
      {activeTab === "people" && (
        <div className="flex">
        <div
          className={`border rounded-lg bg-white shadow-sm overflow-hidden ${
            selectedContact ? "w-2/3" : "w-full"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-2 text-left font-medium">Company</th>
                <th className="p-2 text-left font-medium">Full Name</th>
                <th className="p-2 text-left font-medium">Title</th>
                <th className="p-2 text-left font-medium">Current Step</th>
                {!selectedContact && (
                  <>
                    <th className="p-2 text-left font-medium">Actions</th>
                    <th className="p-2 text-left font-medium">Due on</th>
                    <th className="p-2 text-left font-medium">Last Step Completed At</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {mockPeopleInCadence.map((person) => {
                const pastDue = isPastDue(person.dueOn);
                return (
                  <tr
                    key={person.id}
                    className="border-b hover:bg-gray-50 transition group"
                  >
                    <td className="p-2 font-medium text-gray-900 truncate max-w-[140px]">
                      {person.company}
                    </td>
                    <td className="p-2 text-gray-700">
                      <div className="flex items-center gap-2">
                        <span
                          className="cursor-pointer hover:text-blue-600 hover:underline truncate max-w-[140px]"
                          onClick={() => setSelectedContact(person)}
                        >
                          {person.firstName} {person.lastName}
                        </span>
                        <button
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-3.5 w-3.5 rounded-sm bg-[#0077B5] flex items-center justify-center hover:bg-[#006399]"
                          onClick={handleLinkedInClick}
                          title="Open LinkedIn Profile"
                        >
                          <span className="text-[8px] font-bold text-white leading-none">in</span>
                        </button>
                      </div>
                    </td>
                    <td className="p-2 text-gray-600 truncate max-w-[160px]">{person.title}</td>
                    <td className="p-2">
                      <div className="flex items-center">
                        <div className="w-6 flex items-center justify-start flex-shrink-0">
                          <button
                            className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                              pastDue
                                ? "bg-gray-200 hover:bg-gray-300"
                                : "border border-gray-300 bg-transparent hover:border-gray-400"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExecuteAction(person, e);
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
                        <span
                          className={`ml-2 text-gray-700 ${
                            person.currentStep.includes("Multi-Action")
                              ? "cursor-pointer hover:text-gray-900"
                              : ""
                          }`}
                          onClick={() => handleStepTextClick(person)}
                        >
                          {person.currentStep}
                        </span>
                      </div>
                    </td>
                    {!selectedContact && (
                      <>
                        <td className="p-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-gray-600 hover:text-gray-900"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHistoricalActions(person.id, e);
                                }}
                              >
                                <History className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSkip(person.id, e);
                                }}
                              >
                                <SkipForward className="mr-2 h-4 w-4" />
                                Skip Step
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePostpone(person.id, e);
                                }}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Postpone
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                        <td className="p-2">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              pastDue
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {formatDateWithOrdinal(person.dueOn)}
                          </span>
                        </td>
                        <td className="p-2 text-gray-600 whitespace-nowrap text-xs">
                          {formatLastStepCompleted(person.lastStepCompletedAt)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </div>

        {/* Contact Panel */}
        {selectedContact && (
          <CadenceContactPanel
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
          />
        )}
      </div>
      )}

      {/* Cadence Structure Tab Content */}
      {activeTab === "structure" && (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          <div className="p-6">
            {/* Header with Cadence Actions button */}
            <div className="flex justify-end mb-6">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    Cadence Actions
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleCadenceAction("addStep")}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Step
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCadenceAction("editName")}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Name/Description
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCadenceAction("copy")}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-6">
              {cadenceStructure.map((step, dayIndex) => (
                <div
                  key={dayIndex}
                  className={`border-b border-gray-200 last:border-b-0 pb-6 last:pb-0 transition-colors ${
                    dragOverDay === dayIndex ? "bg-blue-50" : ""
                  }`}
                  onDragOver={(e) => handleDragOver(e, dayIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, dayIndex)}
                >
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Day {step.day}
                      {step.day === 0 && " (Start)"}
                    </h3>
                  </div>
                  <div className="space-y-2 ml-4">
                    {step.actions.map((action, actionIndex) => (
                      <div
                        key={action.id || actionIndex}
                        draggable
                        onDragStart={(e) => handleDragStart(e, dayIndex, actionIndex)}
                        onDragOver={(e) => handleDragOver(e)}
                        onDragEnd={() => {
                          setDraggedItem(null);
                          setDraggedFromDay(null);
                          setDragOverDay(null);
                        }}
                        onDrop={(e) => {
                          handleDrop(e, dayIndex, actionIndex);
                        }}
                        className={`flex items-center gap-3 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors cursor-move ${
                          draggedItem?.dayIndex === dayIndex && draggedItem?.actionIndex === actionIndex
                            ? "opacity-50"
                            : ""
                        }`}
                      >
                        <div className="flex-shrink-0 cursor-grab active:cursor-grabbing">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                        </div>
                        <div className="flex-shrink-0">
                          {getActionIcon(action.type)}
                        </div>
                        <div className="flex-1">
                          <span className="text-sm text-gray-700 font-medium">
                            {action.label}
                          </span>
                        </div>
                        <div className="flex-shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditAction(dayIndex, actionIndex);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyAction(dayIndex, actionIndex);
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteAction(dayIndex, actionIndex);
                                }}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    ))}
                    {/* Add Step button at bottom of each day */}
                    <button
                      onClick={() => handleAddStep(dayIndex)}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline mt-2 ml-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Step
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Action Modal */}
      {selectedPerson && (
        <MultiActionModal
          open={multiActionModalOpen}
          onOpenChange={setMultiActionModalOpen}
          person={selectedPerson}
          actions={getMultiActions(selectedPerson.id)}
        />
      )}
    </div>
  );
}

