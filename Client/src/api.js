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
  track_opens = false,
  track_clicks = false,
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
      track_opens,
      track_clicks,
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

export async function signLink(email_id, original_url, link_index) {
  try {
    const res = await fetch(`${BASE_URL}/api/email/sign-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email_id,
        original_url,
        link_index,
      }),
    })

    if (!res.ok) throw new Error("Failed to sign link")
    const data = await res.json()
    return data.signature
  } catch (err) {
    console.error("Sign link error:", err)
    throw err
  }
}
