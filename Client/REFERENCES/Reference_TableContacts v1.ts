import React, { useEffect, useState } from "react"
import { fetchContacts } from "../api"
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
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import {
  MailIcon,
  PhoneIcon,
  LinkedinIcon,
  ClockIcon,
  MoreVertical,
  PencilIcon,
  Trash2Icon,
  TagsIcon,
  DownloadIcon,
} from "lucide-react"

export function ActionDropdown({ onEmail, onCall, onLinkedIn, onLogTouch }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
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

  const [nameFilter, setNameFilter] = useState("")
  const [companyFilter, setCompanyFilter] = useState("")
  const [titleFilter, setTitleFilter] = useState("")
  const [lastTouchFilter, setLastTouchFilter] = useState("")
  const [tagFilter, setTagFilter] = useState("")

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
    setNameFilter("")
    setCompanyFilter("")
    setTitleFilter("")
    setTagFilter("")
    setLastTouchFilter("")
  }

  const filteredContacts = contacts.filter((contact) => {
    const matchesName = `${contact.first_name} ${contact.last_name}`.toLowerCase().includes(nameFilter.toLowerCase())
    const matchesCompany = contact.company.toLowerCase().includes(companyFilter.toLowerCase())
    const matchesTitle = contact.title.toLowerCase().includes(titleFilter.toLowerCase())
    const matchesTags = tagFilter ? contact.tags.some((tag) => tag.tag_name === tagFilter) : true
    const matchesLastTouch =
      lastTouchFilter === ""
        ? true
        : lastTouchFilter === "no_touch"
        ? !contact.lastTouched
        : lastTouchFilter === "7"
        ? contact.lastTouched && new Date() - new Date(contact.lastTouched) <= 7 * 24 * 60 * 60 * 1000
        : lastTouchFilter === "30"
        ? contact.lastTouched && new Date() - new Date(contact.lastTouched) > 30 * 24 * 60 * 60 * 1000
        : true

    return matchesName && matchesCompany && matchesTitle && matchesTags && matchesLastTouch
  })

  return (
    <div className="rounded-xl border bg-white p-4 shadow-sm">
      {/* Title and Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <h2 className="text-2xl font-semibold">Contacts</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">Manage Tags</Button>
          <Button variant="outline">Export CSV</Button>
          <Button className="bg-primary text-white">+ Add Contact</Button>
        </div>
      </div>

      {/* Filters Block */}
      <div className="border bg-gray-50 rounded-lg p-4 mt-2 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Name</label>
            <Input placeholder="Enter name" value={nameFilter} onChange={(e) => setNameFilter(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Title</label>
            <Input placeholder="Enter title" value={titleFilter} onChange={(e) => setTitleFilter(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Company</label>
            <Input placeholder="Enter company" value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Tag</label>
            <Input placeholder="Enter tag" value={tagFilter} onChange={(e) => setTagFilter(e.target.value)} />
          </div>
          <div className="flex flex-col">
            <label className="text-sm font-medium mb-1">Last Touch</label>
            <Select onValueChange={(v) => setLastTouchFilter(v)} value={lastTouchFilter}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="no_touch">No Touch</SelectItem>
                <SelectItem value="7">Last 7 Days</SelectItem>
                <SelectItem value="30">30+ Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="ghost" onClick={clearFilters}>Clear Filters</Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative h-[66vh] overflow-auto pb-16">
        <div className="min-w-[1200px] w-fit">
          <table className="table-auto text-xs w-full">
            <thead className="bg-muted sticky top-0 z-10">
              <tr className="text-left text-xs">
                <th className="p-3 w-[40px]"> <input type="checkbox" /> </th>
                <th className="p-3 w-[160px] font-medium">Name</th>
                <th className="p-3 w-[160px] font-medium">Title</th>
                <th className="p-3 w-[160px] font-medium">Company</th>
                <th className="p-3 w-[160px] font-medium">Phone</th>
                <th className="p-3 w-[120px] font-medium">Last Touch</th>
                <th className="p-3 w-[160px] font-medium">Tags</th>
                <th className="p-3 w-[240px] font-medium">Email</th>
                <th className="p-3 w-[120px] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => (
                <tr key={contact.id} className="border-t">
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes(contact.id)}
                      onChange={() => toggleSelect(contact.id)}
                    />
                  </td>
                  <td className="p-3 font-semibold text-blue-600 truncate">{contact.first_name} {contact.last_name}</td>
                  <td className="p-3 truncate">{contact.title}</td>
                  <td className="p-3 truncate">{contact.company}</td>
                  <td className="p-3 truncate">{contact.mobile_phone}</td>
                  <td className="p-3 whitespace-nowrap">{contact.lastTouched || "—"}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {contact.tags.map((tag, i) => (
                        <span key={i} className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 truncate">
                          {tag.tag_name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-3 truncate">{contact.email}</td>
                  <td className="p-3 flex items-center gap-1">
                    <ActionDropdown
                      onEmail={() => console.log("Email", contact)}
                      onCall={() => console.log("Call", contact)}
                      onLinkedIn={() => console.log("LinkedIn", contact)}
                      onLogTouch={() => console.log("Log Touch", contact)}
                    />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => console.log("Edit", contact)}>
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setContactToDelete(contact.id); setShowDeleteDialog(true); }}>
                      <Trash2Icon className="h-4 w-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription>Are you sure you want to delete this contact?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}