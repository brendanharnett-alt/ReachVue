// src/components/ContactsTable.jsx
import React, { useEffect, useState } from "react"
import { fetchContacts } from "../api"
import CallModal from "./modals/CallModal"
import LinkedInModal from "./modals/LinkedInModal"
import TouchHistoryModal from "./modals/TouchHistoryModal"
import EmailModal from "./modals/EmailModal"

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

const handleRefreshEmailWindow = () => {
  window.postMessage(
    {
      type: "__FROM_PAGE_TO_EXTENSION__",
      payload: { type: "reachvue:refresh-outlook-tab" },
    },
    "*"
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

  // 🔹 Strong Outlook error dialog
  const [showOutlookError, setShowOutlookError] = useState(false)

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === "reachvue:outlook-status") {
        const status = event.data.payload.status
        if (status !== "ready") {
          setShowOutlookError(true)
        }
      }
    }
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

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
      setContacts(data)
    }
    loadContacts()
  }, [])

  const toggleSelect = (id) => {
    setSelectedContacts((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const handleDelete = () => {
    console.log("Deleted contact", contactToDelete)
    setShowDeleteDialog(false)
  }

  const clearFilters = () => {
    console.log("Clear filters clicked")
  }

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

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* Title and Action Buttons */}
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

      {/* Search + Group By + Filters */}
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
          <Button variant="outline" className="flex items-center gap-2">
            <UserIcon className="h-4 w-4" /> Name
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <BuildingIcon className="h-4 w-4" /> Company
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <BriefcaseIcon className="h-4 w-4" /> Title
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" /> Tag
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4" /> Last Touch
          </Button>
          <Button variant="ghost" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Outlook error dialog */}
      <Dialog open={showOutlookError} onOpenChange={() => {}}>
        <DialogContent onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Outlook Automation Failed
            </DialogTitle>
            <DialogDescription>
              We couldn’t prepare the Outlook tab for sending. Please reopen
              Outlook and try again.
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

      {/* Table + Sidebar */}
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
                            ? new Date(contact.last_touched_at).toLocaleDateString()
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
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Action Dialogs */}
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
    </div>
  )
}
