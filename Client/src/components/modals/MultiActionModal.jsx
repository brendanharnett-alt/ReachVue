// src/components/modals/MultiActionModal.jsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchContactCadenceSteps } from "@/api";

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
  person
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
                    <th className="px-4 py-3 text-left font-medium">Action</th>
                    <th className="px-4 py-3 text-left font-medium">Due Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSteps ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : steps.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="px-4 py-8 text-center text-gray-500">
                        No steps found
                      </td>
                    </tr>
                  ) : (
                    steps.map((step) => (
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
                      </tr>
                    ))
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

