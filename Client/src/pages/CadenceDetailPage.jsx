// src/pages/CadenceDetailPage.jsx
import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";

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
      currentStep: "Step 2: Email Follow Up",
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

  const handleExecuteAction = (personId, e) => {
    e.stopPropagation();
    // Placeholder - no implementation yet
    console.log("Execute action for person:", personId);
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
      <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Company</th>
                <th className="px-4 py-3 text-left font-medium">First Name</th>
                <th className="px-4 py-3 text-left font-medium">Last Name</th>
                <th className="px-4 py-3 text-left font-medium">Title</th>
                <th className="px-4 py-3 text-left font-medium">Current Step</th>
                <th className="px-4 py-3 text-left font-medium">Execute Action</th>
                <th className="px-4 py-3 text-left font-medium">Additional Actions</th>
                <th className="px-4 py-3 text-left font-medium">Due on</th>
                <th className="px-4 py-3 text-left font-medium">Last Step Completed At</th>
              </tr>
            </thead>
            <tbody>
              {mockPeopleInCadence.map((person) => {
                const pastDue = isPastDue(person.dueOn);
                return (
                  <tr
                    key={person.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {person.company}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{person.firstName}</td>
                    <td className="px-4 py-3 text-gray-700">{person.lastName}</td>
                    <td className="px-4 py-3 text-gray-600">{person.title}</td>
                    <td className="px-4 py-3 text-gray-700">{person.currentStep}</td>
                    <td className="px-4 py-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-gray-600 hover:text-gray-900"
                        onClick={(e) => handleExecuteAction(person.id, e)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {person.id === 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                              onClick={(e) => handleHistoricalActions(person.id, e)}
                            >
                              Historical Actions
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                              onClick={(e) => handleSkip(person.id, e)}
                            >
                              Skip
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
                              onClick={(e) => handlePostpone(person.id, e)}
                            >
                              Postpone
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
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
                    <td className="px-4 py-3 text-gray-600">
                      {formatLastStepCompleted(person.lastStepCompletedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

