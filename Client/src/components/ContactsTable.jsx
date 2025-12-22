import React, { useEffect, useState, useMemo, useRef, useLayoutEffect, useCallback } from "react"
import { fetchContacts } from "../api"
import CallModal from "./modals/CallModal"
import LinkedInModal from "./modals/LinkedInModal"
import TouchHistoryModal from "./modals/TouchHistoryModal"
import EmailModal from "./modals/EmailModal"
import { FilterModal } from "./filters/FilterModal"
import { TagFilterModal } from "./filters/TagFilterModal"
import { LastTouchFilterModal } from "./filters/LastTouchFilterModal"
import TagModal from "./modals/TagModal"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
} from "@/components/ui/popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  MailIcon,
  PhoneIcon,
  LinkedinIcon,
  ClockIcon,
  MoreVertical,
  UserIcon,
  BriefcaseIcon,
  BuildingIcon,
  TagIcon,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Check,
  Trash2,
  Download,
  X,
} from "lucide-react"
import ContactSidebar from "./ContactSidebar"
import AddContactMenu from "./AddContactMenu"

// 🔹 TagsCell component that adapts to available space
function TagsCell({ tags }) {
  const containerRef = useRef(null)
  const [visibleCount, setVisibleCount] = useState(tags?.length || 0)
  const [resizeKey, setResizeKey] = useState(0)

  const calculateVisibleCount = useCallback(() => {
    if (!tags || tags.length === 0) {
      return 0
    }

    const container = containerRef.current
    if (!container) {
      return tags.length
    }

    const containerWidth = container.offsetWidth
    if (containerWidth === 0) {
      return tags.length
    }

    const gap = 4 // gap-1 = 4px
    const plusNBaseWidth = 20 // Base width for "+"
    const digitWidth = 6 // Approximate width per digit
    const tagMaxWidth = 80
    const tagPadding = 12 // px-1.5 = 6px * 2
    
    // Estimate widths for tags and calculate how many fit
    let totalWidth = 0
    let count = 0
    
    for (let i = 0; i < tags.length; i++) {
      const tagName = tags[i].tag_name || ''
      // Estimate tag width: min of actual text width (approx) or maxWidth
      // Rough estimate: ~6px per character for text-xs
      const estimatedTextWidth = Math.min(tagName.length * 6, tagMaxWidth - tagPadding)
      const tagWidth = estimatedTextWidth + tagPadding
      const neededWidth = totalWidth + tagWidth + (i > 0 ? gap : 0)
      
      // Check if we need space for +N indicator
      const hasMore = i < tags.length - 1
      const remainingCount = tags.length - (i + 1)
      const plusNWidth = plusNBaseWidth + (remainingCount.toString().length * digitWidth)
      const finalWidth = hasMore ? neededWidth + gap + plusNWidth : neededWidth
      
      if (finalWidth <= containerWidth) {
        totalWidth = neededWidth
        count = i + 1
      } else {
        break
      }
    }
    
    // Always show at least 1 tag if there are tags, even if it overflows slightly
    return Math.max(1, Math.min(count || 1, tags.length))
  }, [tags])

  useLayoutEffect(() => {
    const count = calculateVisibleCount()
    setVisibleCount(count)
  }, [tags, resizeKey, calculateVisibleCount])

  // Re-measure on container resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      setResizeKey(prev => prev + 1)
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  if (!tags || tags.length === 0) return null

  const visibleTags = tags.slice(0, visibleCount)
  const remainingCount = tags.length - visibleCount

  return (
    <div ref={containerRef} className="flex items-center gap-1 flex-nowrap overflow-hidden w-full min-w-0">
      {visibleTags.map((tag, i) => (
        <span
          key={i}
          className="rounded-full bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-800 truncate flex-shrink min-w-0"
          style={{ maxWidth: '80px' }}
        >
          {tag.tag_name}
        </span>
      ))}
      {remainingCount > 0 && (
        <span className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
          +{remainingCount}
        </span>
      )}
    </div>
  )
}

// 🔹 Manage Tags Popover component
function ManageTagsPopover({ contact, allAvailableTags, onAddTag, onRemoveTag }) {
  const [searchTerm, setSearchTerm] = useState("")
  const contactTagNames = new Set((contact.tags || []).map((t) => t.tag_name))

  // Filter available tags based on search term
  const filteredTags = allAvailableTags.filter((tag) =>
    tag.tag_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Check if search term matches an existing tag
  const searchMatchesExisting = filteredTags.some(
    (tag) => tag.tag_name.toLowerCase() === searchTerm.toLowerCase()
  )

  // Check if we should show "Create" option
  const shouldShowCreate =
    searchTerm.trim() &&
    !searchMatchesExisting &&
    !contactTagNames.has(searchTerm.trim())

  const handleAddExistingTag = (tagName) => {
    onAddTag(tagName)
    setSearchTerm("")
  }

  const handleCreateAndAddTag = () => {
    const trimmed = searchTerm.trim()
    if (trimmed) {
      onAddTag(trimmed)
      setSearchTerm("")
    }
  }

  return (
    <div className="flex flex-col">
      {/* Section 1: Add / Search / Create */}
      <div className="p-3 border-b">
        <Input
          placeholder="Add or search tags"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-2"
          autoFocus
        />
        {searchTerm && (
          <div className="max-h-40 overflow-y-auto">
            {filteredTags.length > 0 && (
              <div className="space-y-1">
                {filteredTags
                  .filter((tag) => !contactTagNames.has(tag.tag_name))
                  .map((tag) => (
                    <button
                      key={tag.tag_id}
                      onClick={() => handleAddExistingTag(tag.tag_name)}
                      className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors"
                    >
                      {tag.tag_name}
                    </button>
                  ))}
              </div>
            )}
            {shouldShowCreate && (
              <button
                onClick={handleCreateAndAddTag}
                className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-gray-100 transition-colors text-blue-600 font-medium"
              >
                Create "{searchTerm.trim()}"
              </button>
            )}
            {!shouldShowCreate && filteredTags.length === 0 && searchTerm && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                No matching tags
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 2: Assigned Tags */}
      <div className="p-3">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Assigned Tags
        </div>
        {contact.tags && contact.tags.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            {contact.tags.map((tag, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
              >
                <span>{tag.tag_name}</span>
                <button
                  onClick={() => onRemoveTag(tag.tag_name)}
                  className="ml-2 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                  aria-label={`Remove ${tag.tag_name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">No tags assigned</span>
        )}
      </div>
    </div>
  )
}

// 🔹 Dropdown for per-row actions (Email removed - now an icon button)
export function ActionDropdown({ onCall, onLinkedIn, onLogTouch }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onCall}>
          <PhoneIcon className="mr-2 h-4 w-4" /> Call
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLinkedIn}>
          <LinkedinIcon className="mr-2 h-4 w-4" /> LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onLogTouch}>
          <ClockIcon className="mr-2 h-4 w-4" /> Log Touch
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function ContactsTable() {
  const [contacts, setContacts] = useState([])
  const [selectedContacts, setSelectedContacts] = useState([])
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showTagModal, setShowTagModal] = useState(false)
  const [groupBy, setGroupBy] = useState("none")
  const [expandedGroups, setExpandedGroups] = useState({})
  const [selectedContact, setSelectedContact] = useState(null)

  const [activeDialog, setActiveDialog] = useState(null)
  const [dialogContact, setDialogContact] = useState(null)
  const [touchHistory, setTouchHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [showOutlookError, setShowOutlookError] = useState(false)
  const [showRefreshModal, setShowRefreshModal] = useState(false)
  const [timerId, setTimerId] = useState(null)
  
  // 🔹 Tag management state
  const [manageTagsContactId, setManageTagsContactId] = useState(null)

  // ⭐ NEW — Email preset for replies
  const [emailPreset, setEmailPreset] = useState(null) 
  // { initialSubject, replyThreadId, parentTouchId }

  // 🔹 Filters
  const [openFilterKey, setOpenFilterKey] = useState(null)
  const [filters, setFilters] = useState({
    name: [], // Can be array or { type: "advanced", rules: [...] }
    company: [], // Can be array or { type: "advanced", rules: [...] }
    title: [], // Can be array or { type: "advanced", rules: [...] }
    tag: [],
    lastTouch: null,
  })
  const [searchTerm, setSearchTerm] = useState("")
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [tagFilterMode, setTagFilterMode] = useState("is")
  const [showLastTouchFilter, setShowLastTouchFilter] = useState(false)

  // 🔹 Sorting
  const [sortColumn, setSortColumn] = useState(null) // 'company', 'name', 'title', 'lastTouch'
  const [sortDirection, setSortDirection] = useState("asc") // 'asc' or 'desc'
  
  // 🔹 Header checkbox ref for indeterminate state
  const headerCheckboxRef = useRef(null)

  // 🔹 Outlook readiness listener
  useEffect(() => {
    const handleReadinessMessage = (event) => {
      if (event.data?.type === "outlook-readiness-result") {
        clearTimeout(timerId)
        setTimerId(null)
        setShowRefreshModal(false)
        if (!event.data.success) setShowOutlookError(true)
      }
    }
    window.addEventListener("message", handleReadinessMessage)
    return () => window.removeEventListener("message", handleReadinessMessage)
  }, [timerId])

  const handleRefreshEmailWindow = () => {
    window.postMessage(
      { type: "__FROM_PAGE_TO_EXTENSION__", payload: { type: "reachvue:refresh-outlook-tab" } },
      "*"
    )
    setShowRefreshModal(true)
    const id = setTimeout(() => {
      console.warn("⏰ Outlook refresh timed out (30s)")
      setShowRefreshModal(false)
      setShowOutlookError(true)
    }, 30000)
    setTimerId(id)
  }

  // ⭐ UPDATED — Now supports optional reply metadata
  const openDialog = async (type, contact, preset = null) => {
    setDialogContact(contact)

    // ⭐ Store reply params if provided
    if (preset) setEmailPreset(preset)
    else setEmailPreset(null)

    if (type === "history") {
      setLoadingHistory(true)
      try {
        const res = await fetch(
          `http://localhost:3000/touches?contact_id=${contact.id}&_sort=touched_at:DESC`
        )
        const data = res.ok ? await res.json() : []
        setTouchHistory(data)
      } catch {
        setTouchHistory([])
      } finally {
        setActiveDialog("history")
        setLoadingHistory(false)
      }
      return
    }

    setActiveDialog(type)
  }

  const closeDialog = () => {
    setActiveDialog(null)
    setDialogContact(null)
    setTouchHistory([])
    setEmailPreset(null) // ⭐ Reset reply preset
    setLoadingHistory(false)
  }

  useEffect(() => {
    document.body.style.pointerEvents = "auto"
    document.documentElement.style.pointerEvents = "auto"
  }, [activeDialog])

  useEffect(() => {
    async function loadContacts() {
      const data = await fetchContacts()
      setContacts(data)
    }
    loadContacts()
  }, [])

  const toggleSelect = (id) =>
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )

  // 🔹 Get all available tags from contacts (frontend-only)
  const allAvailableTags = useMemo(() => {
    const tagSet = new Set()
    contacts.forEach((contact) => {
      contact.tags?.forEach((tag) => {
        tagSet.add(tag.tag_name)
      })
    })
    return Array.from(tagSet).sort().map((tagName, index) => ({
      tag_id: `temp-${index}`,
      tag_name: tagName,
    }))
  }, [contacts])

  // 🔹 Handle adding a tag to a contact (frontend-only)
  const handleAddTagToContact = (contactId, tagName) => {
    setContacts((prev) =>
      prev.map((contact) => {
        if (contact.id === contactId) {
          const existingTags = contact.tags || []
          // Check if tag already exists
          if (existingTags.some((t) => t.tag_name === tagName)) {
            return contact
          }
          // Add new tag
          return {
            ...contact,
            tags: [
              ...existingTags,
              {
                tag_id: `temp-${Date.now()}-${Math.random()}`,
                tag_name: tagName,
              },
            ],
          }
        }
        return contact
      })
    )
  }

  // 🔹 Handle removing a tag from a contact (frontend-only)
  const handleRemoveTagFromContact = (contactId, tagName) => {
    setContacts((prev) =>
      prev.map((contact) => {
        if (contact.id === contactId) {
          return {
            ...contact,
            tags: (contact.tags || []).filter((t) => t.tag_name !== tagName),
          }
        }
        return contact
      })
    )
  }

  const clearFilters = () => {
    setFilters({ name: [], company: [], title: [], tag: [], lastTouch: null })
    setSearchTerm("")
    setTagFilterMode("is")
  }
  
  // Helper to check if a filter has any active rules
  function hasActiveFilter(filter) {
    if (!filter) return false
    if (isAdvancedFilter(filter)) {
      return filter.rules && filter.rules.length > 0 && filter.rules.some(r => r.value && r.value.trim() !== "")
    }
    return Array.isArray(filter) && filter.length > 0
  }

  const toggleGroupExpand = (group) =>
    setExpandedGroups((prev) => ({ ...prev, [group]: !prev[group] }))

  // Update last touch
  const updateLastTouch = (contactId, newDate = new Date().toISOString()) => {
    if (!contactId) return
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId ? { ...c, last_touched_at: newDate } : c
      )
    )
  }

  // Helper functions need to be defined before useMemo hooks that use them
  function applyTagFilter(contact, selectedTags, mode) {
    const tags = contact.tags?.map((t) => t.tag_name) || []
    switch (mode) {
      case "is":
        return selectedTags.length === 0 || tags.some((t) => selectedTags.includes(t))
      case "isNot":
        return selectedTags.length === 0 || !tags.some((t) => selectedTags.includes(t))
      case "empty":
        return tags.length === 0
      case "notEmpty":
        return tags.length > 0
      default:
        return true
    }
  }

  function parseISODateOnly(str) {
    const [y, m, d] = str.split("-").map(Number)
    if (!y || !m || !d) return null
    const dt = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
    return isNaN(dt.getTime()) ? null : dt
  }

  function daysAgo(n) {
    const now = new Date()
    const d = new Date(now)
    d.setDate(now.getDate() - n)
    return d
  }

  function startOfDay(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  function endOfDay(date) {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }

  function formatLastTouchDate(dateString) {
    if (!dateString) return "—"
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return "—"
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = months[date.getMonth()]
    const day = date.getDate()
    const year = date.getFullYear()
    return `${month} ${day}, ${year}`
  }

  function isLastTouchActive(cfg) {
    if (!cfg) return false
    if (Array.isArray(cfg)) return cfg.length > 0
    return !!cfg.type && cfg.type !== "none"
  }

  // 🔹 Advanced Filter Evaluation
  // Evaluates a single rule against a field value
  function evaluateRule(fieldValue, operator, ruleValue) {
    const fieldStr = String(fieldValue || "").toLowerCase()
    const ruleStr = String(ruleValue || "").toLowerCase()
    
    // Check if ruleValue contains wildcards
    const hasWildcards = ruleValue && (ruleValue.includes("*") || ruleValue.includes("?"))
    
    // Support wildcards: * for any chars, ? for one char
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const wildcardToRegex = (pattern) => {
      const escaped = escapeRegex(pattern)
      return new RegExp('^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i')
    }
    
    // Helper to check if value matches (with wildcard support)
    const matches = (value, pattern) => {
      if (hasWildcards) {
        return wildcardToRegex(pattern).test(value)
      }
      return value.toLowerCase().includes(pattern.toLowerCase())
    }
    
    const equals = (value, pattern) => {
      if (hasWildcards) {
        return wildcardToRegex(pattern).test(value)
      }
      return value.toLowerCase() === pattern.toLowerCase()
    }
    
    const startsWith = (value, pattern) => {
      if (hasWildcards) {
        return wildcardToRegex(pattern).test(value)
      }
      return value.toLowerCase().startsWith(pattern.toLowerCase())
    }
    
    const endsWith = (value, pattern) => {
      if (hasWildcards) {
        return wildcardToRegex(pattern).test(value)
      }
      return value.toLowerCase().endsWith(pattern.toLowerCase())
    }

    switch (operator) {
      case "contains":
        return matches(fieldValue, ruleValue)
      case "does not contain":
        return !matches(fieldValue, ruleValue)
      case "equals":
        return equals(fieldValue, ruleValue)
      case "does not equal":
        return !equals(fieldValue, ruleValue)
      case "begins with":
        return startsWith(fieldValue, ruleValue)
      case "does not begin with":
        return !startsWith(fieldValue, ruleValue)
      case "ends with":
        return endsWith(fieldValue, ruleValue)
      case "does not end with":
        return !endsWith(fieldValue, ruleValue)
      default:
        return true
    }
  }

  // Evaluates multiple rules with AND/OR logic
  function evaluateAdvancedFilter(fieldValue, rules) {
    if (!rules || rules.length === 0) return true
    
    // First rule always applies
    let result = evaluateRule(fieldValue, rules[0].operator, rules[0].value)
    
    // Process remaining rules with their connectors
    for (let i = 1; i < rules.length; i++) {
      const rule = rules[i]
      const ruleResult = evaluateRule(fieldValue, rule.operator, rule.value)
      
      if (rule.connector === "AND") {
        result = result && ruleResult
      } else if (rule.connector === "OR") {
        result = result || ruleResult
      }
    }
    
    return result
  }

  // Checks if a filter is an advanced filter
  function isAdvancedFilter(filter) {
    return filter && typeof filter === "object" && filter.type === "advanced"
  }

  // Applies a filter (either simple array or advanced) to a contact field
  function applyFieldFilter(contact, fieldKey, filter, excludeFilterKey) {
    // Skip if this is the filter being computed for cascading
    if (excludeFilterKey === fieldKey) return true
    
    // No filter applied
    if (!filter || (Array.isArray(filter) && filter.length === 0)) return true
    
    // Advanced filter
    if (isAdvancedFilter(filter)) {
      let fieldValue
      if (fieldKey === "name") {
        fieldValue = `${contact.first_name} ${contact.last_name}`.trim()
      } else {
        fieldValue = contact[fieldKey] || ""
      }
      return evaluateAdvancedFilter(fieldValue, filter.rules)
    }
    
    // Simple array filter
    if (Array.isArray(filter)) {
      if (fieldKey === "name") {
        const fullName = `${contact.first_name} ${contact.last_name}`.trim()
        return filter.length === 0 || filter.includes(fullName)
      } else {
        return filter.length === 0 || filter.includes(contact[fieldKey])
      }
    }
    
    return true
  }

  function matchLastTouch(contact, cfg) {
    if (Array.isArray(cfg)) {
      const formatted = formatLastTouchDate(contact.last_touched_at)
      return cfg.length === 0 || cfg.includes(formatted)
    }

    if (!cfg || !cfg.type) return true

    const iso = contact.last_touched_at
    if (!iso) {
      if (cfg.type === "empty") return true
      if (cfg.type === "notEmpty") return false
      return false
    }

    const touched = new Date(iso)
    const hasValue = touched && !isNaN(touched.getTime())

    switch (cfg.type) {
      case "empty":
        return !hasValue
      case "notEmpty":
        return hasValue
      case "within": {
        // Is within last X days/months
        if (!hasValue) return false
        const range = cfg.range || "30d"
        let days = 30
        if (range === "7d") days = 7
        else if (range === "30d") days = 30
        else if (range === "90d") days = 90
        else if (range === "6mo") days = 180 // Approximate 6 months
        const cutoff = daysAgo(days)
        return touched >= startOfDay(cutoff)
      }
      case "today":
        if (!hasValue) return false
        const today = new Date()
        return (
          touched >= startOfDay(today) && touched <= endOfDay(today)
        )
      case "yesterday":
        if (!hasValue) return false
        const yesterday = daysAgo(1)
        return (
          touched >= startOfDay(yesterday) && touched <= endOfDay(yesterday)
        )
      case "thisWeek":
        if (!hasValue) return false
        const weekStart = daysAgo(7)
        return touched >= startOfDay(weekStart)
      case "thisMonth":
        if (!hasValue) return false
        const monthStart = daysAgo(30)
        return touched >= startOfDay(monthStart)
      case "olderThan":
        if (!hasValue) return false
        const rel = (cfg.relative || "").toLowerCase()
        const n = parseInt(rel, 10)
        if (!n || !rel.endsWith("d")) return true
        const cutoff = daysAgo(n)
        return touched >= startOfDay(cutoff)
      case "before": {
        if (!hasValue) return false
        const dt = parseISODateOnly(cfg.start || cfg.date || "")
        if (!dt) return true
        return touched < startOfDay(dt)
      }
      case "after": {
        if (!hasValue) return false
        const dt = parseISODateOnly(cfg.start || cfg.date || "")
        if (!dt) return true
        return touched > endOfDay(dt)
      }
      case "between": {
        if (!hasValue) return false
        const start = parseISODateOnly(cfg.start || "")
        const end = parseISODateOnly(cfg.end || "")
        if (!start && !end) return true
        if (start && end)
          return touched >= startOfDay(start) && touched <= endOfDay(end)
        if (start && !end) return touched >= startOfDay(start)
        if (!start && end) return touched <= endOfDay(end)
        return true
      }
      default:
        return true
    }
  }

  // 🔹 Cascading Filters: Get contacts matching all filters EXCEPT the specified one
  // This allows each filter to show only values that exist for already-selected filters
  const getContactsForFilter = (excludeFilterKey) => {
    const lowerSearch = searchTerm.toLowerCase()
    return contacts.filter((c) => {
      const fullName = `${c.first_name} ${c.last_name}`.trim()
      
      // Always apply search
      const matchesSearch =
        !lowerSearch ||
        fullName.toLowerCase().includes(lowerSearch) ||
        (c.company || "").toLowerCase().includes(lowerSearch) ||
        (c.title || "").toLowerCase().includes(lowerSearch)

      // Apply all filters EXCEPT the one being computed
      const matchesName = applyFieldFilter(c, "name", filters.name, excludeFilterKey)
      const matchesCompany = applyFieldFilter(c, "company", filters.company, excludeFilterKey)
      const matchesTitle = applyFieldFilter(c, "title", filters.title, excludeFilterKey)
      
      const matchesTag =
        excludeFilterKey === "tag" || 
        applyTagFilter(c, filters.tag, tagFilterMode)
      
      const matchesLastTouchCfg =
        excludeFilterKey === "lastTouch" || 
        matchLastTouch(c, filters.lastTouch)

      return (
        matchesSearch &&
        matchesName &&
        matchesCompany &&
        matchesTitle &&
        matchesTag &&
        matchesLastTouchCfg
      )
    })
  }

  // Unique values computed from cascading filtered contacts
  // Each filter shows only values that exist for contacts matching OTHER filters
  const uniqueCompanies = useMemo(() => {
    const filteredContacts = getContactsForFilter("company")
    return [...new Set(filteredContacts.map((c) => c.company).filter(Boolean))].sort()
  }, [contacts, filters, searchTerm, tagFilterMode])

  const uniqueTitles = useMemo(() => {
    const filteredContacts = getContactsForFilter("title")
    return [...new Set(filteredContacts.map((c) => c.title).filter(Boolean))].sort()
  }, [contacts, filters, searchTerm, tagFilterMode])

  const uniqueTags = useMemo(() => {
    const filteredContacts = getContactsForFilter("tag")
    return [
      ...new Set(filteredContacts.flatMap((c) => c.tags?.map((t) => t.tag_name) || [])),
    ].sort()
  }, [contacts, filters, searchTerm, tagFilterMode])

  const uniqueNames = useMemo(() => {
    const filteredContacts = getContactsForFilter("name")
    return [
      ...new Set(filteredContacts.map((c) => `${c.first_name} ${c.last_name}`.trim())),
    ].sort()
  }, [contacts, filters, searchTerm, tagFilterMode])

  const uniqueLastTouches = useMemo(() => {
    const filteredContacts = getContactsForFilter("lastTouch")
    return [
      ...new Set(
        filteredContacts.map((c) => formatLastTouchDate(c.last_touched_at))
      ),
    ].sort()
  }, [contacts, filters, searchTerm, tagFilterMode])

  const filteredContacts = useMemo(() => {
    const lowerSearch = searchTerm.toLowerCase()
    let filtered = contacts.filter((c) => {
      const fullName = `${c.first_name} ${c.last_name}`.trim()
      const matchesSearch =
        !lowerSearch ||
        fullName.toLowerCase().includes(lowerSearch) ||
        (c.company || "").toLowerCase().includes(lowerSearch) ||
        (c.title || "").toLowerCase().includes(lowerSearch)

      const matchesName = applyFieldFilter(c, "name", filters.name, null)
      const matchesCompany = applyFieldFilter(c, "company", filters.company, null)
      const matchesTitle = applyFieldFilter(c, "title", filters.title, null)
      const matchesTag = applyTagFilter(c, filters.tag, tagFilterMode)
      const matchesLastTouchCfg = matchLastTouch(c, filters.lastTouch)

      return (
        matchesSearch &&
        matchesName &&
        matchesCompany &&
        matchesTitle &&
        matchesTag &&
        matchesLastTouchCfg
      )
    })

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        let aValue, bValue

        switch (sortColumn) {
          case "company":
            aValue = (a.company || "").toLowerCase()
            bValue = (b.company || "").toLowerCase()
            break
          case "name":
            aValue = `${a.first_name} ${a.last_name}`.trim().toLowerCase()
            bValue = `${b.first_name} ${b.last_name}`.trim().toLowerCase()
            break
          case "title":
            aValue = (a.title || "").toLowerCase()
            bValue = (b.title || "").toLowerCase()
            break
          case "lastTouch":
            aValue = a.last_touched_at ? new Date(a.last_touched_at).getTime() : 0
            bValue = b.last_touched_at ? new Date(b.last_touched_at).getTime() : 0
            break
          default:
            return 0
        }

        if (sortColumn === "lastTouch") {
          // For dates, compare numerically
          if (sortDirection === "asc") {
            return aValue - bValue
          } else {
            return bValue - aValue
          }
        } else {
          // For strings, compare alphabetically
          if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
          if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
          return 0
        }
      })
    }

    return filtered
  }, [contacts, filters, searchTerm, tagFilterMode, sortColumn, sortDirection])

  const groupedData = useMemo(() => {
    if (groupBy === "none") return { All: filteredContacts }

    if (groupBy === "company") {
      return filteredContacts.reduce((acc, c) => {
        if (!acc[c.company]) acc[c.company] = []
        acc[c.company].push(c)
        return acc
      }, {})
    }

    if (groupBy === "tag") {
      return filteredContacts.reduce((acc, c) => {
        c.tags.forEach((t) => {
          if (!acc[t.tag_name]) acc[t.tag_name] = []
          acc[t.tag_name].push(c)
        })
        return acc
      }, {})
    }

    return { All: filteredContacts }
  }, [filteredContacts, groupBy])

  const groupedContacts = groupedData

  // Update header checkbox indeterminate state
  useEffect(() => {
    if (headerCheckboxRef.current) {
      const visibleSelected = filteredContacts.filter((c) =>
        selectedContacts.includes(c.id)
      ).length
      headerCheckboxRef.current.indeterminate =
        visibleSelected > 0 &&
        visibleSelected < filteredContacts.length
    }
  }, [filteredContacts, selectedContacts])

  const filterValuesMap = {
    name: uniqueNames,
    company: uniqueCompanies,
    title: uniqueTitles,
    tag: uniqueTags,
    lastTouch: uniqueLastTouches,
  }

  const handleOpenFilter = (key) => {
    if (key === "tag") setShowTagFilter(true)
    else if (key === "lastTouch") setShowLastTouchFilter(true)
    else setOpenFilterKey(key)
  }

  const handleSort = (column) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      // Set new column and default to ascending
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const SortIndicator = ({ column }) => {
    if (sortColumn !== column) {
      // Show both chevrons when not sorted
      return (
        <span className="inline-flex flex-col ml-1 opacity-40">
          <ChevronUp className="h-3 w-3 -mb-1" />
          <ChevronDown className="h-3 w-3" />
        </span>
      )
    }
    // Show single chevron based on direction
    return (
      <span className="inline-flex ml-1">
        {sortDirection === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )}
      </span>
    )
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">Contacts</h2>
          <span className="text-sm text-gray-500 font-medium">
            Showing {filteredContacts.length.toLocaleString()} of {contacts.length.toLocaleString()} total contacts
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <AddContactMenu />
        </div>
      </div>

      {/* Filters */}
      <div className="border bg-gray-50 rounded-lg p-3 mt-2 mb-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Input
              placeholder="Search here"
              className="w-48"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                <DropdownMenuItem onClick={() => setGroupBy("company")}>
                  Company
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setGroupBy("tag")}>
                  Tags
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-end">
            {[
              {
                key: "name",
                icon: <UserIcon className="h-3 w-3" />,
                label: "Name",
                active: isAdvancedFilter(filters.name) || (Array.isArray(filters.name) && filters.name.length > 0),
              },
              {
                key: "company",
                icon: <BuildingIcon className="h-3 w-3" />,
                label: "Company",
                active: isAdvancedFilter(filters.company) || (Array.isArray(filters.company) && filters.company.length > 0),
              },
              {
                key: "title",
                icon: <BriefcaseIcon className="h-3 w-3" />,
                label: "Title",
                active: isAdvancedFilter(filters.title) || (Array.isArray(filters.title) && filters.title.length > 0),
              },
              {
                key: "tag",
                icon: <TagIcon className="h-3 w-3" />,
                label: "Tag",
                active: filters.tag.length || tagFilterMode !== "is",
              },
              {
                key: "lastTouch",
                icon: <ClockIcon className="h-3 w-3" />,
                label: "Last Touch",
                active: isLastTouchActive(filters.lastTouch),
              },
            ].map((f) => (
              <Button
                key={f.key}
                variant={f.active ? "default" : "outline"}
                className="flex items-center gap-1.5"
                onClick={() => handleOpenFilter(f.key)}
              >
                {f.icon}
                {f.label}
                <ChevronDown className="h-4 w-4" />
              </Button>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={clearFilters}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Selected Items Action Bar */}
      {selectedContacts.length > 0 && (
        <div className="border bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-medium">{selectedContacts.length} Selected</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTagModal(true)}
              className="flex items-center gap-2"
            >
              <TagIcon className="h-4 w-4" />
              Assign Tags
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => {
                // Placeholder for Export CSV
                console.log("Export CSV - to be implemented")
              }}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                // Placeholder for Delete
                console.log("Delete - to be implemented")
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="flex">
        <div
          className={`relative h-[66vh] overflow-x-hidden overflow-y-auto pb-5 ${
            selectedContact ? "w-2/3" : "w-full"
          }`}
        >
          <table className="table-auto text-sm w-full border-collapse max-w-full">
            <thead className="bg-muted sticky top-0 z-20">
              <tr className="text-left text-xs">
                <th className="p-2 font-medium">
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      ref={headerCheckboxRef}
                      className="w-5 h-5 cursor-pointer"
                      checked={
                        filteredContacts.length > 0 &&
                        filteredContacts.every((c) => selectedContacts.includes(c.id))
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          // Select all visible rows
                          const visibleIds = filteredContacts.map((c) => c.id)
                          setSelectedContacts((prev) => [
                            ...new Set([...prev, ...visibleIds]),
                          ])
                        } else {
                          // Deselect all visible rows
                          const visibleIds = filteredContacts.map((c) => c.id)
                          setSelectedContacts((prev) =>
                            prev.filter((id) => !visibleIds.includes(id))
                          )
                        }
                      }}
                    />
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-0.5 hover:bg-gray-200 rounded transition-colors">
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem
                          onClick={() => {
                            // Select all visible rows
                            const visibleIds = filteredContacts.map((c) => c.id)
                            setSelectedContacts((prev) => [
                              ...new Set([...prev, ...visibleIds]),
                            ])
                          }}
                        >
                          Select all visible ({filteredContacts.length})
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // Select all rows in dataset
                            const allIds = contacts.map((c) => c.id)
                            setSelectedContacts(allIds)
                          }}
                        >
                          Select all in dataset ({contacts.length})
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            // Deselect all
                            setSelectedContacts([])
                          }}
                        >
                          Deselect all
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </th>
                <th 
                  className="p-2 font-medium cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => handleSort("company")}
                >
                  <span className="flex items-center">
                    Company
                    <SortIndicator column="company" />
                  </span>
                </th>
                <th 
                  className="p-2 font-medium cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => handleSort("name")}
                >
                  <span className="flex items-center">
                    Full Name
                    <SortIndicator column="name" />
                  </span>
                </th>
                <th 
                  className="p-2 font-medium cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => handleSort("title")}
                >
                  <span className="flex items-center">
                    Title
                    <SortIndicator column="title" />
                  </span>
                </th>
                <th 
                  className="p-2 font-medium cursor-pointer hover:bg-gray-200 transition-colors select-none"
                  onClick={() => handleSort("lastTouch")}
                >
                  <span className="flex items-center">
                    Last Touch
                    <SortIndicator column="lastTouch" />
                  </span>
                </th>
                {!selectedContact && (
                  <>
                    <th className="p-2 font-medium max-w-[140px]">Tags</th>
                    <th className="p-2 font-medium">Email / Phone</th>
                    <th className="p-2 font-medium">Action</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedContacts).map(([group, rows]) => (
                <React.Fragment key={group}>
                  {groupBy !== "none" && (
                    <tr
                      className="bg-gray-100 font-semibold cursor-pointer"
                      onClick={() => toggleGroupExpand(group)}
                    >
                      <td className="p-2">
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
                      <td colSpan={selectedContact ? 3 : 6}></td>
                    </tr>
                  )}

                  {(groupBy === "none" || expandedGroups[group]) &&
                    rows.map((contact) => (
                      <tr key={contact.id} className="border-t hover:bg-blue-50 transition-colors">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => toggleSelect(contact.id)}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </td>
                        <td className="p-2 truncate max-w-[140px]">
                          {contact.company}
                        </td>
                        <td
                          className="p-2 font-semibold text-blue-600 truncate max-w-[140px] cursor-pointer"
                          onClick={() => setSelectedContact(contact)}
                        >
                          {contact.first_name} {contact.last_name}
                        </td>
                        <td className="p-2 truncate max-w-[160px]">
                          {contact.title}
                        </td>
                        <td className="p-2 whitespace-nowrap text-xs">
                          {formatLastTouchDate(contact.last_touched_at)}
                        </td>

                        {!selectedContact && (
                          <>
                            <td className="p-2 max-w-[140px]">
                              <div className="relative">
                                {/* Read-only peek popover */}
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="cursor-pointer hover:bg-gray-100 rounded px-1 py-0.5 transition-colors min-h-[20px] flex items-center">
                                      {contact.tags && contact.tags.length > 0 ? (
                                        <TagsCell tags={contact.tags} />
                                      ) : (
                                        <span className="text-xs text-muted-foreground">—</span>
                                      )}
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-3" align="start">
                                    {contact.tags && contact.tags.length > 0 ? (
                                      <>
                                        <div className="flex flex-col gap-1.5 mb-3">
                                          {contact.tags.map((tag, i) => (
                                            <span
                                              key={i}
                                              className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800"
                                            >
                                              {tag.tag_name}
                                            </span>
                                          ))}
                                        </div>
                                        <button
                                          className="text-blue-600 hover:text-blue-700 hover:underline text-sm text-left border-0 bg-transparent p-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setManageTagsContactId(contact.id)
                                          }}
                                        >
                                          Edit tags
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <div className="text-sm text-muted-foreground mb-3">
                                          No tags yet
                                        </div>
                                        <button
                                          className="text-blue-600 hover:text-blue-700 hover:underline text-sm text-left border-0 bg-transparent p-0"
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setManageTagsContactId(contact.id)
                                          }}
                                        >
                                          Edit tags
                                        </button>
                                      </>
                                    )}
                                  </PopoverContent>
                                </Popover>
                                
                                {/* Manage tags popover */}
                                <Popover
                                  open={manageTagsContactId === contact.id}
                                  onOpenChange={(open) =>
                                    setManageTagsContactId(open ? contact.id : null)
                                  }
                                >
                                  <PopoverAnchor asChild>
                                    <div className="absolute inset-0 pointer-events-none" />
                                  </PopoverAnchor>
                                  <PopoverContent className="w-64 p-0" align="start">
                                    <ManageTagsPopover
                                      contact={contact}
                                      allAvailableTags={allAvailableTags}
                                      onAddTag={(tagName) => {
                                        handleAddTagToContact(contact.id, tagName)
                                      }}
                                      onRemoveTag={(tagName) => {
                                        handleRemoveTagFromContact(contact.id, tagName)
                                      }}
                                    />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </td>

                            <td className="p-2">
                              <div className="flex flex-col max-w-[180px] overflow-hidden">
                                <span className="truncate">
                                  {contact.email}
                                </span>
                                {contact.mobile_phone && (
                                  <span className="text-xs text-gray-500 truncate">
                                    {contact.mobile_phone}
                                  </span>
                                )}
                              </div>
                            </td>

                            <td className="p-2 flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openDialog("history", contact)}
                                title="View History"
                              >
                                <ClockIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => openDialog("email", contact)}
                                title="Send Email"
                              >
                                <MailIcon className="h-4 w-4" />
                              </Button>
                              <ActionDropdown
                                onCall={() => openDialog("call", contact)}
                                onLinkedIn={() => openDialog("linkedin", contact)}
                                onLogTouch={() => openDialog("touch", contact)}
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {selectedContact && (
          <ContactSidebar
            contact={selectedContact}
            onClose={() => setSelectedContact(null)}
          />
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this contact?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(false)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ⭐ UPDATED EMAIL MODAL WITH REPLY METADATA */}
      <EmailModal
        open={activeDialog === "email"}
        contact={dialogContact}
        onClose={closeDialog}
        onSend={({ contactId, lastTouched }) =>
          updateLastTouch(contactId, lastTouched)
        }
        initialSubject={emailPreset?.initialSubject || ""}
        initialBody={emailPreset?.initialBody || ""}
      />


      <CallModal
        isOpen={activeDialog === "call"}
        contact={dialogContact}
        onClose={closeDialog}
        onSuccess={() => updateLastTouch(dialogContact?.id)}
      />

      <LinkedInModal
        isOpen={activeDialog === "linkedin"}
        contact={dialogContact}
        onClose={closeDialog}
        onSuccess={() => updateLastTouch(dialogContact?.id)}
      />

      {/* Manual Log */}
      <Dialog open={activeDialog === "touch"} onOpenChange={closeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Log Other Touchpoint with {dialogContact?.first_name}{" "}
              {dialogContact?.last_name}
            </DialogTitle>
          </DialogHeader>
          <textarea
            className="w-full border rounded p-2"
            placeholder="What happened?"
          />
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={closeDialog}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TouchHistoryModal
        open={activeDialog === "history"}
        onClose={closeDialog}
        contact={dialogContact}
        touches={touchHistory}
        loading={loadingHistory}
        // ⭐ NEW — Forward reply events into parent
        onReply={({ initialSubject, initialBody }) =>
          openDialog("email", dialogContact, {
            initialSubject,
            initialBody,
          })
        }
        onEmail={() => openDialog("email", dialogContact)}
        onCall={() => openDialog("call", dialogContact)}
        onLinkedIn={() => openDialog("linkedin", dialogContact)}
      />

      {/* Shared Filters */}
      {openFilterKey && openFilterKey !== "tag" && openFilterKey !== "lastTouch" && (
        <FilterModal
          open={!!openFilterKey}
          onOpenChange={(v) => !v && setOpenFilterKey(null)}
          columnKey={openFilterKey}
          title={{
            name: "Name",
            company: "Company",
            title: "Title",
          }[openFilterKey]}
          values={filterValuesMap[openFilterKey] || []}
          selected={Array.isArray(filters[openFilterKey]) ? filters[openFilterKey] : []}
          advancedFilter={isAdvancedFilter(filters[openFilterKey]) ? filters[openFilterKey] : null}
          onApply={(vals) => {
            // Handle both regular array filters and advanced filters
            if (vals && typeof vals === "object" && vals.type === "advanced") {
              setFilters((prev) => ({ ...prev, [vals.columnKey]: vals }))
            } else {
              setFilters((prev) => ({ ...prev, [openFilterKey]: vals }))
            }
            setOpenFilterKey(null)
          }}
          onClear={() => {
            setFilters((prev) => ({ ...prev, [openFilterKey]: [] }))
            setOpenFilterKey(null)
          }}
        />
      )}

      {/* Tag Filter Modal */}
      <TagFilterModal
        open={showTagFilter}
        onOpenChange={setShowTagFilter}
        title="Tag"
        values={filterValuesMap.tag}
        selected={filters.tag}
        onApply={({ mode, selected }) => {
          setTagFilterMode(mode)
          setFilters((prev) => ({ ...prev, tag: selected }))
          setShowTagFilter(false)
        }}
        onClear={() => {
          setFilters((prev) => ({ ...prev, tag: [] }))
          setTagFilterMode("is")
          setShowTagFilter(false)
        }}
      />

      {/* Last Touch Filter */}
      <LastTouchFilterModal
        open={showLastTouchFilter}
        onOpenChange={setShowLastTouchFilter}
        selected={filters.lastTouch}
        onApply={(config) => {
          setFilters((prev) => ({ ...prev, lastTouch: config || null }))
          setShowLastTouchFilter(false)
        }}
        onClear={() => {
          setFilters((prev) => ({ ...prev, lastTouch: null }))
          setShowLastTouchFilter(false)
        }}
      />

      {/* Tag Management */}
      <TagModal
        open={showTagModal}
        onClose={() => setShowTagModal(false)}
        selectedContacts={selectedContacts}
      />
    </div>
  )
}
