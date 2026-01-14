// src/components/modals/MultiActionModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Play, History, SkipForward, Clock, Mail, Phone, Linkedin } from "lucide-react";
import { fetchContactCadenceSteps } from "@/api";

// Get action icon based on type (same as cadence structure page)
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

// Format skipped date/time as "Mon XX, XXXX HH:MM AM/PM" (e.g., "Jan 14, 2026 2:30 PM")
function formatSkippedDateTime(dateString) {
  if (!dateString) return "—";

  let date;
  if (dateString instanceof Date) {
    date = dateString;
  } else if (typeof dateString === 'string') {
    // Parse ISO timestamp
    date = new Date(dateString);
  } else {
    return "—";
  }

  if (isNaN(date.getTime())) return "—";

  // Get month abbreviation (first 3 letters)
  const monthAbbr = date.toLocaleString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  
  // Format time in 12-hour format with AM/PM
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${monthAbbr} ${day}, ${year} ${displayHours}:${displayMinutes} ${ampm}`;
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
  const [refreshKey, setRefreshKey] = useState(0);

  // Wrapper for onSkipStep that refreshes modal data after skip
  const handleSkipWithRefresh = async (personId, cadenceStepId, e) => {
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MultiActionModal.jsx:110',message:'handleSkipWithRefresh called',data:{personId,cadenceStepId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (onSkipStep) {
      try {
        await onSkipStep(personId, cadenceStepId, e);
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MultiActionModal.jsx:115',message:'Skip completed, triggering refresh',data:{personId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        // Trigger refresh by incrementing refreshKey
        setRefreshKey(prev => prev + 1);
      } catch (err) {
        // #region agent log
        fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MultiActionModal.jsx:120',message:'Skip failed',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        console.error('Skip failed:', err);
      }
    }
  };

  useEffect(() => {
    if (open && person?.id) {
      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MultiActionModal.jsx:108',message:'useEffect triggered - fetching steps',data:{open,personId:person?.id,personDayNumber:person?.dayNumber},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setLoadingSteps(true);
      fetchContactCadenceSteps(person.id)
        .then((stepsData) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MultiActionModal.jsx:113',message:'Steps fetched from API',data:{stepCount:stepsData?.length,steps:stepsData?.map(s=>({id:s.cadence_step_id,label:s.step_label,status:s.status,skipped_at:s.skipped_at,due_on:s.due_on}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          // Filter steps to only show current day
          const currentDay = person?.dayNumber;
          const filteredSteps = currentDay != null 
            ? stepsData.filter(step => step.day_number === currentDay)
            : stepsData;
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MultiActionModal.jsx:120',message:'Setting filtered steps to state',data:{filteredCount:filteredSteps?.length,filteredSteps:filteredSteps?.map(s=>({id:s.cadence_step_id,status:s.status,skipped_at:s.skipped_at}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
          // #endregion
          setSteps(filteredSteps);
        })
        .catch((err) => {
          // #region agent log
          fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MultiActionModal.jsx:125',message:'Error fetching steps',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
          // #endregion
          console.error("Failed to fetch contact cadence steps:", err);
          setSteps([]);
        })
        .finally(() => setLoadingSteps(false));
    } else {
      setSteps([]);
    }
  }, [open, person?.id, refreshKey]);

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
                      // #region agent log
                      fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MultiActionModal.jsx:150',message:'Rendering step row',data:{stepId:step.cadence_step_id,stepLabel:step.step_label,status:step.status,skipped_at:step.skipped_at,due_on:step.due_on,isSkipped:step.status==='skipped'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                      // #endregion
                      return (
                        <tr
                          key={step.cadence_step_id}
                          className="border-b hover:bg-gray-50 transition group"
                        >
                          <td className="px-4 py-3 text-gray-700">
                            <div className="flex items-center gap-2">
                              {getActionIcon(step.action_type)}
                              <span>{step.step_label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {step.status === 'skipped' && step.skipped_at
                              ? `Skipped on: ${formatSkippedDateTime(step.skipped_at)}`
                              : formatDateWithOrdinal(step.due_on)}
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
                                    handleSkipWithRefresh(person.id, step.cadence_step_id, e);
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

