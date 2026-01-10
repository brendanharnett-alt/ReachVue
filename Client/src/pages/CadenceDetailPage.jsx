// src/pages/CadenceDetailPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Layers,
} from "lucide-react";
import MultiActionModal from "@/components/modals/MultiActionModal";
import CadenceContactPanel from "@/components/panels/CadenceContactPanel";
import AddStepModal from "@/components/modals/AddStepModal";
import AddContactToCadenceModal from "@/components/modals/AddContactToCadenceModal";
import { fetchCadenceSteps, createCadenceStep, deleteCadenceStep, fetchCadenceContacts, addContactToCadence, fetchContacts, removeContactFromCadence, skipCadenceStep } from "@/api";

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

// Compute due date from started date and day number
function computeDueDate(startedAt, dayNumber) {
  if (startedAt === null || startedAt === undefined || dayNumber === null || dayNumber === undefined) {
    return null;
  }
  const date = new Date(startedAt);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayNumber);
  return date.toISOString().split("T")[0];
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
  const location = useLocation();
  const cadenceName = getCadenceName(parseInt(cadenceId));
  const [peopleInCadence, setPeopleInCadence] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [multiActionModalOpen, setMultiActionModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [addContactModalOpen, setAddContactModalOpen] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  
  // Check URL params for tab query param
  const searchParams = new URLSearchParams(location.search);
  const initialTab = searchParams.get("tab") || "people";
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const [cadenceStructure, setCadenceStructure] = useState([]);
  const [loadingSteps, setLoadingSteps] = useState(true);
  const [addStepModalOpen, setAddStepModalOpen] = useState(false);
  const [addStepDayNumber, setAddStepDayNumber] = useState(0);
  const [cadenceActionsOpen, setCadenceActionsOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromDay, setDraggedFromDay] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);

  // Sync tab state with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") || "people";
    setActiveTab(tab);
  }, [location.search]);

  // Fetch cadence steps from backend
  useEffect(() => {
    const loadSteps = async () => {
      if (!cadenceId) return;
      setLoadingSteps(true);
      try {
        const steps = await fetchCadenceSteps(cadenceId);
        // Transform backend data to match UI structure (group by day_number)
        const groupedByDay = {};
        steps.forEach((step) => {
          const day = step.day_number || 0;
          if (!groupedByDay[day]) {
            groupedByDay[day] = {
              day,
              actions: [],
            };
          }
          groupedByDay[day].actions.push({
            id: step.id,
            type: step.action_type || "task",
            label: step.step_label,
            step_order: step.step_order,
            day_number: step.day_number,
            action_value: step.action_value,
          });
        });
        // Convert to array and sort by day
        const structure = Object.values(groupedByDay).sort((a, b) => a.day - b.day);
        setCadenceStructure(structure);
      } catch (err) {
        console.error("Failed to load cadence steps:", err);
        setCadenceStructure([]);
      } finally {
        setLoadingSteps(false);
      }
    };
    loadSteps();
  }, [cadenceId]);

  // Fetch cadence contacts from backend
  useEffect(() => {
    const loadContacts = async () => {
      
      
      
      if (!cadenceId) return;
      setLoadingContacts(true);
      try {
        const [cadenceContacts, allContacts] = await Promise.all([
          fetchCadenceContacts(cadenceId),
          fetchContacts(), // Fetch all contacts to get company and title
        ]);
        
        // Create a map of contact_id to full contact details
        const contactMap = new Map();
        allContacts.forEach((contact) => {
          contactMap.set(contact.id, contact);
        });
        
        // Transform backend data to match UI format
        
        setPeopleInCadence(
          transformCadencePeople({
            cadenceContacts,
            allContacts,
            cadenceStructure,
          })
        );
        
      } catch (err) {
        console.error("Failed to load cadence contacts:", err);
        setPeopleInCadence([]);
      } finally {
        setLoadingContacts(false);
      }
    };
    // Only load contacts after steps are loaded (we need cadenceStructure for due date calculation)
    if (!loadingSteps && cadenceId) {
      loadContacts();
    }
  }, [cadenceId, cadenceStructure, loadingSteps]);

  // Get real actions for multi-action steps from cadence structure
  const getMultiActions = (person) => {
    if (!person) {
      return [];
    }
    
    // Get day number from person object
    let dayNumber = person.dayNumber;
    
    // If dayNumber is not set, try to get it from currentStepOrder
    if ((dayNumber === null || dayNumber === undefined) && person.currentStepOrder !== null && person.currentStepOrder !== undefined && cadenceStructure.length > 0) {
      const allSteps = cadenceStructure.flatMap((day) => day.actions);
      const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
      if (currentStep) {
        dayNumber = currentStep.day_number;
      }
    }
    
    if (dayNumber === null || dayNumber === undefined) {
      return [];
    }
    
    // Find the day in cadence structure that matches the day number
    const dayData = cadenceStructure.find((d) => d.day === dayNumber);
    if (!dayData || !dayData.actions || dayData.actions.length === 0) {
      return [];
    }
    
    // Return ALL actions for this day (not just the current step)
    return dayData.actions.map((action) => ({
      id: action.id,
      name: action.label || action.type || "Unknown",
      dueOn: person.dueOn || null,
      type: action.type,
      step_order: action.step_order,
    }));
  };

  const handleOpenMultiActionModal = (person) => {
    setSelectedPerson(person);
    setMultiActionModalOpen(true);
  };

  const handleExecuteAction = (person, e) => {
    e.stopPropagation();
    // Open modal for any step - it will show all steps for that day
    // First, we need to determine the day number from the current step
    if (person.currentStepOrder !== null && person.currentStepOrder !== undefined && cadenceStructure.length > 0) {
      const allSteps = cadenceStructure.flatMap((day) => day.actions);
      const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
      if (currentStep) {
        // Create a person object with the correct dayNumber for the modal
        const personWithDay = {
          ...person,
          dayNumber: currentStep.day_number
        };
        handleOpenMultiActionModal(personWithDay);
      } else {
        // Fallback: use person's dayNumber if available
        if (person.dayNumber !== null && person.dayNumber !== undefined) {
          handleOpenMultiActionModal(person);
        }
      }
    } else if (person.dayNumber !== null && person.dayNumber !== undefined) {
      handleOpenMultiActionModal(person);
    } else {
      // Placeholder - no implementation yet
      console.log("Execute action for person:", person.id);
    }
  };

  const handleStepTextClick = (person) => {
    // Open modal for any step - it will show all steps for that day
    // First, we need to determine the day number from the current step
    if (person.currentStepOrder !== null && person.currentStepOrder !== undefined && cadenceStructure.length > 0) {
      const allSteps = cadenceStructure.flatMap((day) => day.actions);
      const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
      if (currentStep) {
        // Create a person object with the correct dayNumber for the modal
        const personWithDay = {
          ...person,
          dayNumber: currentStep.day_number
        };
        handleOpenMultiActionModal(personWithDay);
      } else {
        // Fallback: use person's dayNumber if available
        if (person.dayNumber !== null && person.dayNumber !== undefined) {
          handleOpenMultiActionModal(person);
        }
      }
    } else if (person.dayNumber !== null && person.dayNumber !== undefined) {
      handleOpenMultiActionModal(person);
    }
  };

  const handleLinkedInClick = (e) => {
    e.stopPropagation();
    // Open IBM CEO Arvind Krishna's LinkedIn profile
    window.open("https://www.linkedin.com/in/arvindkrishna/", "_blank");
  };

  const handleSkip = async (personId, e) => {
    e.stopPropagation();
    
    // personId should be the contact_cadence_id
    console.log('[SKIP STEP FRONTEND] Skipping step for personId:', personId);
    const person = peopleInCadence.find(p => p.id === personId || p.contactId === personId);
    console.log('[SKIP STEP FRONTEND] Found person:', { 
      id: person?.id, 
      contactId: person?.contactId, 
      name: person ? `${person.firstName} ${person.lastName}` : 'NOT FOUND' 
    });
    
    if (!person) {
      console.error('[SKIP STEP FRONTEND] Person not found for personId:', personId);
      alert('Contact not found');
      return;
    }
    
    // Use the contact_cadence_id (person.id)
    const contactCadenceId = person.id;
    console.log('[SKIP STEP FRONTEND] Using contact_cadence_id:', contactCadenceId);
    
    try {
      await skipCadenceStep(contactCadenceId);
      
      // Refresh the contacts list to show the updated step
      const [cadenceContacts, allContacts] = await Promise.all([
        fetchCadenceContacts(cadenceId),
        fetchContacts(),
      ]);
      
      setPeopleInCadence(
        transformCadencePeople({
          cadenceContacts,
          allContacts,
          cadenceStructure,
        })
      );
      
    } catch (err) {
      console.error("Failed to skip step:", err);
      alert(`Failed to skip step: ${err.message || "Please try again."}`);
    }
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
    // Find the day number for this index
    const dayNumber = cadenceStructure[dayIndex]?.day ?? 0;
    setAddStepDayNumber(dayNumber);
    setAddStepModalOpen(true);
  };

  const handleAddStepSuccess = async (formData) => {
    try {
      // Calculate step_order (next available order for this cadence)
      const allSteps = cadenceStructure.flatMap((day) => day.actions);
      const maxStepOrder = allSteps.length > 0 
        ? Math.max(...allSteps.map((a) => a.step_order || 0))
        : -1;
      const nextStepOrder = maxStepOrder + 1;

      // Create the step via API
      await createCadenceStep(cadenceId, {
        step_order: nextStepOrder,
        day_number: formData.day_number,
        step_label: formData.step_label,
        action_type: formData.action_type,
        action_value: null,
      });

      // Reload steps from backend
      const steps = await fetchCadenceSteps(cadenceId);
      const groupedByDay = {};
      steps.forEach((step) => {
        const day = step.day_number || 0;
        if (!groupedByDay[day]) {
          groupedByDay[day] = {
            day,
            actions: [],
          };
        }
        groupedByDay[day].actions.push({
          id: step.id,
          type: step.action_type || "task",
          label: step.step_label,
          step_order: step.step_order,
          day_number: step.day_number,
          action_value: step.action_value,
        });
      });
      const structure = Object.values(groupedByDay).sort((a, b) => a.day - b.day);
      setCadenceStructure(structure);
    } catch (err) {
      console.error("Failed to create step:", err);
      alert(err.message || "Failed to create step. Please try again.");
      // Re-throw so modal doesn't close
      throw err;
    }
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

  const handleDeleteAction = async (dayIndex, actionIndex) => {
    const action = cadenceStructure[dayIndex]?.actions[actionIndex];
    if (!action || !action.id) {
      console.error("Cannot delete: action or action.id is missing", { action, dayIndex, actionIndex });
      return;
    }

    if (!window.confirm(`Delete step "${action.label}"?`)) {
      return;
    }

    try {
      await deleteCadenceStep(action.id);
      // Refresh the cadence steps from the backend
      const steps = await fetchCadenceSteps(cadenceId);
      // Transform backend data to match UI structure (group by day_number)
      const groupedByDay = {};
      steps.forEach((step) => {
        const day = step.day_number || 0;
        if (!groupedByDay[day]) {
          groupedByDay[day] = {
            day,
            actions: [],
          };
        }
        groupedByDay[day].actions.push({
          id: step.id,
          type: step.action_type || "task",
          label: step.step_label,
          step_order: step.step_order,
          day_number: step.day_number,
          action_value: step.action_value,
        });
      });
      // Convert to array and sort by day
      const structure = Object.values(groupedByDay).sort((a, b) => a.day - b.day);
      setCadenceStructure(structure);
    } catch (err) {
      console.error("Failed to delete cadence step:", err);
      alert(`Failed to delete step: ${err.message || "Please try again."}`);
    }
  };

  const handleCadenceAction = (action, e) => {
    // Close dropdown first
    setCadenceActionsOpen(false);
    // Prevent event propagation if event is provided
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    // Use setTimeout to ensure dropdown closes before modal opens
    setTimeout(() => {
      switch (action) {
        case "addStep":
          // Add step to day 0 by default (find day 0 index or create)
          const day0Index = cadenceStructure.findIndex((d) => d.day === 0);
          if (day0Index >= 0) {
            handleAddStep(day0Index);
          } else {
            // If day 0 doesn't exist, create it
            setAddStepDayNumber(0);
            setAddStepModalOpen(true);
          }
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
    }, 50); // Small delay to ensure dropdown closes first
  };

  // Handle checkbox selection
  const toggleSelect = (contactCadenceId) => {
    setSelectedContacts((prev) =>
      prev.includes(contactCadenceId)
        ? prev.filter((id) => id !== contactCadenceId)
        : [...prev, contactCadenceId]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedContacts.length === peopleInCadence.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(peopleInCadence.map((person) => person.id));
    }
  };

  // Handle delete selected contacts
  const handleDeleteSelected = async () => {
    if (!selectedContacts.length) return;
    if (!window.confirm(`Remove ${selectedContacts.length} contact(s) from this cadence?`)) return;

    try {
      // Delete each selected contact from cadence
      await Promise.all(
        selectedContacts.map((contactCadenceId) =>
          removeContactFromCadence(contactCadenceId)
        )
      );

      // Reload contacts
      const [cadenceContacts, allContacts] = await Promise.all([
        fetchCadenceContacts(cadenceId),
        fetchContacts(),
      ]);

      const contactMap = new Map();
      allContacts.forEach((c) => {
        contactMap.set(c.id, c);
      });

      // Use the same transformation logic as the main useEffect
      setPeopleInCadence(
        transformCadencePeople({
          cadenceContacts,
          allContacts,
          cadenceStructure,
        })
      );
      
      setSelectedContacts([]);
      alert(`✅ ${selectedContacts.length} contact(s) removed from cadence.`);
    } catch (err) {
      console.error("Failed to remove contacts from cadence:", err);
      alert("❌ Failed to remove contacts from cadence. Please try again.");
    }
  };

  const handleAddContact = async (contact) => {
    try {
      await addContactToCadence(cadenceId, contact.id);
      const [cadenceContacts, allContacts] = await Promise.all([
        fetchCadenceContacts(cadenceId),
        fetchContacts(),
      ]);
      
      setPeopleInCadence(
        transformCadencePeople({
          cadenceContacts,
          allContacts,
          cadenceStructure,
        })
      );
      
    } catch (err) {
      console.error("Failed to add contact to cadence:", err);
      alert(err.message || "Failed to add contact to cadence. Please try again.");
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
              {peopleInCadence.length} people in cadence
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          onClick={() => {
            setActiveTab("people");
            navigate(`/cadences/${cadenceId}?tab=people`, { replace: true });
          }}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "people"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          People
        </button>
        <button
          onClick={() => {
            setActiveTab("structure");
            navigate(`/cadences/${cadenceId}?tab=structure`, { replace: true });
          }}
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
        <div className="flex w-full">
        <div
          className={`border rounded-lg bg-white shadow-sm overflow-x-auto ${
            selectedContact ? "w-2/3" : "w-full"
          }`}
        >
          {/* Add to Cadence Button */}
          <div className="p-4 border-b flex justify-end gap-2">
            {selectedContacts.length > 0 && (
              <Button
                variant="destructive"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4" />
                Remove Selected ({selectedContacts.length})
              </Button>
            )}
            <Button
              onClick={() => setAddContactModalOpen(true)}
              className="bg-primary text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Cadence
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
              <tr>
                <th className="p-2 pl-4 w-[5%]">
                  <input
                    type="checkbox"
                    checked={
                      selectedContacts.length > 0 &&
                      selectedContacts.length === peopleInCadence.length
                    }
                    onChange={toggleSelectAll}
                    className="accent-blue-600 cursor-pointer"
                  />
                </th>
                <th className="p-2 pl-4 text-left font-medium">Company</th>
                <th className="p-2 text-left font-medium">Full Name</th>
                <th className="p-2 text-left font-medium">Current Step</th>
                {!selectedContact && (
                  <>
                    <th className="p-2 text-left font-medium">Actions</th>
                    <th className="p-2 text-left font-medium w-24">Due on</th>
                    <th className="p-2 text-left font-medium w-32">Last Step Completed At</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {loadingContacts ? (
                <tr>
                  <td colSpan={selectedContact ? 4 : 7} className="p-8 text-center text-gray-500">
                    Loading contacts...
                  </td>
                </tr>
              ) : peopleInCadence.length === 0 ? (
                <tr>
                  <td colSpan={selectedContact ? 4 : 7} className="p-8 text-center text-gray-500">
                    No contacts in this cadence yet. Click "Add to Cadence" to get started.
                  </td>
                </tr>
              ) : (
                peopleInCadence.map((person) => {
                const pastDue = isPastDue(person.dueOn);
                const isSelected = selectedContacts.includes(person.id);
                return (
                  <tr
                    key={person.id}
                    className={`border-b hover:bg-gray-50 transition group ${
                      isSelected ? "bg-blue-50" : ""
                    }`}
                  >
                    <td className="p-2 pl-4">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(person.id)}
                        className="accent-blue-600 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td className="p-2 pl-4 font-medium text-gray-900 truncate max-w-[140px]">
                      {person.company}
                    </td>
                    <td className="p-2 text-gray-700">
                      <div className="flex flex-col gap-1">
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
                        {person.title && (
                          <span className="text-xs text-gray-600 truncate max-w-[160px]">{person.title}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="flex flex-col gap-0.5">
                        {/* First row: Icon + step name or "Multi-step" */}
                        <div className="flex items-center gap-1.5">
                          {person.stepInfo?.isMultiStep ? (
                            <Layers className="h-4 w-4 text-gray-500 flex-shrink-0" />
                          ) : person.stepInfo?.stepType ? (
                            (() => {
                              const stepType = person.stepInfo.stepType.toLowerCase();
                              if (stepType === "email") {
                                return <Mail className="h-4 w-4 text-gray-500 flex-shrink-0" />;
                              } else if (stepType === "phone" || stepType === "call") {
                                return <Phone className="h-4 w-4 text-gray-500 flex-shrink-0" />;
                              } else if (stepType === "linkedin") {
                                return <Linkedin className="h-4 w-4 text-gray-500 flex-shrink-0" />;
                              } else {
                                return <Clock className="h-4 w-4 text-gray-500 flex-shrink-0" />;
                              }
                            })()
                          ) : null}
                          <span
                            className="text-gray-700 cursor-pointer hover:text-gray-900"
                            onClick={() => handleStepTextClick(person)}
                          >
                            {person.currentStep}
                          </span>
                        </div>
                        {/* Second row: "Day N: Step #" or "Day N: X remaining steps" */}
                        {person.stepInfo?.dayNumber !== null && person.stepInfo?.dayNumber !== undefined && (
                          <span className="text-xs text-gray-500">
                            {person.stepInfo.isMultiStep ? (
                              `Day ${person.stepInfo.dayNumber}: ${person.stepInfo.remainingSteps || 0} remaining steps`
                            ) : person.stepInfo.overallStepNumber ? (
                              `Day ${person.stepInfo.dayNumber}: Step ${person.stepInfo.overallStepNumber}`
                            ) : (
                              `Day ${person.stepInfo.dayNumber}`
                            )}
                          </span>
                        )}
                      </div>
                    </td>
                    {!selectedContact && (
                      <>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
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
                            {/* Action icons - visible on row hover */}
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHistoricalActions(person.id, e);
                                }}
                                title="View History"
                              >
                                <History className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSkip(person.id, e);
                                }}
                                title="Skip Step"
                              >
                                <SkipForward className="h-4 w-4" />
                              </button>
                              <button
                                className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePostpone(person.id, e);
                                }}
                                title="Postpone"
                              >
                                <Clock className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="p-2 w-24">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              pastDue
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {formatDateWithOrdinal(person.dueOn)}
                          </span>
                        </td>
                        <td className="p-2 text-gray-600 whitespace-nowrap text-xs w-32">
                          {formatLastStepCompleted(person.lastStepCompletedAt)}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
              )}
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
              <DropdownMenu open={cadenceActionsOpen} onOpenChange={setCadenceActionsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    Cadence Actions
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCadenceAction("addStep", e);
                    }}
                  >
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
              {loadingSteps ? (
                <div className="text-center py-8 text-gray-500">
                  Loading steps...
                </div>
              ) : cadenceStructure.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No steps yet. Click "Add Step" to create your first step.
                </div>
              ) : (
                cadenceStructure.map((step, dayIndex) => (
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
                ))
              )}
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
          actions={selectedPerson ? getMultiActions(selectedPerson) : []}
        />
      )}

      {/* Add Step Modal */}
      <AddStepModal
        open={addStepModalOpen}
        onClose={() => setAddStepModalOpen(false)}
        onSuccess={handleAddStepSuccess}
        dayNumber={addStepDayNumber}
      />

      {/* Add Contact to Cadence Modal */}
      <AddContactToCadenceModal
        open={addContactModalOpen}
        onClose={() => setAddContactModalOpen(false)}
        onAdd={handleAddContact}
        cadenceId={cadenceId}
      />
    </div>
  );
}

function transformCadencePeople({
  cadenceContacts,
  allContacts,
  cadenceStructure,
}) {
  // Build lookup maps once
  const contactMap = new Map();
  allContacts.forEach((c) => contactMap.set(c.id, c));

  const allSteps = cadenceStructure.flatMap((d) => d.actions);

  // Step order → step
  const stepByOrder = new Map();
  allSteps.forEach((s) => {
    stepByOrder.set(s.step_order, s);
  });

  // Steps sorted by true execution order
  const stepsInSequence = [...allSteps].sort((a, b) => {
    if (a.day_number !== b.day_number) {
      return a.day_number - b.day_number;
    }
    return a.step_order - b.step_order;
  });

  const firstStep = stepsInSequence[0] || null;

  return cadenceContacts.map((cc) => {
    const fullContact = contactMap.get(cc.contact_id) || {};

    // 🔑 SOURCE OF TRUTH
    let currentStepOrder = cc.current_step_order;

    // Only default if backend truly has no step yet
    if (currentStepOrder == null && firstStep) {
      currentStepOrder = firstStep.step_order;
    }

    const step = stepByOrder.get(currentStepOrder) || null;

    let dayNumber = step?.day_number ?? null;

    // Multi-step logic
    const daySteps =
      dayNumber != null
        ? cadenceStructure.find((d) => d.day === dayNumber)?.actions || []
        : [];

    const isMultiStep = daySteps.length > 1;

    let remainingSteps = null;
    if (isMultiStep && step) {
      const sortedDaySteps = [...daySteps].sort(
        (a, b) => a.step_order - b.step_order
      );
      const idx = sortedDaySteps.findIndex(
        (s) => s.step_order === currentStepOrder
      );
      if (idx !== -1) {
        remainingSteps = sortedDaySteps.length - idx;
      }
    }

    // Overall step number (single-step only)
    let overallStepNumber = null;
    if (!isMultiStep && step) {
      const idx = stepsInSequence.findIndex(
        (s) =>
          s.step_order === currentStepOrder &&
          s.day_number === step.day_number
      );
      if (idx !== -1) {
        overallStepNumber = idx + 1;
      }
    }

    // Due date
    let dueOn = null;
    if (cc.started_at && dayNumber != null) {
      const d = new Date(cc.started_at);
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + dayNumber);
      dueOn = d.toISOString().split("T")[0];
    }

    return {
      id: cc.contact_cadence_id,
      contactId: cc.contact_id,

      company: fullContact.company || "—",
      firstName: cc.first_name || "",
      lastName: cc.last_name || "",
      first_name: cc.first_name || "",
      last_name: cc.last_name || "",
      title: fullContact.title || "—",
      email: fullContact.email || null,
      mobile_phone: fullContact.mobile_phone || null,
      phone: fullContact.mobile_phone || null,
      linkedin_url: fullContact.linkedin_url || null,
      tags: fullContact.tags || [],

      currentStep: isMultiStep
        ? "Multi-step"
        : step?.label || "Not Started",

      currentStepOrder,
      dayNumber,

      stepInfo: {
        isMultiStep,
        stepType: step?.type || "task",
        remainingSteps,
        stepName: step?.label || null,
        dayNumber,
        overallStepNumber,
      },

      dueOn,
      lastStepCompletedAt: null,
    };
  });
}
