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

export async function fetchContactById(id) {
  try {
    const res = await fetch(`${BASE_URL}/contacts/${id}`)
    if (!res.ok) throw new Error("Failed to fetch contact by id")
    return await res.json()
  } catch (err) {
    console.error("Fetch contact by id error:", err)
    return null
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

// ----------------------
// TOUCHES (Email, Call, LinkedIn Logs)
// ----------------------

export async function fetchTouches(contactId) {
  try {
    const res = await fetch(`${BASE_URL}/touches?contact_id=${contactId}`)
    if (!res.ok) throw new Error("Failed to fetch touches")
    return await res.json()
  } catch (err) {
    console.error("Fetch touches error:", err)
    return []
  }
}

export async function fetchTouchById(touchId) {
  try {
    const res = await fetch(`${BASE_URL}/touches/${touchId}`)
    if (!res.ok) throw new Error("Failed to fetch touch by id")
    return await res.json()
  } catch (err) {
    console.error("Fetch touch by id error:", err)
    return null
  }
}

export async function logTouch({
  contact_id,
  touch_type = "email",
  subject = "",
  body = "",
  metadata = {},
  cadence_id = null,
}) {
  try {
    const touchPayload = {
      contact_id,
      touched_at: new Date().toISOString(),
      touch_type,
      subject,
      body,
      metadata: JSON.stringify(metadata),
      cadence_id,
    }

    const res = await fetch(`${BASE_URL}/touches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(touchPayload),
    })

    if (!res.ok) throw new Error(`Failed to log ${touch_type} touch`)
    return await res.json()
  } catch (err) {
    console.error(`Log ${touch_type} touch error:`, err)
    throw err
  }
}
