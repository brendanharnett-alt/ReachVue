import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Play,
  History,
  SkipForward,
  Clock,
  Mail,
  Phone,
  Linkedin,
} from "lucide-react";
import { fetchContactCadenceSteps } from "@/api";
import PostponePopover from "@/components/cadence/PostponePopover";

// -----------------------------
// Helpers
// -----------------------------

function getActionIcon(type) {
  switch (type?.toLowerCase()) {
    case "email":
      return <Mail className="h-4 w-4 text-gray-500" />;
    case "phone":
    case "call":
      return <Phone className="h-4 w-4 text-gray-500" />;
    case "linkedin":
      return <Linkedin className="h-4 w-4 text-gray-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

function isPastDue(dateString) {
  if (!dateString) return false;
  const dateOnly = dateString.includes("T")
    ? dateString.split("T")[0]
    : dateString;
  const dueDate = new Date(dateOnly);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

function formatDateWithOrdinal(dateString) {
  if (!dateString) return "—";

  const dateOnly = dateString.includes("T")
    ? dateString.split("T")[0]
    : dateString;

  const [year, month, day] = dateOnly.split("-").map(Number);
  const date = new Date(year, month - 1, day);

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

  return `${date.toLocaleString("en-US", {
    month: "long",
  })} ${day}${getOrdinal(day)}, ${year}`;
}

function formatSkippedDateTime(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "—";

  return `${date.toLocaleString("en-US", {
    month: "short",
  })} ${date.getDate()}, ${date.getFullYear()} ${date.toLocaleTimeString(
    "en-US",
    { hour: "numeric", minute: "2-digit" }
  )}`;
}

// -----------------------------
// Component
// -----------------------------

export default function MultiActionModal({
  open,
  onOpenChange,
  person,
  onCompleteStep,
  onSkipStep,
  onPostponeStep,
  onViewHistory,
  onExecuteStep,
  cadenceId,
  cadenceStructure,
}) {
  const [steps, setSteps] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!open || !person?.id) return;

    setLoadingSteps(true);
    fetchContactCadenceSteps(person.id)
      .then((data) => {
        const currentDay = person.dayNumber;
        const filtered =
          currentDay != null
            ? data.filter((s) => s.day_number === currentDay)
            : data;
        setSteps(filtered);
      })
      .catch(() => setSteps([]))
      .finally(() => setLoadingSteps(false));
  }, [open, person?.id, refreshKey]);

  if (!person) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={false}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {person.firstName} {person.lastName} — {person.currentStep}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 border rounded-lg bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-xs uppercase text-gray-600">
              <tr>
                <th className="px-4 py-3">Step Name</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingSteps ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    Loading…
                  </td>
                </tr>
              ) : steps.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center">
                    No steps found
                  </td>
                </tr>
              ) : (
                steps.map((step) => {
                  const pastDue = isPastDue(step.due_on);

                  return (
                    <tr
                      key={step.cadence_step_id}
                      className="border-b hover:bg-gray-50 group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getActionIcon(step.action_type)}
                          {step.step_label}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {step.status === "skipped" && step.skipped_at
                          ? `Skipped on ${formatSkippedDateTime(
                              step.skipped_at
                            )}`
                          : step.status === "completed" && step.completed_at
                          ? `Completed on ${formatSkippedDateTime(
                              step.completed_at
                            )}`
                          : formatDateWithOrdinal(step.due_on)}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {(step.status === "skipped" || step.status === "completed") ? (
                            <button
                              className="h-6 w-6 rounded-full flex items-center justify-center border cursor-not-allowed opacity-50"
                              disabled
                            >
                              <Play className="h-3 w-3 text-gray-400" />
                            </button>
                          ) : (
                            <button
                              className="h-6 w-6 rounded-full flex items-center justify-center border hover:bg-gray-100"
                              onClick={() => {
                                if (onExecuteStep) {
                                  // Open appropriate touch modal based on step type
                                  onExecuteStep(person, step);
                                } else {
                                  // Fallback to original behavior
                                  onCompleteStep?.(
                                    person.id,
                                    step.cadence_step_id
                                  ).then(() => setRefreshKey((k) => k + 1));
                                }
                              }}
                            >
                              <Play
                                className={`h-3 w-3 ${
                                  pastDue ? "text-blue-700" : "text-gray-900"
                                }`}
                              />
                            </button>
                          )}

                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                            <button
                              onClick={() => onViewHistory?.(person.id)}
                              title="View History"
                            >
                              <History className="h-4 w-4 text-gray-500" />
                            </button>

                            {(step.status === "skipped" || step.status === "completed") ? (
                              <>
                                <button
                                  disabled
                                  className="cursor-not-allowed opacity-50"
                                  title="Skip"
                                >
                                  <SkipForward className="h-4 w-4 text-gray-300" />
                                </button>

                                <PostponePopover
                                  disabled={true}
                                  onConfirm={async (date) => {
                                    await onPostponeStep(
                                      person.id,
                                      step.cadence_step_id,
                                      date
                                    );
                                    setRefreshKey((k) => k + 1);
                                  }}
                                />
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    onSkipStep?.(
                                      person.id,
                                      step.cadence_step_id
                                    ).then(() =>
                                      setRefreshKey((k) => k + 1)
                                    )
                                  }
                                  title="Skip"
                                >
                                  <SkipForward className="h-4 w-4 text-gray-500" />
                                </button>

                                <PostponePopover
                                  onConfirm={async (date) => {
                                    await onPostponeStep(
                                      person.id,
                                      step.cadence_step_id,
                                      date
                                    );
                                    setRefreshKey((k) => k + 1);
                                  }}
                                />
                              </>
                            )}
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
      </DialogContent>
    </Dialog>
  );
}
