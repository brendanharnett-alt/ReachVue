// src/api.js

const BASE_URL = "http://localhost:3000"

// ----------------------
// CONTACTS
// ----------------------
export async function fetchContacts() {
  try {
    const res = await fetch(`${BASE_URL}/contacts`)
    if (!res.ok) throw new Error("Failed to fetch contacts")
    return await res.json()
  } catch (err) {
    console.error("Fetch contacts error:", err)
    return []
  }
}

// ----------------------
// TAGS
// ----------------------
export async function fetchTags() {
  try {
    const res = await fetch(`${BASE_URL}/tags`)
    if (!res.ok) throw new Error("Failed to fetch tags")
    return await res.json()
  } catch (err) {
    console.error("Fetch tags error:", err)
    return []
  }
}

export async function addTag(tagName) {
  try {
    const res = await fetch(`${BASE_URL}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_name: tagName }),
    })
    if (!res.ok) throw new Error("Failed to add tag")
    return await res.json()
  } catch (err) {
    console.error("Add tag error:", err)
    throw err
  }
}
