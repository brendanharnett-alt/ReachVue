import React, { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Upload, ChevronLeft, ChevronRight, FileText } from "lucide-react"

export default function AddGroupDialog({ open, onClose }) {
  const [step, setStep] = useState(1)
  const [groupName, setGroupName] = useState("")
  const [selectedFile, setSelectedFile] = useState(null)
  const [csvHeaders, setCsvHeaders] = useState([])
  const [csvRows, setCsvRows] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [columnMapping, setColumnMapping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    title: "",
    linkedIn: "",
  })

  // Parse CSV file
  const parseCSV = (text) => {
    try {
      if (!text || typeof text !== "string") {
        return { headers: [], rows: [] }
      }

      const lines = text.split(/\r?\n/).filter((line) => line && line.trim())
      if (lines.length === 0) return { headers: [], rows: [] }

      // Simple CSV parser (handles quoted values)
      const parseLine = (line) => {
        if (!line) return []
        const result = []
        let current = ""
        let inQuotes = false

        for (let i = 0; i < line.length; i++) {
          const char = line[i]
          if (char === '"') {
            inQuotes = !inQuotes
          } else if (char === "," && !inQuotes) {
            result.push(current.trim())
            current = ""
          } else {
            current += char
          }
        }
        result.push(current.trim())
        return result
      }

      const headers = parseLine(lines[0]).filter((h) => h) // Filter empty headers
      if (headers.length === 0) return { headers: [], rows: [] }

      const rows = lines.slice(1)
        .filter((line) => line && line.trim()) // Filter empty lines
        .map((line) => {
          const values = parseLine(line)
          const row = {}
          headers.forEach((header, index) => {
            row[header] = values[index] ? String(values[index]) : ""
          })
          return row
        })
        .filter((row) => Object.keys(row).length > 0) // Filter completely empty rows

      return { headers, rows }
    } catch (error) {
      console.error("Error in parseCSV:", error)
      throw error
    }
  }

  // Get preview rows (first 5 data rows)
  const previewRows = useMemo(() => {
    if (!csvRows || csvRows.length === 0) return []
    return csvRows.slice(0, 5)
  }, [csvRows])

  const processFile = (file) => {
    if (!file) return
    
    // Check if it's a CSV file
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert("Please upload a CSV file.")
      return
    }

    setSelectedFile(file)
    // Reset column mapping when new file is selected
    setColumnMapping({
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      title: "",
      linkedIn: "",
    })
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const text = event.target?.result
        if (!text) {
          throw new Error("No file content")
        }
        const { headers, rows } = parseCSV(String(text))
        if (!headers || !Array.isArray(headers) || !rows || !Array.isArray(rows)) {
          throw new Error("Invalid CSV structure")
        }
        setCsvHeaders(headers)
        setCsvRows(rows)
        console.log("CSV parsed:", { headers, rowCount: rows.length })
      } catch (error) {
        console.error("Error parsing CSV:", error)
        alert("Error parsing CSV file. Please ensure it's a valid CSV format.")
        setCsvHeaders([])
        setCsvRows([])
        setSelectedFile(null)
      }
    }
    reader.onerror = () => {
      alert("Error reading file.")
      setCsvHeaders([])
      setCsvRows([])
    }
    reader.readAsText(file)
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    processFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      processFile(file)
    }
  }

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
    }
  }

  const handleImport = () => {
    // No-op for now
    console.log("Import group:", { groupName, selectedFile, columnMapping })
    onClose()
    // Reset form
    setStep(1)
    setGroupName("")
    setSelectedFile(null)
    setCsvHeaders([])
    setCsvRows([])
    setColumnMapping({
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      title: "",
      linkedIn: "",
    })
  }

  const handleClose = () => {
    onClose()
    // Reset form
    setStep(1)
    setGroupName("")
    setSelectedFile(null)
    setCsvHeaders([])
    setCsvRows([])
    setColumnMapping({
      firstName: "",
      lastName: "",
      email: "",
      company: "",
      title: "",
      linkedIn: "",
    })
  }

  const canProceedStep1 = groupName.trim() && selectedFile && csvHeaders.length > 0
  const canProceedStep2 = Object.values(columnMapping).some((val) => val !== "")

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full max-h-[92vh] overflow-hidden rounded-lg shadow-lg flex flex-col mt-[0vh] mb-[5vh]">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0 border-b bg-white">
          <DialogTitle>Add Group</DialogTitle>
          <DialogDescription>
            Upload a list of people to act on together
          </DialogDescription>
        </DialogHeader>

        {/* Content area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 bg-gray-50">
          {/* Step 1: Group Basics */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Group Name
                </label>
                <Input
                  placeholder="AWS re:Invent follow-ups"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Upload CSV File
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragging
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="csv-upload"
                  />
                  <label
                    htmlFor="csv-upload"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload className="h-10 w-10 text-gray-400" />
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        CSV files only
                      </p>
                    </div>
                  </label>
                  {selectedFile && (
                    <div className="mt-4 flex items-center gap-2 justify-center">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">{selectedFile.name}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Preview & Mapping */}
          {step === 2 && (
            <div className="grid grid-cols-12 gap-4 items-start">
              {/* Left: Preview Table */}
              <div className="col-span-7 border rounded-lg overflow-hidden bg-white h-fit">
                <div className="px-3 py-2 border-b bg-gray-50">
                  <p className="text-sm font-medium">Preview</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {csvHeaders && csvHeaders.length > 0 ? (
                          csvHeaders.map((header, idx) => (
                            <th
                              key={idx}
                              className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b whitespace-nowrap"
                            >
                              {header}
                            </th>
                          ))
                        ) : (
                          <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 border-b">
                            No headers
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows && previewRows.length > 0 ? (
                        previewRows.map((row, idx) => (
                          <tr key={idx} className="border-b hover:bg-gray-50">
                            {csvHeaders && csvHeaders.length > 0 ? (
                              csvHeaders.map((header, colIdx) => (
                                <td key={colIdx} className="px-3 py-2 text-xs whitespace-nowrap">
                                  {row[header] || "-"}
                                </td>
                              ))
                            ) : (
                              <td className="px-3 py-2 text-xs">No data</td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={csvHeaders?.length || 1}
                            className="px-3 py-4 text-xs text-gray-500 text-center"
                          >
                            No data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right: Column Mapping */}
              <div className="col-span-5 border rounded-lg overflow-hidden bg-white">
                <div className="flex flex-col">
                  <div className="px-3 py-2 border-b bg-gray-50">
                    <p className="text-sm font-medium">Column Mapping</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        First Name
                      </label>
                      <Select
                        value={columnMapping.firstName}
                        onValueChange={(value) =>
                          setColumnMapping((prev) => ({ ...prev, firstName: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders && csvHeaders.length > 0 && csvHeaders.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Last Name
                      </label>
                      <Select
                        value={columnMapping.lastName}
                        onValueChange={(value) =>
                          setColumnMapping((prev) => ({ ...prev, lastName: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders && csvHeaders.length > 0 && csvHeaders.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Email
                      </label>
                      <Select
                        value={columnMapping.email}
                        onValueChange={(value) =>
                          setColumnMapping((prev) => ({ ...prev, email: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders && csvHeaders.length > 0 && csvHeaders.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Company
                      </label>
                      <Select
                        value={columnMapping.company}
                        onValueChange={(value) =>
                          setColumnMapping((prev) => ({ ...prev, company: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders && csvHeaders.length > 0 && csvHeaders.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        Title
                      </label>
                      <Select
                        value={columnMapping.title}
                        onValueChange={(value) =>
                          setColumnMapping((prev) => ({ ...prev, title: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders && csvHeaders.length > 0 && csvHeaders.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-700 mb-1.5 block">
                        LinkedIn
                      </label>
                      <Select
                        value={columnMapping.linkedIn}
                        onValueChange={(value) =>
                          setColumnMapping((prev) => ({ ...prev, linkedIn: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvHeaders && csvHeaders.length > 0 && csvHeaders.map((col) => (
                            <SelectItem key={col} value={col}>
                              {col}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">Review</h3>
                <div className="space-y-3">
                  <div>
                    <span className="text-xs font-medium text-gray-600">Group Name:</span>
                    <p className="text-sm text-gray-900 mt-1">{groupName || "(Not set)"}</p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-600">File:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {selectedFile?.name || "(No file selected)"}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-gray-600">Contacts:</span>
                    <p className="text-sm text-gray-900 mt-1">
                      {csvRows.length} {csvRows.length === 1 ? "contact" : "contacts"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t bg-white shrink-0">
          <div className="flex items-center justify-between w-full">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={handleBack}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              {step < 3 ? (
                <Button
                  onClick={handleNext}
                  disabled={
                    (step === 1 && !canProceedStep1) || (step === 2 && !canProceedStep2)
                  }
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleImport} className="bg-primary text-white">
                  Import Group
                </Button>
              )}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

