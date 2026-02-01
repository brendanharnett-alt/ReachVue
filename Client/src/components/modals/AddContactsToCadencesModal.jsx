import React, { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { fetchCadences, addContactToCadence, fetchCadenceContacts } from "../../api"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function AddContactsToCadencesModal({ 
  open, 
  onClose, 
  selectedContacts,
  contacts 
}) {
  const [cadences, setCadences] = useState([])
  const [selectedCadences, setSelectedCadences] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)
  const [failedAdditions, setFailedAdditions] = useState([])
  const [showErrorModal, setShowErrorModal] = useState(false)

  // Load cadences when modal opens
  useEffect(() => {
    if (!open) {
      setSelectedCadences([])
      setFailedAdditions([])
      setShowErrorModal(false)
      setError(null)
      return
    }

    const loadCadences = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchCadences()
        setCadences(data)
      } catch (err) {
        console.error("Failed to fetch cadences:", err)
        setError("Failed to load cadences")
      } finally {
        setLoading(false)
      }
    }

    loadCadences()
  }, [open])

  const toggleCadence = (cadenceId) => {
    setSelectedCadences((prev) =>
      prev.includes(cadenceId)
        ? prev.filter((id) => id !== cadenceId)
        : [...prev, cadenceId]
    )
  }

  const handleAddToCadences = async () => {
    if (selectedCadences.length === 0) return

    setAdding(true)
    setFailedAdditions([])

    const failures = []

    try {
      // For each selected cadence
      for (const cadenceId of selectedCadences) {
        const cadence = cadences.find((c) => c.id === cadenceId)
        if (!cadence) continue

        // Get contacts already in this cadence
        let existingContacts = []
        try {
          const existing = await fetchCadenceContacts(cadenceId)
          // The endpoint returns contact_id field
          existingContacts = existing.map((c) => c.contact_id)
        } catch (err) {
          console.error(`Failed to fetch contacts for cadence ${cadenceId}:`, err)
          // If we can't fetch, assume no contacts are in cadence and try to add all
        }

        // Filter out contacts already in cadence
        const contactsToAdd = selectedContacts.filter(
          (contactId) => !existingContacts.includes(contactId)
        )

        // Track contacts that are already in cadence
        const alreadyInCadence = selectedContacts.filter((contactId) =>
          existingContacts.includes(contactId)
        )

        if (alreadyInCadence.length > 0) {
          failures.push({
            cadenceId: cadenceId,
            cadenceName: cadence.name,
            contactIds: alreadyInCadence,
          })
        }

        // Add contacts that aren't already in cadence
        for (const contactId of contactsToAdd) {
          try {
            await addContactToCadence(cadenceId, contactId)
          } catch (err) {
            console.error(
              `Failed to add contact ${contactId} to cadence ${cadenceId}:`,
              err
            )
            // Add to failures if it's a duplicate error
            if (err.message && err.message.includes("already")) {
              if (!failures.find((f) => f.cadenceId === cadenceId)) {
                failures.push({
                  cadenceId: cadenceId,
                  cadenceName: cadence.name,
                  contactIds: [],
                })
              }
              const failure = failures.find((f) => f.cadenceId === cadenceId)
              if (failure && !failure.contactIds.includes(contactId)) {
                failure.contactIds.push(contactId)
              }
            }
          }
        }
      }

      setFailedAdditions(failures)

      if (failures.length === 0) {
        // All succeeded
        const totalAdded = selectedContacts.length * selectedCadences.length
        alert(
          `✅ All ${selectedContacts.length} contact(s) added to selected cadence(s).`
        )
        onClose()
      } else {
        // Some failed - show error modal
        setShowErrorModal(true)
      }
    } catch (err) {
      console.error("Error adding contacts to cadences:", err)
      alert("Failed to add contacts to cadences. Please try again.")
    } finally {
      setAdding(false)
    }
  }

  // Get contact name by ID
  const getContactName = (contactId) => {
    const contact = contacts?.find((c) => c.id === contactId)
    if (!contact) return `Contact ${contactId}`
    const firstName = contact.first_name || ""
    const lastName = contact.last_name || ""
    return `${firstName} ${lastName}`.trim() || contact.email || `Contact ${contactId}`
  }

  return (
    <>
      <Dialog open={open && !showErrorModal} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Contacts to Cadences</DialogTitle>
            <DialogDescription>
              Select one or more cadences to add {selectedContacts?.length || 0}{" "}
              selected contact(s) to.
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="py-8 text-center text-gray-500">
              Loading cadences...
            </div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : cadences.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No cadences available.
            </div>
          ) : (
            <ScrollArea className="h-[300px] border rounded-md p-4">
              <div className="space-y-3">
                {cadences.map((cadence) => (
                  <div
                    key={cadence.id}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                  >
                    <Checkbox
                      checked={selectedCadences.includes(cadence.id)}
                      onCheckedChange={() => toggleCadence(cadence.id)}
                    />
                    <span className="flex-1">{cadence.name}</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={adding}>
              Cancel
            </Button>
            <Button
              onClick={handleAddToCadences}
              disabled={selectedCadences.length === 0 || adding || loading}
            >
              {adding ? "Adding..." : "Add to Cadence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Modal */}
      <Dialog open={showErrorModal} onOpenChange={setShowErrorModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Contacts Already in Cadences</DialogTitle>
            <DialogDescription>
              The following contacts could not be added because they are already in
              the cadence:
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="h-[400px] border rounded-md p-4">
            <div className="space-y-4">
              {failedAdditions.map((failure) => (
                <div key={failure.cadenceId}>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {failure.cadenceName}:
                  </h4>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    {failure.contactIds.map((contactId) => (
                      <li key={contactId} className="text-gray-700">
                        {getContactName(contactId)}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter>
            <Button onClick={() => {
              setShowErrorModal(false)
              onClose()
            }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

