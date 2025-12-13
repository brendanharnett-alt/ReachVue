import React, { useEffect, useState, useMemo } from "react"
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
} from "lucide-react"
import ContactSidebar from "./ContactSidebar"

// 🔹 Dropdown for per-row actions
export function ActionDropdown({ onEmail, onCall, onLinkedIn, onLogTouch }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={onEmail}>
          <MailIcon className="mr-2 h-4 w-4" /> Email
        </DropdownMenuItem>
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

  // ⭐ NEW — Email preset for replies
  const [emailPreset, setEmailPreset] = useState(null) 
  // { initialSubject, replyThreadId, parentTouchId }

  // 🔹 Filters
  const [openFilterKey, setOpenFilterKey] = useState(null)
  const [filters, setFilters] = useState({
    name: [],
    company: [],
    title: [],
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

  const clearFilters = () => {
    setFilters({ name: [], company: [], title: [], tag: [], lastTouch: null })
    setSearchTerm("")
    setTagFilterMode("is")
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
      const matchesName =
        excludeFilterKey === "name" || 
        filters.name.length === 0 || 
        filters.name.includes(fullName)
      
      const matchesCompany =
        excludeFilterKey === "company" || 
        filters.company.length === 0 || 
        filters.company.includes(c.company)
      
      const matchesTitle =
        excludeFilterKey === "title" || 
        filters.title.length === 0 || 
        filters.title.includes(c.title)
      
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

      const matchesName =
        filters.name.length === 0 || filters.name.includes(fullName)
      const matchesCompany =
        filters.company.length === 0 || filters.company.includes(c.company)
      const matchesTitle =
        filters.title.length === 0 || filters.title.includes(c.title)
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
        <h2 className="text-2xl font-semibold">Contacts</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowTagModal(true)}>
            Manage Tags
          </Button>
          <Button variant="outline">Export CSV</Button>
          <Button className="bg-primary text-white">+ Add Contact</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="border bg-gray-50 rounded-lg p-3 mt-2 mb-4 flex justify-between items-center">
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

        <div className="flex flex-wrap gap-2 justify-end">
          {[
            {
              key: "name",
              icon: <UserIcon className="h-4 w-4" />,
              label: "Name",
              active: filters.name.length,
            },
            {
              key: "company",
              icon: <BuildingIcon className="h-4 w-4" />,
              label: "Company",
              active: filters.company.length,
            },
            {
              key: "title",
              icon: <BriefcaseIcon className="h-4 w-4" />,
              label: "Title",
              active: filters.title.length,
            },
            {
              key: "tag",
              icon: <TagIcon className="h-4 w-4" />,
              label: "Tag",
              active: filters.tag.length || tagFilterMode !== "is",
            },
            {
              key: "lastTouch",
              icon: <ClockIcon className="h-4 w-4" />,
              label: "Last Touch",
              active: isLastTouchActive(filters.lastTouch),
            },
          ].map((f) => (
            <Button
              key={f.key}
              variant={f.active ? "default" : "outline"}
              className="flex items-center gap-2"
              onClick={() => handleOpenFilter(f.key)}
            >
              {f.icon} {f.label}
            </Button>
          ))}
          <Button variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="flex">
        <div
          className={`relative h-[66vh] overflow-auto pb-5 ${
            selectedContact ? "w-2/3" : "w-full"
          }`}
        >
          <table className="table-auto text-sm w-full border-collapse">
            <thead className="bg-muted sticky top-0 z-20">
              <tr className="text-left text-xs">
                <th className="p-2 font-medium">
                  <input
                    type="checkbox"
                    className="w-5 h-5 cursor-pointer"
                  />
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
                    <th className="p-2 font-medium">Tags</th>
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
                            <td className="p-2">
                              <div className="flex flex-wrap gap-1 max-w-[160px] overflow-hidden">
                                {contact.tags.map((tag, i) => (
                                  <span
                                    key={i}
                                    className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 truncate"
                                  >
                                    {tag.tag_name}
                                  </span>
                                ))}
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
                                variant="outline"
                                size="sm"
                                onClick={() => openDialog("history", contact)}
                              >
                                History
                              </Button>
                              <ActionDropdown
                                onEmail={() => openDialog("email", contact)}
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
          selected={filters[openFilterKey]}
          onApply={(vals) => {
            setFilters((prev) => ({ ...prev, [openFilterKey]: vals }))
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
