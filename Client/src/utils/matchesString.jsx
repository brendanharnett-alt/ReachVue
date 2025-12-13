// utils/matchesString.js
// -----------------------------------------------------------
// Shared helper for string-based filtering logic in ReachVue.
// Handles all 8 operators (case-insensitive).
// Safe for single strings or arrays of strings (e.g., tags).

export function matchesString(value, filterValues = [], matchType = "Contains") {
  // If no filter values selected, always match
  if (!filterValues || filterValues.length === 0) return true

  // Normalize both sides (case-insensitive)
  const normalize = (v) => (v || "").toString().toLowerCase()
  const valArray = Array.isArray(value)
    ? value.map(normalize)
    : [normalize(value)]
  const filters = filterValues.map(normalize)

  // Comparison function for one value vs one filter
  const check = (val, filter) => {
    switch (matchType) {
      case "Equals":
        return val === filter
      case "Does not equal":
        return val !== filter
      case "Contains":
        return val.includes(filter)
      case "Does not contain":
        return !val.includes(filter)
      case "Begins With":
        return val.startsWith(filter)
      case "Does not Begin with":
        return !val.startsWith(filter)
      case "Ends with":
        return val.endsWith(filter)
      case "Does Not End with":
        return !val.endsWith(filter)
      default:
        return true
    }
  }

  // For “Does not …” types, ALL must pass (none can match)
  const isNegation = matchType.toLowerCase().includes("does not")
  if (isNegation) {
    return valArray.every((val) =>
      filters.every((filter) => check(val, filter))
    )
  }

  // For positive types, ANY match is enough
  return valArray.some((val) =>
    filters.some((filter) => check(val, filter))
  )
}
