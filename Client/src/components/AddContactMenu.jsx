import React, { useState } from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { UserPlus, Users } from "lucide-react"
import AddIndividualContactModal from "./modals/AddIndividualContactModal"

export default function AddContactMenu() {
  const [showIndividualModal, setShowIndividualModal] = useState(false)
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleAddIndividual = () => {
    setDropdownOpen(false)
    setShowIndividualModal(true)
  }

  const handleAddGroup = () => {
    setDropdownOpen(false)
    setShowGroupModal(true)
  }

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button className="bg-primary text-white">+ Add Contact</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleAddIndividual}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Individual Contact
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleAddGroup}>
            <Users className="mr-2 h-4 w-4" />
            Add Group Contact
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddIndividualContactModal
        open={showIndividualModal}
        onClose={() => setShowIndividualModal(false)}
      />

      {/* Add Group Contact Modal - Stub */}
      <Dialog open={showGroupModal} onOpenChange={setShowGroupModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Group Contact</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500">
              Group contact functionality coming soon.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGroupModal(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

