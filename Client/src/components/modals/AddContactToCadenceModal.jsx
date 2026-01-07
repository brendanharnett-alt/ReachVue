import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchContacts } from "@/api";

export default function AddContactToCadenceModal({ open, onClose, onAdd, cadenceId }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);

  // Fetch contacts when modal opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      fetchContacts()
        .then((data) => {
          setContacts(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Failed to fetch contacts:", err);
          setLoading(false);
        });
    } else {
      // Reset state when modal closes
      setSearchQuery("");
      setSelectedContact(null);
    }
  }, [open]);

  // Filter contacts based on search query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) {
      return contacts;
    }
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (contact) =>
        `${contact.first_name || ""} ${contact.last_name || ""}`
          .toLowerCase()
          .includes(query) ||
        (contact.company || "").toLowerCase().includes(query) ||
        (contact.title || "").toLowerCase().includes(query)
    );
  }, [contacts, searchQuery]);

  const handleSelectContact = (contact) => {
    setSelectedContact(contact);
  };

  const handleAdd = () => {
    if (selectedContact && onAdd) {
      onAdd(selectedContact);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-4 pt-3 pb-2">
          <DialogTitle className="text-sm font-semibold">Add Contact to Cadence</DialogTitle>
          <DialogDescription className="text-xs text-gray-500 mt-0.5">
            Search for a contact to add to this cadence.
          </DialogDescription>
        </DialogHeader>

        {/* Content area */}
        <div className="px-4 pb-2 space-y-1.5">
          {/* Search Input */}
          <div>
            <Input
              placeholder="Search by name, company, or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 text-sm"
              autoFocus
            />
          </div>

          {/* Contacts List */}
          <div className="border rounded-md max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-gray-500 text-xs">
                Loading contacts...
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-xs">
                {searchQuery.trim()
                  ? "No contacts found matching your search."
                  : "No contacts available."}
              </div>
            ) : (
              <div className="divide-y">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedContact?.id === contact.id;
                  return (
                    <button
                      key={contact.id}
                      onClick={() => handleSelectContact(contact)}
                      className={`w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors ${
                        isSelected ? "bg-blue-50 border-l-2 border-blue-600" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate text-xs leading-tight">
                            {contact.first_name || ""} {contact.last_name || ""}
                          </div>
                          <div className="text-xs text-gray-600 truncate mt-0.5 leading-tight">
                            {contact.title || "—"}
                          </div>
                          <div className="text-xs text-gray-500 truncate mt-0.5 leading-tight">
                            {contact.company || "—"}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="ml-2 flex-shrink-0">
                            <div className="h-4 w-4 rounded-full bg-blue-600 flex items-center justify-center">
                              <svg
                                className="h-2.5 w-2.5 text-white"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-4 py-2 border-t mt-0">
          <Button variant="outline" onClick={onClose} className="h-8 text-xs px-3">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-primary text-white h-8 text-xs px-3"
            disabled={!selectedContact}
          >
            Add to Cadence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

