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

// ----------------------
// CADENCES
// ----------------------

export async function fetchCadences() {
  try {
    const res = await fetch(`${BASE_URL}/cadences`)
    if (!res.ok) throw new Error("Failed to fetch cadences")
    return await res.json()
  } catch (err) {
    console.error("Fetch cadences error:", err)
    return []
  }
}

export async function createCadence({ name, description }) {
  try {
    const res = await fetch(`${BASE_URL}/cadences`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      // Handle 404 specifically - likely means server needs restart
      if (res.status === 404) {
        throw new Error("Cadence endpoint not found. Please ensure the backend server is running and has been restarted to register the /cadences route.")
      }
      // Try to parse JSON error, otherwise use text
      let errorMessage = "Failed to create cadence"
      try {
        const errorJson = JSON.parse(errorText)
        errorMessage = errorJson.message || errorMessage
      } catch {
        // If errorText contains HTML (like Express error page), provide a generic message
        if (errorText.includes("<!DOCTYPE") || errorText.includes("Cannot POST")) {
          errorMessage = "Server error: The cadence endpoint may not be registered. Please ensure the backend server is running and has been restarted."
        } else {
          errorMessage = errorText || errorMessage
        }
      }
      throw new Error(errorMessage)
    }
    return await res.json()
  } catch (err) {
    console.error("Create cadence error:", err)
    throw err
  }
}

export async function fetchCadenceSteps(cadenceId) {
  try {
    const res = await fetch(`${BASE_URL}/cadences/${cadenceId}/steps`)
    if (!res.ok) throw new Error("Failed to fetch cadence steps")
    return await res.json()
  } catch (err) {
    console.error("Fetch cadence steps error:", err)
    return []
  }
}

export async function createCadenceStep(cadenceId, { step_order, day_number, step_label, action_type, action_value }) {
  try {
    const res = await fetch(`${BASE_URL}/cadences/${cadenceId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        step_order,
        day_number: day_number || 0,
        step_label,
        action_type: action_type || 'task',
        action_value: action_value || null,
      }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || "Failed to create cadence step")
    }
    return await res.json()
  } catch (err) {
    console.error("Create cadence step error:", err)
    throw err
  }
}

export async function deleteCadenceStep(stepId) {
  try {
    const res = await fetch(`${BASE_URL}/cadence-steps/${stepId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || "Failed to delete cadence step")
    }
    const contentType = res.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await res.json()
    }
    return { success: true }
  } catch (err) {
    console.error("Delete cadence step error:", err)
    throw err
  }
}

export async function fetchCadenceContacts(cadenceId) {
  try {
    const res = await fetch(`${BASE_URL}/cadences/${cadenceId}/contacts`)
    if (!res.ok) throw new Error("Failed to fetch cadence contacts")
    return await res.json()
  } catch (err) {
    console.error("Fetch cadence contacts error:", err)
    return []
  }
}

export async function fetchAllCadenceContacts(cadenceId) {
  try {
    const res = await fetch(`${BASE_URL}/cadences/${cadenceId}/contacts/all`)
    if (!res.ok) throw new Error("Failed to fetch all cadence contacts")
    return await res.json()
  } catch (err) {
    console.error("Fetch all cadence contacts error:", err)
    return []
  }
}

export async function fetchTouchesByContactAndCadence(cadenceId, contactId) {
  try {
    const res = await fetch(`${BASE_URL}/cadences/${cadenceId}/contacts/${contactId}/touches`)
    if (!res.ok) throw new Error("Failed to fetch touches by contact and cadence")
    return await res.json()
  } catch (err) {
    console.error("Fetch touches by contact and cadence error:", err)
    return []
  }
}

export async function addContactToCadence(cadenceId, contactId) {
  try {
    const res = await fetch(`${BASE_URL}/cadences/${cadenceId}/contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact_id: contactId }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || "Failed to add contact to cadence")
    }
    const contentType = res.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      return await res.json()
    } else {
      // Handle non-JSON responses (e.g., 201 Created with no body)
      return { success: true }
    }
  } catch (err) {
    console.error("Add contact to cadence error:", err)
    throw err
  }
}

export async function removeContactFromCadence(contactCadenceId) {
  try {
    const res = await fetch(`${BASE_URL}/contact-cadences/${contactCadenceId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || "Failed to remove contact from cadence")
    }
    return { success: true }
  } catch (err) {
    console.error("Remove contact from cadence error:", err)
    throw err
  }
}

export async function skipCadenceStep(contactCadenceId, cadenceStepId) {
  try {
    const res = await fetch(`${BASE_URL}/contact-cadences/${contactCadenceId}/skip-step`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cadence_step_id: cadenceStepId }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || "Failed to skip step")
    }
    return await res.json()
  } catch (err) {
    console.error("Skip cadence step error:", err)
    throw err
  }
}

export async function completeCadenceStep(contactCadenceId, cadenceStepId) {
  try {
    const res = await fetch(`${BASE_URL}/contact-cadences/${contactCadenceId}/complete-step`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cadence_step_id: cadenceStepId }),
    })
    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(errorText || "Failed to complete step")
    }
    return await res.json()
  } catch (err) {
    console.error("Complete cadence step error:", err)
    throw err
  }
}

export async function postponeCadenceStep(contactCadenceId, cadenceStepId, newDueOn) {
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:337',message:'postponeCadenceStep API function called',data:{contactCadenceId:contactCadenceId,cadenceStepId:cadenceStepId,newDueOn:newDueOn},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  const res = await fetch(
    `${BASE_URL}/contact-cadences/${contactCadenceId}/postpone-step`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cadence_step_id: cadenceStepId,
        new_due_on: newDueOn,
      }),
    }
  );
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:349',message:'postponeCadenceStep fetch response received',data:{ok:res.ok,status:res.status,statusText:res.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion

  if (!res.ok) {
    const text = await res.text();
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:352',message:'postponeCadenceStep error response',data:{status:res.status,errorText:text},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion
    throw new Error(text || "Failed to postpone step");
  }

  const result = await res.json();
  // #region agent log
  fetch('http://127.0.0.1:7243/ingest/dceac54d-072c-487e-97d1-c96838cd6875',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.js:356',message:'postponeCadenceStep success response',data:{result:result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  return result;
}


export async function fetchCadenceById(cadenceId) {
  try {
    const cadences = await fetchCadences()
    return cadences.find(c => c.id === cadenceId) || null
  } catch (err) {
    console.error("Fetch cadence by id error:", err)
    return null
  }
}

export async function fetchContactCadenceSteps(contactCadenceId) {
  try {
    const res = await fetch(`${BASE_URL}/contact-cadences/${contactCadenceId}/steps`)
    if (!res.ok) throw new Error("Failed to fetch contact cadence steps")
    return await res.json()
  } catch (err) {
    console.error("Fetch contact cadence steps error:", err)
    throw err
  }
}

export async function fetchCadenceHistory(contactCadenceId, offset = 0, limit = 20) {
  try {
    const res = await fetch(
      `${BASE_URL}/contact-cadences/${contactCadenceId}/history?offset=${offset}&limit=${limit}`
    )
    if (!res.ok) throw new Error("Failed to fetch cadence history")
    return await res.json()
  } catch (err) {
    console.error("Fetch cadence history error:", err)
    throw err
  }
}

export async function fetchCadenceHistoryByContactAndCadence(cadenceId, contactId, offset = 0, limit = 20) {
  try {
    const res = await fetch(
      `${BASE_URL}/cadences/${cadenceId}/contacts/${contactId}/history?offset=${offset}&limit=${limit}`
    )
    if (!res.ok) throw new Error("Failed to fetch cadence history")
    return await res.json()
  } catch (err) {
    console.error("Fetch cadence history by contact and cadence error:", err)
    throw err
  }
}

export async function deleteCadence(cadenceId) {
  try {
    // #region agent log
    console.log('[DEBUG] deleteCadence API call', { cadenceId, url: `${BASE_URL}/cadences/${cadenceId}` });
    // #endregion

    const res = await fetch(`${BASE_URL}/cadences/${cadenceId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    })

    // #region agent log
    console.log('[DEBUG] deleteCadence response', { 
      cadenceId, 
      ok: res.ok, 
      status: res.status, 
      statusText: res.statusText,
      contentType: res.headers.get("content-type")
    });
    // #endregion

    if (!res.ok) {
      const errorText = await res.text()
      // #region agent log
      console.log('[DEBUG] deleteCadence error response', { cadenceId, errorText, status: res.status });
      // #endregion
      throw new Error(errorText || "Failed to delete cadence")
    }
    const contentType = res.headers.get("content-type")
    if (contentType && contentType.includes("application/json")) {
      const jsonData = await res.json()
      // #region agent log
      console.log('[DEBUG] deleteCadence success', { cadenceId, jsonData });
      // #endregion
      return jsonData
    } else {
      // #region agent log
      console.log('[DEBUG] deleteCadence success (non-JSON)', { cadenceId });
      // #endregion
      return { success: true }
    }
  } catch (err) {
    // #region agent log
    console.error('[DEBUG] deleteCadence exception', { cadenceId, error: err.message, stack: err.stack });
    // #endregion
    console.error("Delete cadence error:", err)
    throw err
  }
}
