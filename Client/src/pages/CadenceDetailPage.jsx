// src/pages/CadenceDetailPage.jsx

import PostponePopover from "@/components/cadence/PostponePopover"
import React, { useState, useEffect, useMemo, useRef } from "react";
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
import CadenceActivityTimelineModal from "@/components/modals/CadenceActivityTimelineModal";
import StepContentModal from "@/components/modals/StepContentModal";
import CadenceStepEmailModal from "@/components/modals/CadenceStepEmailModal";
import EmailModal from "@/components/modals/EmailModal";
import CadenceCallModal from "@/components/modals/CadenceCallModal";
import CadenceLinkedInModal from "@/components/modals/CadenceLinkedInModal";
import { fetchCadenceSteps, createCadenceStep, deleteCadenceStep, fetchCadenceContacts, addContactToCadence, fetchContacts, removeContactFromCadence, skipCadenceStep, completeCadenceStep, postponeCadenceStep, fetchCadenceById } from "@/api";

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

// Get cadence name from ID - will be fetched from backend

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

  // Parse yyyy-mm-dd as LOCAL date
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

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
  const location = useLocation();
  const [cadenceName, setCadenceName] = useState("Loading...");
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
  const [contentModalOpen, setContentModalOpen] = useState(false);
  const [emailContentModalOpen, setEmailContentModalOpen] = useState(false);
  const [stepMetadata, setStepMetadata] = useState(null);
  const isTransitioningToContent = useRef(false);
  const [cadenceActionsOpen, setCadenceActionsOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState(null);
  const [draggedFromDay, setDraggedFromDay] = useState(null);
  const [dragOverDay, setDragOverDay] = useState(null);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [timelineContact, setTimelineContact] = useState(null);
  
  // Step execution modal states
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalContact, setEmailModalContact] = useState(null);
  const [emailModalStepData, setEmailModalStepData] = useState(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callModalContact, setCallModalContact] = useState(null);
  const [callModalStepData, setCallModalStepData] = useState(null);
  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false);
  const [linkedInModalContact, setLinkedInModalContact] = useState(null);
  const [linkedInModalStepData, setLinkedInModalStepData] = useState(null);

  // Sync tab state with URL params
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get("tab") || "people";
    setActiveTab(tab);
  }, [location.search]);

  // Fetch cadence name and steps from backend
  useEffect(() => {
    const loadCadenceData = async () => {
      if (!cadenceId) return;
      setLoadingSteps(true);
      try {
        // Load cadence name and steps in parallel
        const [cadence, steps] = await Promise.all([
          fetchCadenceById(cadenceId),
          fetchCadenceSteps(cadenceId),
        ]);
        
        if (cadence) {
          setCadenceName(cadence.name || `Cadence ${cadenceId}`);
        } else {
          setCadenceName(`Cadence ${cadenceId}`);
        }
        
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
        console.error("Failed to load cadence data:", err);
        setCadenceName(`Cadence ${cadenceId}`);
        setCadenceStructure([]);
      } finally {
        setLoadingSteps(false);
      }
    };
    loadCadenceData();
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

  const handleExecuteAction = async (person, e) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:410',message:'handleExecuteAction called',data:{hasPerson:!!person,personId:person?.id,contactId:person?.contactId,currentStepOrder:person?.currentStepOrder,isMultiStep:person?.stepInfo?.isMultiStep,cadenceStructureLength:cadenceStructure?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    e.stopPropagation();
    
    // Check if this is a multi-action step
    const isMultiStep = person.stepInfo?.isMultiStep === true;
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:415',message:'isMultiStep check',data:{isMultiStep,stepInfo:person?.stepInfo},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    if (isMultiStep) {
      // Multi-action: open modal to show all steps for the day
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
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:437',message:'Single step path entered',data:{currentStepOrder:person?.currentStepOrder,cadenceStructureLength:cadenceStructure?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
      // Single step: open appropriate modal based on action_type
      if (person.currentStepOrder !== null && person.currentStepOrder !== undefined && cadenceStructure.length > 0) {
        const allSteps = cadenceStructure.flatMap((day) => day.actions);
        const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:441',message:'Step lookup result',data:{hasCurrentStep:!!currentStep,currentStepId:currentStep?.id,currentStepType:currentStep?.type,currentStepActionType:currentStep?.action_type,currentStepLabel:currentStep?.label,actionValueType:typeof currentStep?.action_value,actionValue:currentStep?.action_value,allStepsCount:allSteps.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        if (!currentStep) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:444',message:'Current step not found - alerting',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
          // #endregion
          alert('Unable to determine which step to execute');
          return;
        }
        
        // Extract action_type and action_value from the step
        const actionType = currentStep.type || currentStep.action_type || 'task';
        let actionValue = currentStep.action_value || null;
        
        // Parse action_value if it's a string
        if (typeof actionValue === 'string' && actionValue.trim()) {
          try {
            actionValue = JSON.parse(actionValue);
          } catch (err) {
            // If parsing fails, keep as string
            console.warn('Failed to parse action_value as JSON:', err);
          }
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:456',message:'Action type and value extracted',data:{actionType,actionValueType:typeof actionValue,actionValue,hasEmailSubject:!!actionValue?.email_subject,hasEmailBody:!!actionValue?.email_body,hasInstructions:!!actionValue?.instructions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        // #endregion
        
        // Create contact object for modal
        const contact = {
          id: person.contactId,
          first_name: person.firstName || person.first_name || '',
          last_name: person.lastName || person.last_name || '',
          email: person.email || null,
        };
        
        // Open appropriate modal based on action_type
        if (actionType === 'email') {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:461',message:'Opening email modal',data:{hasContact:!!contact,contactId:contact?.id,emailSubject:actionValue?.email_subject,emailBodyLength:actionValue?.email_body?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          
          // Extract email data from action_value
          const emailSubject = actionValue?.email_subject || '';
          const emailBody = actionValue?.email_body || '';
          
          setEmailModalStepData({
            initialSubject: emailSubject,
            initialBody: emailBody,
            cadenceStepId: currentStep.id,
            contactCadenceId: person.id,
          });
          setEmailModalContact(contact);
          setEmailModalOpen(true);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:471',message:'Email modal state set',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
        } else if (actionType === 'phone' || actionType === 'call') {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:473',message:'Opening call modal',data:{hasContact:!!contact,contactId:contact?.id,instructions:actionValue?.instructions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          
          // Extract instructions from action_value
          const instructions = actionValue?.instructions || '';
          
          setCallModalStepData({
            instructions: instructions,
            cadenceStepId: currentStep.id,
            contactCadenceId: person.id,
          });
          setCallModalContact(contact);
          setCallModalOpen(true);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:483',message:'Call modal state set',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
        } else if (actionType === 'linkedin') {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:485',message:'Opening LinkedIn modal',data:{hasContact:!!contact,contactId:contact?.id,instructions:actionValue?.instructions},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          
          // Extract instructions from action_value
          const instructions = actionValue?.instructions || '';
          
          setLinkedInModalStepData({
            instructions: instructions,
            cadenceStepId: currentStep.id,
            contactCadenceId: person.id,
          });
          setLinkedInModalContact(contact);
          setLinkedInModalOpen(true);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:495',message:'LinkedIn modal state set',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
        } else {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:497',message:'Unsupported action type',data:{actionType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H'})}).catch(()=>{});
          // #endregion
          alert(`Step type "${actionType}" is not yet supported for execution`);
        }
      } else {
        alert('Unable to determine which step to execute');
      }
    }
  };

  const handleExecuteStepFromMultiAction = (person, step) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:499',message:'handleExecuteStepFromMultiAction called',data:{hasPerson:!!person,hasStep:!!step,stepId:step?.cadence_step_id,stepActionType:step?.action_type,stepLabel:step?.step_label},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'Q'})}).catch(()=>{});
    // #endregion
    
    // Close MultiActionModal
    setMultiActionModalOpen(false);
    
    // Find the step in cadenceStructure to get action_value
    const allSteps = cadenceStructure.flatMap((day) => day.actions);
    const cadenceStep = allSteps.find((s) => s.id === step.cadence_step_id);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:507',message:'Step lookup from cadenceStructure',data:{hasCadenceStep:!!cadenceStep,cadenceStepId:cadenceStep?.id,actionValueType:typeof cadenceStep?.action_value},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'R'})}).catch(()=>{});
    // #endregion
    
    if (!cadenceStep) {
      alert('Unable to find step details');
      return;
    }
    
    // Extract action_type and action_value
    const actionType = step.action_type || cadenceStep.type || cadenceStep.action_type || 'task';
    let actionValue = cadenceStep.action_value || null;
    
    // Parse action_value if it's a string
    if (typeof actionValue === 'string' && actionValue.trim()) {
      try {
        actionValue = JSON.parse(actionValue);
      } catch (err) {
        console.warn('Failed to parse action_value as JSON:', err);
      }
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:523',message:'Action type and value extracted',data:{actionType,actionValueType:typeof actionValue,hasEmailSubject:!!actionValue?.email_subject,hasEmailBody:!!actionValue?.email_body,hasInstructions:!!actionValue?.instructions},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'S'})}).catch(()=>{});
    // #endregion
    
    // Create contact object for modal
    const contact = {
      id: person.contactId,
      first_name: person.firstName || person.first_name || '',
      last_name: person.lastName || person.last_name || '',
      email: person.email || null,
    };
    
    // Open appropriate modal based on action_type
    if (actionType === 'email') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:538',message:'Opening email modal from multi-action',data:{hasContact:!!contact,contactId:contact?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'T'})}).catch(()=>{});
      // #endregion
      
      const emailSubject = actionValue?.email_subject || '';
      const emailBody = actionValue?.email_body || '';
      
      setEmailModalStepData({
        initialSubject: emailSubject,
        initialBody: emailBody,
        cadenceStepId: cadenceStep.id,
        contactCadenceId: person.id,
      });
      setEmailModalContact(contact);
      setEmailModalOpen(true);
    } else if (actionType === 'phone' || actionType === 'call') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:550',message:'Opening call modal from multi-action',data:{hasContact:!!contact,contactId:contact?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'T'})}).catch(()=>{});
      // #endregion
      
      const instructions = actionValue?.instructions || '';
      
      setCallModalStepData({
        instructions: instructions,
        cadenceStepId: cadenceStep.id,
        contactCadenceId: person.id,
      });
      setCallModalContact(contact);
      setCallModalOpen(true);
    } else if (actionType === 'linkedin') {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:562',message:'Opening LinkedIn modal from multi-action',data:{hasContact:!!contact,contactId:contact?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'T'})}).catch(()=>{});
      // #endregion
      
      const instructions = actionValue?.instructions || '';
      
      setLinkedInModalStepData({
        instructions: instructions,
        cadenceStepId: cadenceStep.id,
        contactCadenceId: person.id,
      });
      setLinkedInModalContact(contact);
      setLinkedInModalOpen(true);
    } else {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:574',message:'Unsupported action type from multi-action',data:{actionType},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'U'})}).catch(()=>{});
      // #endregion
      alert(`Step type "${actionType}" is not yet supported for execution`);
    }
  };

  const handleStepTextClick = async (person, e) => {
    if (e) {
      e.stopPropagation();
    }
    // Check if this is a multi-action step
    const isMultiStep = person.stepInfo?.isMultiStep === true;
    
    if (isMultiStep) {
      // Multi-action: open modal to show all steps for the day
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
    }
    // Single step: do nothing when clicking step name
  };

  const handleLinkedInClick = (e) => {
    e.stopPropagation();
    // Open IBM CEO Arvind Krishna's LinkedIn profile
    window.open("https://www.linkedin.com/in/arvindkrishna/", "_blank");
  };

  const handleSkip = async (personId, cadenceStepId = null, e = null) => {
    if (e) e.stopPropagation();
    
    // personId should be the contact_cadence_id
    const person = peopleInCadence.find(p => p.id === personId || p.contactId === personId);
    
    if (!person) {
      console.error('[SKIP STEP FRONTEND] Person not found for personId:', personId);
      alert('Contact not found');
      return;
    }
    
    // Use the contact_cadence_id (person.id)
    const contactCadenceId = person.id;
    
    // If cadenceStepId not provided, find it from currentStepOrder
    let stepId = cadenceStepId;
    if (!stepId && person.currentStepOrder != null) {
      const allSteps = cadenceStructure.flatMap((day) => day.actions);
      const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
      if (currentStep) {
        stepId = currentStep.id;
      }
    }
    
    if (!stepId) {
      alert('Unable to determine which step to skip');
      return;
    }
    
    try {
      await skipCadenceStep(contactCadenceId, stepId);
      
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

  const handleCompleteStep = async (personId, cadenceStepId, e = null) => {
    if (e) e.stopPropagation();
    
    const person = peopleInCadence.find(p => p.id === personId || p.contactId === personId);
    
    if (!person) {
      alert('Contact not found');
      return;
    }
    
    const contactCadenceId = person.id;
    
    if (!cadenceStepId) {
      alert('Step ID is required');
      return;
    }
    
    try {
      await completeCadenceStep(contactCadenceId, cadenceStepId);
      
      // Refresh the contacts list
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
      
      // Close modal if open
      setMultiActionModalOpen(false);
      
    } catch (err) {
      console.error("Failed to complete step:", err);
      alert(`Failed to complete step: ${err.message || "Please try again."}`);
    }
  };

  const handlePostpone = async (personId, cadenceStepId = null, postponeDays = 1, e = null) => {
    if (e) e.stopPropagation();
    
    const person = peopleInCadence.find(p => p.id === personId || p.contactId === personId);
    
    if (!person) {
      alert('Contact not found');
      return;
    }
    
    const contactCadenceId = person.id;
    
    // If cadenceStepId not provided, find it from currentStepOrder
    let stepId = cadenceStepId;
    if (!stepId && person.currentStepOrder != null) {
      const allSteps = cadenceStructure.flatMap((day) => day.actions);
      const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
      if (currentStep) {
        stepId = currentStep.id;
      }
    }
    
    if (!stepId) {
      alert('Unable to determine which step to postpone');
      return;
    }
    
    // Prompt for postpone days if not provided
    if (!postponeDays || postponeDays <= 0) {
      const daysInput = prompt('How many days to postpone?', '1');
      if (!daysInput) return;
      postponeDays = parseInt(daysInput, 10);
      if (isNaN(postponeDays) || postponeDays <= 0) {
        alert('Please enter a valid number of days');
        return;
      }
    }
    
    try {
      await postponeCadenceStep(contactCadenceId, stepId, postponeDays);
      
      // Refresh the contacts list
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
      console.error("Failed to postpone step:", err);
      alert(`Failed to postpone step: ${err.message || "Please try again."}`);
    }
  };

  const handleHistoricalActions = (personId, e) => {
    if (e) e.stopPropagation();
    // Find the person/contact for the timeline modal
    const person = peopleInCadence.find(p => p.id === personId || p.contactId === personId);
    if (person) {
      setTimelineContact(person);
      setTimelineModalOpen(true);
    }
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

  const handleNextToContent = (metadata) => {
    // Set flag to prevent metadata reset during transition
    isTransitioningToContent.current = true;
    // Store metadata BEFORE closing the first modal
    setStepMetadata(metadata);
    // Close first modal and open appropriate content modal based on action_type
    setAddStepModalOpen(false);
    // Small delay to ensure state is set before opening next modal
    setTimeout(() => {
      if (metadata.action_type === "email") {
        setEmailContentModalOpen(true);
      } else {
        setContentModalOpen(true);
      }
      // Reset flag after modals are set
      isTransitioningToContent.current = false;
    }, 0);
  };

  const handleBackToStepModal = () => {
    setContentModalOpen(false);
    setEmailContentModalOpen(false);
    setAddStepModalOpen(true);
  };

  const handleAddStepSuccess = async (formData) => {
    try {
      // Debug logging
      console.log('handleAddStepSuccess called with formData:', formData);
      
      // Validate required fields
      if (!formData || !formData.step_label || formData.step_label.trim() === '') {
        alert('Step name is required');
        return;
      }

      // Calculate step_order (next available order for this cadence)
      const allSteps = cadenceStructure.flatMap((day) => day.actions);
      const maxStepOrder = allSteps.length > 0 
        ? Math.max(...allSteps.map((a) => a.step_order || 0))
        : -1;
      const nextStepOrder = maxStepOrder + 1;

      // Construct action_value JSON object based on step type
      const actionType = formData.action_type || 'task';
      let actionValue = null;

      if (actionType === 'email') {
        // Email step: include subject, body, and thread
        actionValue = {
          email_subject: formData.email_subject || "",
          email_body: formData.email_body || "",
          thread: formData.thread || null,
        };
      } else if (actionType === 'phone' || actionType === 'call') {
        // Phone/Call step: include instructions
        actionValue = {
          instructions: formData.instructions || "",
        };
      } else if (actionType === 'linkedin') {
        // LinkedIn step: include instructions
        actionValue = {
          instructions: formData.instructions || "",
        };
      } else if (actionType === 'task') {
        // Task step: include instructions
        actionValue = {
          instructions: formData.instructions || "",
        };
      }

      // Create the step via API
      const stepPayload = {
        step_order: nextStepOrder,
        day_number: formData.day_number || 0,
        step_label: formData.step_label,
        action_type: actionType,
        action_value: actionValue,
      };
      
      console.log('Creating step with payload:', stepPayload);
      await createCadenceStep(cadenceId, stepPayload);

      // Reset modals and state
      setAddStepModalOpen(false);
      setContentModalOpen(false);
      setEmailContentModalOpen(false);
      setStepMetadata(null);

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
                            className={`text-gray-700 ${
                              person.stepInfo?.isMultiStep 
                                ? "cursor-pointer hover:text-gray-900" 
                                : ""
                            }`}
                            onClick={(e) => handleStepTextClick(person, e)}
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
                                  // Check if this is a multi-action step
                                  const isMultiStep = person.stepInfo?.isMultiStep === true;
                                  
                                  if (isMultiStep) {
                                    // Multi-action: open modal to show all steps for the day
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
                                  } else {
                                    // Single step: skip directly
                                    handleSkip(person.id, null, e);
                                  }
                                }}
                                title="Skip Step"
                              >
                                <SkipForward className="h-4 w-4" />
                              </button>
                              <PostponePopover
  onConfirm={async (date) => {
    try {
      // 1. Find the current step being postponed
      const allSteps = cadenceStructure.flatMap((d) => d.actions)
      const step = allSteps.find(
        (s) => s.step_order === person.currentStepOrder
      )

      if (!step) {
        alert("Unable to determine step to postpone")
        return
      }

      // 2. Call backend
      await postponeCadenceStep(
        person.id,     // contact_cadence_id
        step.id,       // cadence_step_id
        date           // new_due_on (YYYY-MM-DD)
      )

      // 3. Refresh people list
      const [cadenceContacts, allContacts] = await Promise.all([
        fetchCadenceContacts(cadenceId),
        fetchContacts(),
      ])

      setPeopleInCadence(
        transformCadencePeople({
          cadenceContacts,
          allContacts,
          cadenceStructure,
        })
      )
    } catch (err) {
      console.error(err)
      alert(err.message || "Failed to postpone step")
    }
  }}
/>


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
          onCompleteStep={handleCompleteStep}
          onSkipStep={handleSkip}
          onPostponeStep={handlePostpone}
          onViewHistory={handleHistoricalActions}
          onExecuteStep={handleExecuteStepFromMultiAction}
          cadenceId={cadenceId}
          cadenceStructure={cadenceStructure}
        />
      )}

      {/* Add Step Modal */}
      <AddStepModal
        open={addStepModalOpen}
        onClose={() => {
          setAddStepModalOpen(false);
          // Only reset metadata if we're not transitioning to content modal
          if (!isTransitioningToContent.current) {
            setStepMetadata(null);
          }
        }}
        onSuccess={handleAddStepSuccess}
        onNext={handleNextToContent}
        dayNumber={addStepDayNumber}
      />

      {/* Step Content Modal (Phone, LinkedIn, Task) */}
      <StepContentModal
        open={contentModalOpen}
        onClose={() => {
          setContentModalOpen(false);
          setStepMetadata(null);
        }}
        onBack={handleBackToStepModal}
        onSuccess={handleAddStepSuccess}
        stepData={stepMetadata}
        actionType={stepMetadata?.action_type}
      />

      {/* Email Content Modal */}
      <CadenceStepEmailModal
        open={emailContentModalOpen}
        onClose={() => {
          setEmailContentModalOpen(false);
          setStepMetadata(null);
        }}
        onBack={handleBackToStepModal}
        onSuccess={handleAddStepSuccess}
        stepData={stepMetadata}
      />

      {/* Add Contact to Cadence Modal */}
      <AddContactToCadenceModal
        open={addContactModalOpen}
        onClose={() => setAddContactModalOpen(false)}
        onAdd={handleAddContact}
        cadenceId={cadenceId}
      />

      {/* Cadence Activity Timeline Modal */}
      <CadenceActivityTimelineModal
        open={timelineModalOpen}
        onClose={() => {
          setTimelineModalOpen(false);
          setTimelineContact(null);
        }}
        contact={timelineContact}
        cadenceId={cadenceId}
        cadenceName={cadenceName}
      />

      {/* Email Modal for Step Execution */}
      {emailModalContact && (
        <>
          {/* #region agent log */}
          {(() => {
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:1680',message:'Email modal rendering',data:{emailModalOpen,hasContact:!!emailModalContact,contactId:emailModalContact?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
            return null;
          })()}
          {/* #endregion */}
          <EmailModal
            open={emailModalOpen}
            contact={emailModalContact}
            onClose={() => {
              setEmailModalOpen(false);
              setEmailModalContact(null);
              setEmailModalStepData(null);
            }}
            onSend={({ contactId, lastTouched }) => {
              // Handle email sent - could refresh contact data here if needed
            }}
            initialSubject={emailModalStepData?.initialSubject || ""}
            initialBody={emailModalStepData?.initialBody || ""}
            cadenceId={cadenceId}
            onCompleteStep={
              emailModalStepData?.cadenceStepId && emailModalStepData?.contactCadenceId
                ? () => handleCompleteStep(
                    emailModalStepData.contactCadenceId,
                    emailModalStepData.cadenceStepId
                  )
                : null
            }
          />
        </>
      )}

      {/* Call Modal for Step Execution */}
      {callModalContact && (
        <>
          {/* #region agent log */}
          {(() => {
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:1700',message:'Call modal rendering',data:{callModalOpen,hasContact:!!callModalContact,contactId:callModalContact?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
            return null;
          })()}
          {/* #endregion */}
          <CadenceCallModal
            isOpen={callModalOpen}
            contact={callModalContact}
            onClose={() => {
              setCallModalOpen(false);
              setCallModalContact(null);
              setCallModalStepData(null);
            }}
            onSuccess={() => {
              // Handle call logged - could refresh contact data here if needed
            }}
            instructions={callModalStepData?.instructions || ""}
            cadenceId={cadenceId}
            onCompleteStep={
              callModalStepData?.cadenceStepId && callModalStepData?.contactCadenceId
                ? () => handleCompleteStep(
                    callModalStepData.contactCadenceId,
                    callModalStepData.cadenceStepId
                  )
                : null
            }
          />
        </>
      )}

      {/* LinkedIn Modal for Step Execution */}
      {linkedInModalContact && (
        <>
          {/* #region agent log */}
          {(() => {
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadenceDetailPage.jsx:1720',message:'LinkedIn modal rendering',data:{linkedInModalOpen,hasContact:!!linkedInModalContact,contactId:linkedInModalContact?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
            return null;
          })()}
          {/* #endregion */}
          <CadenceLinkedInModal
            isOpen={linkedInModalOpen}
            contact={linkedInModalContact}
            onClose={() => {
              setLinkedInModalOpen(false);
              setLinkedInModalContact(null);
              setLinkedInModalStepData(null);
            }}
            onSuccess={() => {
              // Handle LinkedIn touch logged - could refresh contact data here if needed
            }}
            instructions={linkedInModalStepData?.instructions || ""}
            cadenceId={cadenceId}
            onCompleteStep={
              linkedInModalStepData?.cadenceStepId && linkedInModalStepData?.contactCadenceId
                ? () => handleCompleteStep(
                    linkedInModalStepData.contactCadenceId,
                    linkedInModalStepData.cadenceStepId
                  )
                : null
            }
          />
        </>
      )}
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

    // Backend returns current_day, not current_step_order
    // Find the first step in the current day to determine current_step_order
    let currentStepOrder = null;
    let dayNumber = cc.current_day ?? null;

    if (dayNumber != null) {
      // Find the first step for this day (by step_order)
      const dayData = cadenceStructure.find((d) => d.day === dayNumber);
      if (dayData && dayData.actions.length > 0) {
        const sortedDaySteps = [...dayData.actions].sort(
          (a, b) => a.step_order - b.step_order
        );
        // Use the first step in the day as the current step
        // (Backend doesn't tell us which specific step is pending, so we use the first)
        currentStepOrder = sortedDaySteps[0]?.step_order ?? null;
      }
    }

    // Fallback: if no current_day, use first step
    if (currentStepOrder == null && firstStep) {
      currentStepOrder = firstStep.step_order;
      dayNumber = firstStep.day_number;
    }

    const step = stepByOrder.get(currentStepOrder) || null;

    // Multi-step logic - use backend's is_multi_step if available
    const daySteps =
      dayNumber != null
        ? cadenceStructure.find((d) => d.day === dayNumber)?.actions || []
        : [];

    const isMultiStep = cc.is_multi_step ?? (daySteps.length > 1);

    let remainingSteps = null;
    if (isMultiStep) {
      // Use backend's pending_steps_in_day if available, otherwise calculate
      if (cc.pending_steps_in_day != null) {
        remainingSteps = cc.pending_steps_in_day;
      } else if (step) {
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

    const dueOn = cc.due_on
  ? cc.due_on.split("T")[0]   // normalize to YYYY-MM-DD
  : null;




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
