// src/components/modals/MultiActionModal.jsx
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Play, MoreVertical, SkipForward, Clock, History } from "lucide-react";

export default function MultiActionModal({ 
  open, 
  onOpenChange, 
  person, 
  actions,
  onCompleteStep,
  onSkipStep,
  onPostponeStep
}) {
  if (!person || !actions) return null;

  const handleExecuteAction = (actionId, e) => {
    e.stopPropagation();
    if (onCompleteStep) {
      onCompleteStep(person.id, actionId, e);
    } else {
      console.log("Execute action:", actionId, "for person:", person.id);
    }
  };

  const handleSkip = (actionId, e) => {
    e.stopPropagation();
    if (onSkipStep) {
      onSkipStep(person.id, actionId, e);
    } else {
      console.log("Skip action:", actionId);
    }
  };

  const handlePostpone = (actionId, e) => {
    e.stopPropagation();
    if (onPostponeStep) {
      onPostponeStep(person.id, actionId, null, e);
    } else {
      console.log("Postpone action:", actionId);
    }
  };

  const handleViewHistory = (actionId, e) => {
    e.stopPropagation();
    console.log("View history for action:", actionId);
    // Placeholder - no implementation yet
  };

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
                    <th className="px-4 py-3 text-left font-medium">Execute</th>
                    <th className="px-4 py-3 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {actions.map((action) => {
                    const isPastDue = action.dueOn
                      ? new Date(action.dueOn) < new Date()
                      : false;
                    return (
                      <tr
                        key={action.id}
                        className="border-b hover:bg-gray-50 transition group"
                      >
                        <td className="px-4 py-3 text-gray-700">
                          {action.name}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-6 flex items-center justify-start flex-shrink-0">
                              <button
                                className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                  isPastDue
                                    ? "bg-gray-200 hover:bg-gray-300"
                                    : "border border-gray-300 bg-transparent hover:border-gray-400"
                                }`}
                                onClick={(e) => handleExecuteAction(action.id, e)}
                              >
                                <Play
                                  className={`h-3 w-3 ${
                                    isPastDue
                                      ? "text-blue-700 fill-blue-700"
                                      : "text-gray-900"
                                  }`}
                                />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
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
                                  handleViewHistory(action.id, e);
                                }}
                              >
                                <History className="mr-2 h-4 w-4" />
                                View History
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSkip(action.id, e);
                                }}
                              >
                                <SkipForward className="mr-2 h-4 w-4" />
                                Skip Action
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePostpone(action.id, e);
                                }}
                              >
                                <Clock className="mr-2 h-4 w-4" />
                                Postpone
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

