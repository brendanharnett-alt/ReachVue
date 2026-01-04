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

export default function CadenceDetailPage() {
  const { cadenceId } = useParams();
  const navigate = useNavigate();
  const cadenceName = getCadenceName(parseInt(cadenceId));
  const mockPeopleInCadence = generateMockPeople();
  const [multiActionModalOpen, setMultiActionModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);

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

      {/* People in Cadence Table */}
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

