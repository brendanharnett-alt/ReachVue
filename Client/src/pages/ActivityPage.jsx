import React, { useEffect, useState, useMemo } from "react"
import { fetchAllTouches } from "../api"
import { FilterModal } from "@/components/filters/FilterModal"
import { LastTouchFilterModal } from "@/components/filters/LastTouchFilterModal"
import TouchDetailsModal from "@/components/modals/TouchDetailsModal"
import { Button } from "@/components/ui/button"
import { Filter, ChevronUp, ChevronDown } from "lucide-react"

// Helper to strip HTML tags for preview
function stripHtml(html) {
  if (!html) return ""
  let text = html.replace(/<[^>]+>/g, " ")
  const textarea = document.createElement("textarea")
  textarea.innerHTML = text
  let decoded = textarea.value
  return decoded.replace(/\s+/g, " ").trim()
}

// Format timestamp
function formatTimestamp(dateString) {
  if (!dateString) return "—"
  const date = new Date(dateString)
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

export default function ActivityPage() {
  const [touches, setTouches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState("timestamp")
  const [sortDirection, setSortDirection] = useState("desc")
  
  // Filter state
  const [touchTypeFilter, setTouchTypeFilter] = useState([])
  const [companyFilter, setCompanyFilter] = useState([])
  const [timeFilter, setTimeFilter] = useState(null)
  
  // Filter modal states
  const [showTouchTypeFilter, setShowTouchTypeFilter] = useState(false)
  const [showCompanyFilter, setShowCompanyFilter] = useState(false)
  const [showTimeFilter, setShowTimeFilter] = useState(false)
  
  // Touch details modal
  const [selectedTouch, setSelectedTouch] = useState(null)
  const [showTouchDetails, setShowTouchDetails] = useState(false)

  // Load touches on mount
  useEffect(() => {
    const loadTouches = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await fetchAllTouches(10000, 0) // Large limit to get all
        setTouches(data.touches || [])
      } catch (err) {
        console.error("Error loading touches:", err)
        setError("Failed to load touches")
      } finally {
        setLoading(false)
      }
    }
    loadTouches()
  }, [])

  // Get unique values for filters
  const uniqueTouchTypes = useMemo(() => {
    const types = new Set()
    touches.forEach((t) => {
      if (t.touch_type) types.add(t.touch_type)
    })
    return Array.from(types).sort()
  }, [touches])

  const uniqueCompanies = useMemo(() => {
    const companies = new Set()
    touches.forEach((t) => {
      if (t.company) companies.add(t.company)
    })
    return Array.from(companies).sort()
  }, [touches])

  // Apply filters
  const filteredTouches = useMemo(() => {
    let filtered = [...touches]

    // Touch type filter
    if (touchTypeFilter.length > 0) {
      filtered = filtered.filter((t) => touchTypeFilter.includes(t.touch_type))
    }

    // Company filter
    if (companyFilter.length > 0) {
      filtered = filtered.filter((t) => companyFilter.includes(t.company))
    }

    // Time filter
    if (timeFilter) {
      const now = new Date()
      filtered = filtered.filter((t) => {
        if (!t.touched_at) return timeFilter.type === "empty"
        const touchDate = new Date(t.touched_at)

        if (timeFilter.type === "empty") {
          return false // No touched_at means not empty (has a date)
        } else if (timeFilter.type === "within") {
          const range = timeFilter.range || "30d"
          let days = 30
          if (range === "7d") days = 7
          else if (range === "30d") days = 30
          else if (range === "90d") days = 90
          else if (range === "6mo") days = 180
          const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
          return touchDate >= cutoff
        } else if (timeFilter.type === "between") {
          const start = timeFilter.start ? new Date(timeFilter.start + "T00:00:00") : null
          const end = timeFilter.end ? new Date(timeFilter.end + "T23:59:59") : null
          if (start && end) {
            return touchDate >= start && touchDate <= end
          }
          return true
        } else if (timeFilter.type === "before") {
          const before = timeFilter.date ? new Date(timeFilter.date) : null
          if (before) {
            return touchDate < before
          }
          return true
        }
        return true
      })
    }

    return filtered
  }, [touches, touchTypeFilter, companyFilter, timeFilter])

  // Apply sorting
  const sortedTouches = useMemo(() => {
    const sorted = [...filteredTouches]

    sorted.sort((a, b) => {
      let aValue, bValue

      switch (sortColumn) {
        case "company":
          aValue = (a.company || "").toLowerCase()
          bValue = (b.company || "").toLowerCase()
          break
        case "fullName":
          const aName = `${a.first_name || ""} ${a.last_name || ""}`.trim().toLowerCase()
          const bName = `${b.first_name || ""} ${b.last_name || ""}`.trim().toLowerCase()
          aValue = aName
          bValue = bName
          break
        case "touchType":
          aValue = (a.touch_type || "").toLowerCase()
          bValue = (b.touch_type || "").toLowerCase()
          break
        case "opens":
          aValue = a.open_count || 0
          bValue = b.open_count || 0
          break
        case "clicks":
          aValue = a.click_count || 0
          bValue = b.click_count || 0
          break
        case "timestamp":
          aValue = a.touched_at ? new Date(a.touched_at).getTime() : 0
          bValue = b.touched_at ? new Date(b.touched_at).getTime() : 0
          break
        default:
          return 0
      }

      if (sortColumn === "timestamp" || sortColumn === "opens" || sortColumn === "clicks") {
        // Numeric comparison
        if (sortDirection === "asc") {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      } else {
        // String comparison
        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
        return 0
      }
    })

    return sorted
  }, [filteredTouches, sortColumn, sortDirection])

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const SortIndicator = ({ column }) => {
    if (sortColumn !== column) {
      return (
        <span className="inline-flex flex-col ml-1 opacity-40">
          <ChevronUp className="h-3 w-3 -mb-1" />
          <ChevronDown className="h-3 w-3" />
        </span>
      )
    }
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

  const handleRowClick = (touch) => {
    setSelectedTouch(touch)
    setShowTouchDetails(true)
  }

  const clearFilters = () => {
    setTouchTypeFilter([])
    setCompanyFilter([])
    setTimeFilter(null)
  }

  const hasActiveFilters = touchTypeFilter.length > 0 || companyFilter.length > 0 || timeFilter !== null

  return (
    <div className="p-6">
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">Activity</h2>
            <span className="text-sm text-gray-500 font-medium">
              Showing {sortedTouches.length.toLocaleString()} of {touches.length.toLocaleString()} total touches
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowTouchTypeFilter(true)}
            >
              <Filter className="h-4 w-4" />
              Touch Type {touchTypeFilter.length > 0 && `(${touchTypeFilter.length})`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowCompanyFilter(true)}
            >
              <Filter className="h-4 w-4" />
              Company {companyFilter.length > 0 && `(${companyFilter.length})`}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowTimeFilter(true)}
            >
              <Filter className="h-4 w-4" />
              Time {timeFilter && "✓"}
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading touches...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : sortedTouches.length === 0 ? (
          <div className="py-8 text-center text-gray-500 border rounded-lg bg-gray-50">
            No touches found. {hasActiveFilters && "Try adjusting your filters."}
          </div>
        ) : (
          <div className="relative h-[66vh] overflow-x-auto overflow-y-auto mt-4">
            <table className="table-auto text-sm w-full border-collapse">
              <thead className="bg-muted sticky top-0 z-20">
                <tr className="text-left text-xs">
                  <th
                    className="p-2 font-medium cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("company")}
                  >
                    Company <SortIndicator column="company" />
                  </th>
                  <th
                    className="p-2 font-medium cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("fullName")}
                  >
                    Full Name <SortIndicator column="fullName" />
                  </th>
                  <th
                    className="p-2 font-medium cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("touchType")}
                  >
                    Touch Type <SortIndicator column="touchType" />
                  </th>
                  <th className="p-2 font-medium">Subject</th>
                  <th className="p-2 font-medium">Message Preview</th>
                  <th
                    className="p-2 font-medium cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("opens")}
                  >
                    # of Opens <SortIndicator column="opens" />
                  </th>
                  <th
                    className="p-2 font-medium cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("clicks")}
                  >
                    # of Clicks <SortIndicator column="clicks" />
                  </th>
                  <th
                    className="p-2 font-medium cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSort("timestamp")}
                  >
                    Timestamp <SortIndicator column="timestamp" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedTouches.map((touch) => (
                  <tr
                    key={touch.id}
                    className="border-b hover:bg-gray-50 cursor-pointer transition"
                    onClick={() => handleRowClick(touch)}
                  >
                    <td className="p-2 truncate max-w-[140px]">{touch.company || "—"}</td>
                    <td className="p-2 truncate max-w-[140px]">
                      {touch.first_name || touch.last_name
                        ? `${touch.first_name || ""} ${touch.last_name || ""}`.trim()
                        : "—"}
                    </td>
                    <td className="p-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 capitalize">
                        {touch.touch_type || "—"}
                      </span>
                    </td>
                    <td className="p-2 truncate max-w-[200px]">
                      {touch.touch_type === "email" ? touch.subject || "—" : "—"}
                    </td>
                    <td className="p-2 truncate max-w-[300px]">
                      {touch.body ? stripHtml(touch.body).slice(0, 100) + (stripHtml(touch.body).length > 100 ? "…" : "") : "—"}
                    </td>
                    <td className="p-2 text-center">
                      {touch.touch_type === "email" ? touch.open_count || 0 : "—"}
                    </td>
                    <td className="p-2 text-center">
                      {touch.touch_type === "email" ? touch.click_count || 0 : "—"}
                    </td>
                    <td className="p-2">{formatTimestamp(touch.touched_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Filters */}
      <FilterModal
        open={showTouchTypeFilter}
        onOpenChange={setShowTouchTypeFilter}
        columnKey="touchType"
        title="Touch Type"
        values={uniqueTouchTypes}
        selected={touchTypeFilter}
        onApply={(selected) => setTouchTypeFilter(selected)}
        onClear={() => setTouchTypeFilter([])}
      />

      <FilterModal
        open={showCompanyFilter}
        onOpenChange={setShowCompanyFilter}
        columnKey="company"
        title="Company"
        values={uniqueCompanies}
        selected={companyFilter}
        onApply={(selected) => setCompanyFilter(selected)}
        onClear={() => setCompanyFilter([])}
      />

      <LastTouchFilterModal
        open={showTimeFilter}
        onOpenChange={setShowTimeFilter}
        selected={timeFilter}
        onApply={(config) => setTimeFilter(config)}
        onClear={() => setTimeFilter(null)}
      />

      {/* Touch Details Modal */}
      <TouchDetailsModal
        open={showTouchDetails}
        onClose={() => {
          setShowTouchDetails(false)
          setSelectedTouch(null)
        }}
        touch={selectedTouch}
      />
    </div>
  )
}

