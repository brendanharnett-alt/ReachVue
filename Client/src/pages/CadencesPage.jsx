// src/pages/CadencesPage.jsx
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, MailCheck, Eye, Edit, Play, MoreVertical, History, SkipForward, Clock, ChevronRight, ChevronDown, Trash2, Mail, Phone, Linkedin, Layers } from "lucide-react";
import CreateCadenceModal from "@/components/modals/CreateCadenceModal";
import PostponePopover from "@/components/cadence/PostponePopover";
import MultiActionModal from "@/components/modals/MultiActionModal";
import CadenceContactPanel from "@/components/panels/CadenceContactPanel";
import CadenceActivityTimelineModal from "@/components/modals/CadenceActivityTimelineModal";
import EmailModal from "@/components/modals/EmailModal";
import CadenceCallModal from "@/components/modals/CadenceCallModal";
import CadenceLinkedInModal from "@/components/modals/CadenceLinkedInModal";
import { fetchCadences, createCadence, deleteCadence, fetchCadenceContacts, fetchCadenceSteps, fetchContacts, skipCadenceStep, postponeCadenceStep, completeCadenceStep, fetchContactCadenceSteps } from "@/api";

// Check if date is past due
function isPastDue(dateString) {
  if (!dateString) return false;
  const dueDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
}

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

// Transform cadence people data (same as CadenceDetailPage)
function transformCadencePeople({
  cadenceContacts,
  allContacts,
  cadenceStructure,
}) {
  const contactMap = new Map();
  allContacts.forEach((c) => contactMap.set(c.id, c));

  const allSteps = cadenceStructure.flatMap((d) => d.actions);

  const stepByOrder = new Map();
  allSteps.forEach((s) => {
    stepByOrder.set(s.step_order, s);
  });

  const stepsInSequence = [...allSteps].sort((a, b) => {
    if (a.day_number !== b.day_number) {
      return a.day_number - b.day_number;
    }
    return a.step_order - b.step_order;
  });

  const firstStep = stepsInSequence[0] || null;

  return cadenceContacts.map((cc) => {
    const fullContact = contactMap.get(cc.contact_id) || {};

    let currentStepOrder = null;
    let dayNumber = cc.current_day ?? null;

    if (dayNumber != null) {
      const dayData = cadenceStructure.find((d) => d.day === dayNumber);
      if (dayData && dayData.actions.length > 0) {
        const sortedDaySteps = [...dayData.actions].sort(
          (a, b) => a.step_order - b.step_order
        );
        currentStepOrder = sortedDaySteps[0]?.step_order ?? null;
      }
    }

    if (currentStepOrder == null && firstStep) {
      currentStepOrder = firstStep.step_order;
      dayNumber = firstStep.day_number;
    }

    const step = stepByOrder.get(currentStepOrder) || null;

    const daySteps =
      dayNumber != null
        ? cadenceStructure.find((d) => d.day === dayNumber)?.actions || []
        : [];

    const isMultiStep = cc.is_multi_step ?? (daySteps.length > 1);

    let remainingSteps = null;
    if (isMultiStep) {
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

    const dueOn = cc.due_on ? cc.due_on.split("T")[0] : null;

    return {
      id: cc.contact_cadence_id,
      contactId: cc.contact_id,
      cadenceId: cc.cadence_id,
      cadenceName: null, // Will be set when grouping

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

export default function CadencesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("todo");
  const [groupBy, setGroupBy] = useState("campaign");
  const [expandedGroups, setExpandedGroups] = useState({});
  const [createCadenceModalOpen, setCreateCadenceModalOpen] = useState(false);
  const [cadences, setCadences] = useState([]);
  const [loadingCadences, setLoadingCadences] = useState(false);
  const [selectedCadences, setSelectedCadences] = useState([]);
  const [toDoItems, setToDoItems] = useState([]);
  const [loadingToDo, setLoadingToDo] = useState(true);
  
  // Modal states (same as CadenceDetailPage)
  const [multiActionModalOpen, setMultiActionModalOpen] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [selectedContact, setSelectedContact] = useState(null);
  const [timelineModalOpen, setTimelineModalOpen] = useState(false);
  const [timelineContact, setTimelineContact] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailModalContact, setEmailModalContact] = useState(null);
  const [emailModalStepData, setEmailModalStepData] = useState(null);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callModalContact, setCallModalContact] = useState(null);
  const [callModalStepData, setCallModalStepData] = useState(null);
  const [linkedInModalOpen, setLinkedInModalOpen] = useState(false);
  const [linkedInModalContact, setLinkedInModalContact] = useState(null);
  const [linkedInModalStepData, setLinkedInModalStepData] = useState(null);

  // Fetch cadences from backend
  useEffect(() => {
    const loadCadences = async () => {
      setLoadingCadences(true);
      try {
        const data = await fetchCadences();
        setCadences(data);
      } catch (err) {
        console.error("Failed to load cadences:", err);
      } finally {
        setLoadingCadences(false);
      }
    };
    loadCadences();
  }, []);

  // Load to do items (people with due/past due steps)
  const loadToDoItems = async () => {
    setLoadingToDo(true);
    try {
      const allCadences = await fetchCadences();
      const allContacts = await fetchContacts();
      
      // Fetch all cadence contacts and steps in parallel
      const cadenceDataPromises = allCadences.map(async (cadence) => {
        try {
          const [cadenceContacts, cadenceSteps] = await Promise.all([
            fetchCadenceContacts(cadence.id),
            fetchCadenceSteps(cadence.id),
          ]);

          // Transform steps to match structure expected by transformCadencePeople
          const groupedByDay = {};
          cadenceSteps.forEach((step) => {
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
          const cadenceStructure = Object.values(groupedByDay).sort((a, b) => a.day - b.day);

          // Transform contacts
          const transformedPeople = transformCadencePeople({
            cadenceContacts,
            allContacts,
            cadenceStructure,
          });

          // Filter to only include people with due or past due steps
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const peopleWithDueSteps = transformedPeople.filter((person) => {
            if (!person.dueOn) return false;
            const dueDate = new Date(person.dueOn);
            dueDate.setHours(0, 0, 0, 0);
            return dueDate <= today; // Due today or past due
          });

            // Add cadence name and structure to each person
            return peopleWithDueSteps.map((person) => ({
              ...person,
              cadenceName: cadence.name,
              cadenceStructure: cadenceStructure, // Store structure for this person's cadence
            }));
        } catch (err) {
          console.error(`Failed to load data for cadence ${cadence.id}:`, err);
          return [];
        }
      });

      const allToDoItems = (await Promise.all(cadenceDataPromises)).flat();
      setToDoItems(allToDoItems);
    } catch (err) {
      console.error("Failed to load to do items:", err);
      setToDoItems([]);
    } finally {
      setLoadingToDo(false);
    }
  };

  // Fetch to do items when tab is active
  useEffect(() => {
    if (activeTab === "todo") {
      loadToDoItems();
    }
  }, [activeTab]);

  const toggleGroupExpand = (group) =>
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }));

  // Group items by campaign when grouping is enabled
  const groupedData = useMemo(() => {
    if (groupBy === "none") return { All: toDoItems };

    if (groupBy === "campaign") {
      return toDoItems.reduce((acc, item) => {
        if (!acc[item.cadenceName]) acc[item.cadenceName] = [];
        acc[item.cadenceName].push(item);
        return acc;
      }, {});
    }

    return { All: toDoItems };
  }, [toDoItems, groupBy]);

  const groupedItems = groupedData;

  const handleCreateCadence = () => {
    setCreateCadenceModalOpen(true);
  };

  const handleCadenceCreated = async (cadenceData) => {
    try {
      const newCadence = await createCadence({
        name: cadenceData.name,
        description: cadenceData.description,
      });
      // Refresh cadences list
      const updatedCadences = await fetchCadences();
      setCadences(updatedCadences);
      // Navigate to the cadence structure tab
      navigate(`/cadences/${newCadence.id}?tab=structure`);
    } catch (err) {
      console.error("Failed to create cadence:", err);
      alert(err.message || "Failed to create cadence. Please try again.");
    }
  };

  const handleEdit = (cadenceId, e) => {
    e.stopPropagation(); // Prevent row click
    // Placeholder - no implementation yet
    console.log("Edit cadence:", cadenceId);
  };

  const handleView = (cadenceId, e) => {
    e.stopPropagation(); // Prevent row click
    navigate(`/cadences/${cadenceId}`);
  };

  const handleRowClick = (cadenceId) => {
    navigate(`/cadences/${cadenceId}`);
  };

  const handleToDoRowClick = (cadenceId) => {
    navigate(`/cadences/${cadenceId}`);
  };

  // Handle checkbox selection
  const toggleSelect = (cadenceId) => {
    setSelectedCadences((prev) =>
      prev.includes(cadenceId)
        ? prev.filter((id) => id !== cadenceId)
        : [...prev, cadenceId]
    );
  };

  // Handle select all
  const toggleSelectAll = () => {
    if (selectedCadences.length === cadences.length) {
      setSelectedCadences([]);
    } else {
      setSelectedCadences(cadences.map((cadence) => cadence.id));
    }
  };

  // Handle delete selected cadences
  const handleDeleteSelected = async () => {
    if (!selectedCadences.length) return;
    if (!window.confirm(`Delete ${selectedCadences.length} cadence(s)? This will remove all contacts from these cadences.`)) return;

    try {
      // #region agent log
      console.log('[DEBUG] Starting delete cadences', { selectedCadences, count: selectedCadences.length });
      // #endregion

      // Delete each selected cadence
      const results = await Promise.allSettled(
        selectedCadences.map((cadenceId) => {
          // #region agent log
          console.log('[DEBUG] Deleting cadence', { cadenceId, type: typeof cadenceId });
          // #endregion
          return deleteCadence(cadenceId);
        })
      );

      // #region agent log
      console.log('[DEBUG] Delete results', { results: results.map((r, i) => ({ 
        cadenceId: selectedCadences[i], 
        status: r.status, 
        error: r.status === 'rejected' ? r.reason?.message : null 
      })) });
      // #endregion

      // Check if any deletions failed
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        const errorMessages = failures.map((f) => f.reason?.message || 'Unknown error').join(', ');
        throw new Error(`Failed to delete ${failures.length} cadence(s): ${errorMessages}`);
      }

      // Refresh cadences list
      const updatedCadences = await fetchCadences();
      setCadences(updatedCadences);
      setSelectedCadences([]);
      alert(`✅ ${selectedCadences.length} cadence(s) deleted successfully.`);
    } catch (err) {
      console.error("Failed to delete cadences:", err);
      alert(`❌ Failed to delete cadences: ${err.message || 'Please try again.'}`);
    }
  };

  const handleSkip = async (person, e, providedStepId = null) => {
    if (e) e.stopPropagation();
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:725',message:'handleSkip called',data:{personId:person?.id,contactId:person?.contactId,providedStepId,currentStepOrder:person?.currentStepOrder,hasCadenceStructure:!!person?.cadenceStructure},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    // Use provided stepId if available, otherwise find from cadenceStructure
    let stepId = providedStepId;
    if (!stepId && person.currentStepOrder != null && person.cadenceStructure && person.cadenceStructure.length > 0) {
      const allSteps = person.cadenceStructure.flatMap((day) => day.actions);
      const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
      if (currentStep) {
        stepId = currentStep.id;
      }
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:733',message:'Step lookup from cadenceStructure',data:{foundStep:!!currentStep,stepId:currentStep?.id,allStepsCount:allSteps.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
    }
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:740',message:'Final stepId before skip',data:{stepId,contactCadenceId:person.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    
    if (!stepId) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:743',message:'No stepId found - alerting',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      alert('Unable to determine which step to skip');
      return;
    }
    
    try {
      await skipCadenceStep(person.id, stepId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:750',message:'skipCadenceStep succeeded, refreshing',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      // Refresh to do items
      await loadToDoItems();
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:755',message:'skipCadenceStep failed',data:{error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      console.error("Failed to skip step:", err);
      alert(err.message || "Failed to skip step");
    }
  };

  const handlePostpone = async (person, date, providedStepId = null) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:760',message:'handlePostpone called',data:{personId:person?.id,providedStepId,date,currentStepOrder:person?.currentStepOrder},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
    
    // Use provided stepId if available, otherwise find from cadenceStructure
    let stepId = providedStepId;
    if (!stepId && person.currentStepOrder != null && person.cadenceStructure && person.cadenceStructure.length > 0) {
      const allSteps = person.cadenceStructure.flatMap((day) => day.actions);
      const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
      if (currentStep) {
        stepId = currentStep.id;
      }
    }
    
    if (!stepId) {
      alert("Unable to determine step to postpone");
      return;
    }

    try {
      await postponeCadenceStep(person.id, stepId, date);
      // Refresh to do items
      await loadToDoItems();
    } catch (err) {
      console.error("Failed to postpone step:", err);
      alert(err.message || "Failed to postpone step");
    }
  };

  const handleHistoricalActions = (person, e) => {
    if (e) e.stopPropagation();
    // Find the person for the timeline modal
    if (person) {
      setTimelineContact(person);
      setTimelineModalOpen(true);
    }
  };

  const handleOpenMultiActionModal = (person) => {
    setSelectedPerson(person);
    setMultiActionModalOpen(true);
  };

  const handleExecuteAction = async (person, e) => {
    e.stopPropagation();
    
    // Check if this is a multi-action step
    const isMultiStep = person.stepInfo?.isMultiStep === true;
    
    if (isMultiStep) {
      // Multi-action: open modal to show all steps for the day
      if (person.currentStepOrder !== null && person.currentStepOrder !== undefined && person.cadenceStructure && person.cadenceStructure.length > 0) {
        const allSteps = person.cadenceStructure.flatMap((day) => day.actions);
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
      // Single step: open appropriate modal based on action_type
      if (person.currentStepOrder !== null && person.currentStepOrder !== undefined && person.cadenceStructure && person.cadenceStructure.length > 0) {
        const allSteps = person.cadenceStructure.flatMap((day) => day.actions);
        const currentStep = allSteps.find((s) => s.step_order === person.currentStepOrder);
        
        if (!currentStep) {
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
            console.warn('Failed to parse action_value as JSON:', err);
          }
        }
        
        // Create contact object for modal
        const contact = {
          id: person.contactId,
          first_name: person.firstName || person.first_name || '',
          last_name: person.lastName || person.last_name || '',
          email: person.email || null,
        };
        
        // Open appropriate modal based on action_type
        if (actionType === 'email') {
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
    } else if (actionType === 'phone' || actionType === 'call') {
      const instructions = actionValue?.instructions || '';
      
      setCallModalStepData({
        instructions: instructions,
        cadenceStepId: currentStep.id,
        contactCadenceId: person.id,
      });
      setCallModalContact(contact);
      setCallModalOpen(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:683',message:'Call modal state set',data:{hasContact:!!contact,contactId:contact?.id,cadenceStepId:currentStep.id,contactCadenceId:person.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
    } else if (actionType === 'linkedin') {
      const instructions = actionValue?.instructions || '';
      
      setLinkedInModalStepData({
        instructions: instructions,
        cadenceStepId: currentStep.id,
        contactCadenceId: person.id,
      });
      setLinkedInModalContact(contact);
      setLinkedInModalOpen(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:620',message:'LinkedIn modal state set',data:{hasContact:!!contact,contactId:contact?.id,cadenceStepId:currentStep.id,contactCadenceId:person.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
        } else {
          alert(`Step type "${actionType}" is not yet supported for execution`);
        }
      } else {
        alert('Unable to determine which step to execute');
      }
    }
  };

  const handleExecuteStepFromMultiAction = (person, step) => {
    // Close MultiActionModal
    setMultiActionModalOpen(false);
    
    // Find the step in cadenceStructure to get action_value
    const allSteps = person.cadenceStructure.flatMap((day) => day.actions);
    const cadenceStep = allSteps.find((s) => s.id === step.cadence_step_id);
    
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
    
    // Create contact object for modal
    const contact = {
      id: person.contactId,
      first_name: person.firstName || person.first_name || '',
      last_name: person.lastName || person.last_name || '',
      email: person.email || null,
    };
    
    // Open appropriate modal based on action_type
    if (actionType === 'email') {
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
      const instructions = actionValue?.instructions || '';
      
      setCallModalStepData({
        instructions: instructions,
        cadenceStepId: cadenceStep.id,
        contactCadenceId: person.id,
      });
      setCallModalContact(contact);
      setCallModalOpen(true);
    } else if (actionType === 'linkedin') {
      const instructions = actionValue?.instructions || '';
      
      setLinkedInModalStepData({
        instructions: instructions,
        cadenceStepId: cadenceStep.id,
        contactCadenceId: person.id,
      });
      setLinkedInModalContact(contact);
      setLinkedInModalOpen(true);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:622',message:'LinkedIn modal state set from multi-action',data:{hasContact:!!contact,contactId:contact?.id,cadenceStepId:cadenceStep.id,contactCadenceId:person.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:655',message:'LinkedIn modal state set from multi-action',data:{hasContact:!!contact,contactId:contact?.id,cadenceStepId:cadenceStep.id,contactCadenceId:person.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
    } else {
      alert(`Step type "${actionType}" is not yet supported for execution`);
    }
  };

  const handleCompleteStep = async (contactCadenceId, cadenceStepId) => {
    try {
      await completeCadenceStep(contactCadenceId, cadenceStepId);
      // Refresh to do items
      await loadToDoItems();
    } catch (err) {
      console.error("Failed to complete step:", err);
      throw err;
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
      if (person.currentStepOrder !== null && person.currentStepOrder !== undefined && person.cadenceStructure && person.cadenceStructure.length > 0) {
        const allSteps = person.cadenceStructure.flatMap((day) => day.actions);
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

  const handleLinkedInClick = (person, e) => {
    e.stopPropagation();
    if (person.linkedin_url) {
      window.open(person.linkedin_url, "_blank");
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <MailCheck className="h-6 w-6 text-gray-700" />
            Cadences
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Organize outreach into structured campaigns
          </p>
        </div>
        <Button className="flex items-center gap-2" onClick={handleCreateCadence}>
          <Plus className="h-4 w-4" />
          Create Cadence
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("todo")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "todo"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          To Do
        </button>
        <button
          onClick={() => setActiveTab("cadences")}
          className={`pb-2 px-1 text-sm font-medium transition-colors ${
            activeTab === "cadences"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Cadences
        </button>
      </div>

      {/* To Do Tab Content */}
      {activeTab === "todo" && (
        <div className="flex w-full">
        <div
          className={`border rounded-lg bg-white shadow-sm overflow-x-auto ${
            selectedContact ? "w-2/3" : "w-full"
          }`}
        >
          {/* Group by Dropdown */}
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-start">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  Group by
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setGroupBy("none")}>
                  None
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("campaign")}>
                  Campaign
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="overflow-x-auto">
            {loadingToDo ? (
              <div className="p-8 text-center text-gray-500">
                Loading to do items...
              </div>
            ) : toDoItems.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No items due or past due.
              </div>
            ) : (
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
                  <tr>
                    <th className="p-2 pl-4 text-left font-medium">Company</th>
                    <th className="p-2 text-left font-medium">Full Name</th>
                    <th className="p-2 text-left font-medium">Current Step</th>
                    <th className="p-2 text-left font-medium">Actions</th>
                    <th className="p-2 text-left font-medium w-24">Due on</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(groupedItems).map(([group, rows]) => (
                    <React.Fragment key={group}>
                      {groupBy !== "none" && (
                        <tr
                          className="bg-gray-100 font-semibold cursor-pointer"
                          onClick={() => toggleGroupExpand(group)}
                        >
                          <td className="p-2 pl-4">
                            {expandedGroups[group] ? (
                              <ChevronDown className="h-4 w-4 inline" />
                            ) : (
                              <ChevronRight className="h-4 w-4 inline" />
                            )}
                          </td>
                          <td className="p-2 text-blue-700" colSpan={1}>
                            {group}{" "}
                            <span className="text-gray-500 text-sm">
                              ({rows.length})
                            </span>
                          </td>
                          <td colSpan={3}></td>
                        </tr>
                      )}

                      {(groupBy === "none" || expandedGroups[group]) &&
                        rows.map((person) => {
                          const pastDue = isPastDue(person.dueOn);
                          return (
                            <tr
                              key={person.id}
                              className="border-b hover:bg-gray-50 transition group"
                            >
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
                                    {person.linkedin_url && (
                                      <button
                                        className="opacity-0 group-hover:opacity-100 transition-opacity h-3.5 w-3.5 rounded-sm bg-[#0077B5] flex items-center justify-center hover:bg-[#006399]"
                                        onClick={(e) => handleLinkedInClick(person, e)}
                                        title="Open LinkedIn Profile"
                                      >
                                        <span className="text-[8px] font-bold text-white leading-none">in</span>
                                      </button>
                                    )}
                                  </div>
                                  {person.title && (
                                    <span className="text-xs text-gray-600 truncate max-w-[160px]">
                                      {person.title}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="flex flex-col gap-0.5">
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
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <button
                                    className={`h-6 w-6 rounded-full flex items-center justify-center transition-all ${
                                      pastDue
                                        ? "bg-gray-200 hover:bg-gray-300"
                                        : "border border-gray-300 bg-transparent hover:border-gray-400"
                                    }`}
                                    onClick={(e) => handleExecuteAction(person, e)}
                                  >
                                    <Play
                                      className={`h-3 w-3 ${
                                        pastDue
                                          ? "text-blue-700 fill-blue-700"
                                          : "text-gray-900"
                                      }`}
                                    />
                                  </button>
                                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                      onClick={(e) => handleHistoricalActions(person, e)}
                                      title="View History"
                                    >
                                      <History className="h-4 w-4" />
                                    </button>
                                    <button
                                      className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
                                      onClick={(e) => handleSkip(person, e)}
                                      title="Skip Step"
                                    >
                                      <SkipForward className="h-4 w-4" />
                                    </button>
                                    <PostponePopover
                                      onConfirm={async (date) => {
                                        await handlePostpone(person, date);
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
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            )}
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

      {/* Cadences Tab Content */}
      {activeTab === "cadences" && (
        <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
          {/* Delete Button */}
          {selectedCadences.length > 0 && (
            <div className="p-4 border-b flex justify-end">
              <Button
                variant="destructive"
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700"
                onClick={handleDeleteSelected}
              >
                <Trash2 className="h-4 w-4" />
                Delete Selected ({selectedCadences.length})
              </Button>
            </div>
          )}
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="bg-gray-100 border-b text-gray-600 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 w-[5%]">
                <input
                  type="checkbox"
                  checked={
                    selectedCadences.length > 0 &&
                    selectedCadences.length === cadences.length
                  }
                  onChange={toggleSelectAll}
                  className="accent-blue-600 cursor-pointer"
                />
              </th>
              <th className="px-4 py-3 text-left">Cadence Name</th>
              <th className="px-4 py-3 text-left">Description</th>
              <th className="px-4 py-3 text-left"># of People</th>
              <th className="px-4 py-3 text-left">Last Activity</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadingCadences ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                  Loading cadences...
                </td>
              </tr>
            ) : cadences.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-3 text-center text-gray-500">
                  No cadences found. Create your first cadence to get started.
                </td>
              </tr>
            ) : (
              cadences.map((cadence) => {
                const isSelected = selectedCadences.includes(cadence.id);
                return (
                <tr
                  key={cadence.id}
                  className={`border-b hover:bg-gray-50 transition cursor-pointer ${
                    isSelected ? "bg-blue-50" : ""
                  }`}
                  onClick={() => handleRowClick(cadence.id)}
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(cadence.id)}
                      className="accent-blue-600 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </td>
                  <td className="px-4 py-3 font-medium text-blue-600 hover:underline">
                    {cadence.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {cadence.description || (
                      <span className="italic text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    <span className="text-gray-400">—</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <span className="text-gray-400">—</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400">—</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={(e) => handleView(cadence.id, e)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2"
                        onClick={(e) => handleEdit(cadence.id, e)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </td>
                </tr>
              );
              })
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Create Cadence Modal */}
      <CreateCadenceModal
        open={createCadenceModalOpen}
        onClose={() => setCreateCadenceModalOpen(false)}
        onSuccess={handleCadenceCreated}
      />

      {/* Multi-Action Modal */}
      {selectedPerson && (
        <MultiActionModal
          open={multiActionModalOpen}
          onOpenChange={(open) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1122',message:'MultiActionModal onOpenChange called',data:{open,hasSelectedPerson:!!selectedPerson,selectedPersonId:selectedPerson?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
            // #endregion
            if (!open) {
              setMultiActionModalOpen(false);
              setSelectedPerson(null);
            }
          }}
          person={selectedPerson}
          cadenceId={selectedPerson.cadenceId}
          onCompleteStep={handleCompleteStep}
          onSkipStep={async (contactCadenceId, cadenceStepId) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1129',message:'onSkipStep called from MultiActionModal',data:{contactCadenceId,cadenceStepId,toDoItemsCount:toDoItems.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            const person = toDoItems.find(p => p.id === contactCadenceId);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1132',message:'Person lookup result',data:{foundPerson:!!person,personId:person?.id,personCadenceId:person?.cadenceId,hasCadenceStructure:!!person?.cadenceStructure},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            if (person) {
              await handleSkip(person, null, cadenceStepId);
            } else {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1136',message:'Person not found in toDoItems',data:{contactCadenceId,toDoItemIds:toDoItems.map(p => p.id)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
            }
          }}
          onPostponeStep={async (contactCadenceId, cadenceStepId, date) => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1135',message:'onPostponeStep called from MultiActionModal',data:{contactCadenceId,cadenceStepId,date},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            const person = toDoItems.find(p => p.id === contactCadenceId);
            if (person) {
              await handlePostpone(person, date, cadenceStepId);
            }
          }}
          onViewHistory={(contactCadenceId) => {
            const person = toDoItems.find(p => p.id === contactCadenceId);
            if (person) {
              handleHistoricalActions(person, null);
            }
          }}
          onExecuteStep={handleExecuteStepFromMultiAction}
          cadenceStructure={selectedPerson.cadenceStructure}
        />
      )}

      {/* Timeline Modal */}
      {timelineContact && (
        <CadenceActivityTimelineModal
          open={timelineModalOpen}
          onClose={() => {
            setTimelineModalOpen(false);
            setTimelineContact(null);
          }}
          contact={timelineContact}
        />
      )}

      {/* Email Modal */}
      <EmailModal
        open={emailModalOpen}
        contact={emailModalContact}
        onClose={() => {
          setEmailModalOpen(false);
          setEmailModalContact(null);
          setEmailModalStepData(null);
        }}
        onSend={({ contactId, lastTouched }) => {
          // Handle email sent - refresh to do items
          loadToDoItems();
        }}
        initialSubject={emailModalStepData?.initialSubject || ""}
        initialBody={emailModalStepData?.initialBody || ""}
        cadenceId={emailModalContact ? toDoItems.find(p => p.contactId === emailModalContact.id)?.cadenceId : null}
        onCompleteStep={
          emailModalStepData?.cadenceStepId && emailModalStepData?.contactCadenceId
            ? () => handleCompleteStep(
                emailModalStepData.contactCadenceId,
                emailModalStepData.cadenceStepId
              )
            : null
        }
      />

      {/* Call Modal */}
      {callModalContact && (
        <CadenceCallModal
          isOpen={callModalOpen}
          onClose={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1235',message:'Call modal onClose called',data:{hasStepData:!!callModalStepData},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            setCallModalOpen(false);
            setCallModalContact(null);
            setCallModalStepData(null);
          }}
          contact={callModalContact}
          instructions={callModalStepData?.instructions || ""}
          cadenceId={callModalContact ? toDoItems.find(p => p.contactId === callModalContact.id)?.cadenceId : null}
          onSuccess={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1243',message:'Call modal onSuccess called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
            // #endregion
            loadToDoItems();
          }}
          onCompleteStep={
            callModalStepData?.cadenceStepId && callModalStepData?.contactCadenceId
              ? () => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1248',message:'Call modal onCompleteStep called',data:{contactCadenceId:callModalStepData.contactCadenceId,cadenceStepId:callModalStepData.cadenceStepId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'E'})}).catch(()=>{});
                  // #endregion
                  return handleCompleteStep(
                    callModalStepData.contactCadenceId,
                    callModalStepData.cadenceStepId
                  );
                }
              : null
          }
        />
      )}

      {/* LinkedIn Modal */}
      {linkedInModalContact && (
        <CadenceLinkedInModal
          isOpen={linkedInModalOpen}
          onClose={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1260',message:'LinkedIn modal onClose called',data:{hasStepData:!!linkedInModalStepData},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
            // #endregion
            setLinkedInModalOpen(false);
            setLinkedInModalContact(null);
            setLinkedInModalStepData(null);
          }}
          contact={linkedInModalContact}
          instructions={linkedInModalStepData?.instructions || ""}
          cadenceId={linkedInModalContact ? toDoItems.find(p => p.contactId === linkedInModalContact.id)?.cadenceId : null}
          onSuccess={() => {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1268',message:'LinkedIn modal onSuccess called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
            // #endregion
            loadToDoItems();
          }}
          onCompleteStep={
            linkedInModalStepData?.cadenceStepId && linkedInModalStepData?.contactCadenceId
              ? () => {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/57901036-88fd-428d-8626-d7a2f9d2930c',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'CadencesPage.jsx:1273',message:'LinkedIn modal onCompleteStep called',data:{contactCadenceId:linkedInModalStepData.contactCadenceId,cadenceStepId:linkedInModalStepData.cadenceStepId},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'F'})}).catch(()=>{});
                  // #endregion
                  return handleCompleteStep(
                    linkedInModalStepData.contactCadenceId,
                    linkedInModalStepData.cadenceStepId
                  );
                }
              : null
          }
        />
      )}
    </div>
  );
}

