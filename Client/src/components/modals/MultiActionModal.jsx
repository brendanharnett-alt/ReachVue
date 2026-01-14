// src/components/modals/MultiActionModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, History, SkipForward, Clock } from "lucide-react";
import { fetchContactCadenceSteps } from "@/api";

// Check if date is past due
function isPastDue(dateString) {
  if (!dateString) return false;
  // Handle ISO timestamp format by extracting date part
  const dateOnly = typeof dateString === 'string' && dateString.includes('T')
    ? dateString.split('T')[0]
    : dateString;
  const dueDate = new Date(dateOnly);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

// Format date as "June 15th, 2025"
function formatDateWithOrdinal(dateString) {
  if (!dateString) return "—";

  // Handle Date objects
  let date;
  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === 'string') {
    // Handle ISO timestamp format (e.g., "2026-01-14T05:00:00.000Z") by extracting date part
    const dateOnly = dateString.split('T')[0]; // Extract YYYY-MM-DD from ISO string
    // Parse yyyy-mm-dd as LOCAL date
    const [year, month, day] = dateOnly.split("-").map(Number);
    date = new Date(year, month - 1, day);
  } else {
    return "—";
  }

  const dayNum = date.getDate();
  const monthName = date.toLocaleString("en-US", { month: "long" });
  const yearNum = date.getFullYear();

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

  return `${monthName} ${dayNum}${getOrdinal(dayNum)}, ${yearNum}`;
}

export default function MultiActionModal({ 
  open, 
  onOpenChange, 
  person,
  onCompleteStep,
  onSkipStep,
  onPostponeStep,
  onViewHistory
}) {
  const [steps, setSteps] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);

  useEffect(() => {
    if (open && person?.id) {
      setLoadingSteps(true);
      fetchContactCadenceSteps(person.id)
        .then((stepsData) => {
          // Filter steps to only show current day
          const currentDay = person?.dayNumber;
          const filteredSteps = currentDay != null 
            ? stepsData.filter(step => step.day_number === currentDay)
            : stepsData;
          setSteps(filteredSteps);
        })
        .catch((err) => {
          console.error("Failed to fetch contact cadence steps:", err);
          setSteps([]);
        })
        .finally(() => setLoadingSteps(false));
    } else {
      setSteps([]);
    }
  }, [open, person?.id]);

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {person.firstName} {person.lastName} - {person.currentStep}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Step Name</th>
                    <th className="px-4 py-3 text-left font-medium">Due Date</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSteps ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : steps.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                        No steps found
                      </td>
                    </tr>
                  ) : (
                    steps.map((step) => {
                      const pastDue = isPastDue(step.due_on);
                      return (
                        <tr
                          key={step.cadence_step_id}
                          className="border-b hover:bg-gray-50 transition group"
                        >
                          <td className="px-4 py-3 text-gray-700">
                            {step.step_label}
                          </td>
                          <td className="px-4 py-3">
                            {formatDateWithOrdinal(step.due_on)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <button
                                className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                  pastDue
                                    ? "bg-gray-200 hover:bg-gray-300"
                                    : "border border-gray-300 bg-transparent hover:border-gray-400"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onCompleteStep) {
                                    onCompleteStep(person.id, step.cadence_step_id, e);
                                  }
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
                              {/* Action icons - visible on row hover */}
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onViewHistory) {
                                      onViewHistory(person.id, e);
                                    }
                                  }}
                                  title="View History"
                                >
                                  <History className="h-4 w-4" />
                                </button>
                                <button
                                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onSkipStep) {
                                      onSkipStep(person.id, step.cadence_step_id, e);
                                    }
                                  }}
                                  title="Skip Step"
                                >
                                  <SkipForward className="h-4 w-4" />
                                </button>
                                <button
                                  className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onPostponeStep) {
                                      onPostponeStep(person.id, step.cadence_step_id, null, e);
                                    }
                                  }}
                                  title="Postpone"
                                >
                                  <Clock className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

