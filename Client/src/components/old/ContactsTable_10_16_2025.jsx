import React, { useEffect, useState, useMemo } from "react"
import { fetchContacts } from "../api"
import CallModal from "./modals/CallModal"
import LinkedInModal from "./modals/LinkedInModal"
import TouchHistoryModal from "./modals/TouchHistoryModal"
import EmailModal from "./modals/EmailModal"
import { FilterModal } from "./filters/FilterModal"

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
} from "lucide-react"
import ContactSidebar from "./ContactSidebar"

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
  const [contactToDelete, setContactToDelete] = useState(null)
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

  // 🔹 Filter modal state
  const [openFilterKey, setOpenFilterKey] = useState(null)

  // 🔹 Listen for readiness success/failure
  useEffect(() => {
    const handleReadinessMessage = (event) => {
      if (event.data?.type === "outlook-readiness-result") {
        console.log("📨 Readiness result received:", event.data)
        clearTimeout(timerId)
        setTimerId(null)
        setShowRefreshModal(false)

        if (!event.data.success) {
          setShowOutlookError(true)
        }
      }
    }

    window.addEventListener("message", handleReadinessMessage)
    return () => window.removeEventListener("message", handleReadinessMessage)
  }, [timerId])

  // 🔹 Trigger Outlook refresh
  const handleRefreshEmailWindow = () => {
    window.postMessage(
      {
        type: "__FROM_PAGE_TO_EXTENSION__",
        payload: { type: "reachvue:refresh-outlook-tab" },
      },
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

  const openDialog = async (type, contact) => {
    if (type === "history") {
      setDialogContact(contact)
      setLoadingHistory(true)
      try {
        const res = await fetch(
          `http://localhost:3000/touches?contact_id=${contact.id}&_sort=touched_at:DESC`
        )
        if (res.ok) {
          const data = await res.json()
          setTouchHistory(data)
        } else {
          setTouchHistory([])
        }
        setActiveDialog("history")
      } catch (err) {
        console.error("Error fetching history", err)
      } finally {
        setLoadingHistory(false)
      }
    } else {
      setDialogContact(contact)
      setActiveDialog(type)
    }
  }

  const closeDialog = () => {
    setActiveDialog(null)
    setDialogContact(null)
    setTouchHistory([])
    setLoadingHistory(false)
  }

  useEffect(() => {
    async function loadContacts() {
      const data = await fetchContacts()
      console.log("✅ Contacts fetched:", data.length)
      setContacts(data)
    }
    loadContacts()
  }, [])

  const toggleSelect = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const clearFilters = () => console.log("Clear filters clicked")

  const toggleGroupExpand = (group) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }))
  }

  const updateLastTouch = (contactId) => {
    setContacts((prev) =>
      prev.map((c) =>
        c.id === contactId
          ? { ...c, last_touched_at: new Date().toISOString() }
          : c
      )
    )
  }

  // 🔹 Unique values for filters
  const uniqueCompanies = useMemo(
    () => [...new Set(contacts.map((c) => c.company).filter(Boolean))].sort(),
    [contacts]
  )

  const uniqueTitles = useMemo(
    () => [...new Set(contacts.map((c) => c.title).filter(Boolean))].sort(),
    [contacts]
  )

  const uniqueTags = useMemo(
    () =>
      [
        ...new Set(
          contacts.flatMap((c) => c.tags?.map((t) => t.tag_name) || [])
        ),
      ].sort(),
    [contacts]
  )

  const uniqueNames = useMemo(
    () =>
      [
        ...new Set(
          contacts.map((c) => `${c.first_name} ${c.last_name}`.trim())
        ),
      ].sort(),
    [contacts]
  )

  const uniqueLastTouches = useMemo(
    () =>
      [
        ...new Set(
          contacts.map((c) =>
            c.last_touched_at
              ? new Date(c.last_touched_at).toLocaleDateString()
              : "—"
          )
        ),
      ].sort(),
    [contacts]
  )

  const groupedData = () => {
    if (groupBy === "none") return { All: contacts }
    if (groupBy === "company") {
      return contacts.reduce((acc, c) => {
        if (!acc[c.company]) acc[c.company] = []
        acc[c.company].push(c)
        return acc
      }, {})
    }
    if (groupBy === "tag") {
      return contacts.reduce((acc, c) => {
        c.tags.forEach((t) => {
          if (!acc[t.tag_name]) acc[t.tag_name] = []
          acc[t.tag_name].push(c)
        })
        return acc
      }, {})
    }
    return { All: contacts }
  }

  const groupedContacts = groupedData()

  const filterValuesMap = {
    name: uniqueNames,
    company: uniqueCompanies,
    title: uniqueTitles,
    tag: uniqueTags,
    lastTouch: uniqueLastTouches,
  }

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <h2 className="text-2xl font-semibold">Contacts</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            className="bg-blue-600 text-white hover:bg-blue-700"
            onClick={handleRefreshEmailWindow}
          >
            Refresh Email Window
          </Button>
          <Button variant="outline">Manage Tags</Button>
          <Button variant="outline">Export CSV</Button>
          <Button className="bg-primary text-white">+ Add Contact</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="border bg-gray-50 rounded-lg p-3 mt-2 mb-4 flex justify-between items-center">
        <div className="flex gap-2">
          <Input placeholder="Search here" className="w-48" />
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
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setOpenFilterKey("name")}
          >
            <UserIcon className="h-4 w-4" /> Name
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setOpenFilterKey("company")}
          >
            <BuildingIcon className="h-4 w-4" /> Company
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setOpenFilterKey("title")}
          >
            <BriefcaseIcon className="h-4 w-4" /> Title
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setOpenFilterKey("tag")}
          >
            <TagIcon className="h-4 w-4" /> Tag
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => setOpenFilterKey("lastTouch")}
          >
            <ClockIcon className="h-4 w-4" /> Last Touch
          </Button>
          <Button variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Refresh Modal */}
      <Dialog open={showRefreshModal} onOpenChange={setShowRefreshModal}>
        <DialogContent className="sm:max-w-[400px] text-center">
          <DialogHeader>
            <DialogTitle>Refreshing Outlook</DialogTitle>
            <DialogDescription>
              We’re preparing your Outlook tab. Please wait or retry if needed.
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center items-center py-6">
            <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>

          <DialogFooter className="flex justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => {
                clearTimeout(timerId)
                setTimerId(null)
                setShowRefreshModal(false)
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 text-white"
              onClick={handleRefreshEmailWindow}
            >
              Retry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outlook Error */}
      <Dialog open={showOutlookError} onOpenChange={setShowOutlookError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Outlook Automation Failed
            </DialogTitle>
            <DialogDescription>
              Outlook couldn’t be prepared within 30 seconds. You may need to
              log in or refresh Outlook.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => setShowOutlookError(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                  <input type="checkbox" />
                </th>
                <th className="p-2 font-medium">Company</th>
                <th className="p-2 font-medium">Full Name</th>
                <th className="p-2 font-medium">Title</th>
                <th className="p-2 font-medium">Last Touch</th>
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
                      <tr key={contact.id} className="border-t">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedContacts.includes(contact.id)}
                            onChange={() => toggleSelect(contact.id)}
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
                          {contact.last_touched_at
                            ? new Date(
                                contact.last_touched_at
                              ).toLocaleDateString()
                            : "—"}
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
                                onLinkedIn={() =>
                                  openDialog("linkedin", contact)
                                }
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
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
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

      {/* Other Modals */}
      <EmailModal
        open={activeDialog === "email"}
        contact={dialogContact}
        onClose={closeDialog}
        onSend={(emailData) => {
          console.log("Email ready:", emailData)
          updateLastTouch(dialogContact.id)
        }}
      />

      <CallModal
        isOpen={activeDialog === "call"}
        contact={dialogContact}
        onClose={closeDialog}
        onSuccess={() => updateLastTouch(dialogContact.id)}
      />

      <LinkedInModal
        isOpen={activeDialog === "linkedin"}
        contact={dialogContact}
        onClose={closeDialog}
        onSuccess={() => updateLastTouch(dialogContact.id)}
      />

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
            <Button
              onClick={() => {
                console.log("Log touch", dialogContact)
                closeDialog()
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeDialog === "history" && (
        <TouchHistoryModal
          open={activeDialog === "history"}
          onClose={closeDialog}
          contact={dialogContact}
          touches={touchHistory}
        />
      )}

      {/* Shared Filter Modal */}
      {openFilterKey && (
        <FilterModal
          open={!!openFilterKey}
          onOpenChange={(v) => !v && setOpenFilterKey(null)}
          columnKey={openFilterKey}
          title={{
            name: "Name",
            company: "Company",
            title: "Title",
            tag: "Tag",
            lastTouch: "Last Touch",
          }[openFilterKey]}
          values={filterValuesMap[openFilterKey] || []}
          selected={[]}
          onApply={(vals) => {
            console.log(`Applied filters for ${openFilterKey}:`, vals)
            setOpenFilterKey(null)
          }}
          onClear={() => {
            console.log(`Cleared filters for ${openFilterKey}`)
            setOpenFilterKey(null)
          }}
        />
      )}
    </div>
  )
}
