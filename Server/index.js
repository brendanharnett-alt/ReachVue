require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const nodemailer = require('nodemailer');

const crypto = require("crypto");

const TRACKING_SIGNING_SECRET = process.env.TRACKING_SIGNING_SECRET;
const CURRENT_USER_ID ='b3228327-bf68-45d9-a0e1-61736130b1ca';

function signEmailId(emailId) {
  return crypto
    .createHmac("sha256", TRACKING_SIGNING_SECRET)
    .update(emailId)
    .digest("hex");
}

console.log('SMTP creds:', process.env.EMAIL_USER, !!process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


// ----------------------
// Contacts endpoints
// ----------------------

app.get('/contacts', async (req, res) => {
  try {
    const query = `
      SELECT c.*,
        COALESCE(json_agg(json_build_object('tag_id', t.tag_id, 'tag_name', t.tag_name))
                 FILTER (WHERE t.tag_id IS NOT NULL), '[]') AS tags
      FROM contacts c
      LEFT JOIN contact_tags ct ON ct.contact_id = c.id
      LEFT JOIN tags t ON t.tag_id = ct.tag_id
      GROUP BY c.id
      ORDER BY c.id ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching contacts');
  }
});

app.get('/contacts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM contacts WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).send('Contact not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching contact by ID:', err);
    res.status(500).send('Server error');
  }
});

app.post('/contacts', async (req, res) => {
  const { company, first_name, last_name, title, linkedin_url, email, mobile_phone, tag_ids } = req.body;

  try {
    const insertContactQuery = `
      INSERT INTO contacts (company, first_name, last_name, title, linkedin_url, email, mobile_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const contactResult = await pool.query(insertContactQuery, [company, first_name, last_name, title, linkedin_url, email, mobile_phone]);
    const contactId = contactResult.rows[0].id;

    if (Array.isArray(tag_ids) && tag_ids.length > 0) {
      const insertTagsQuery = `
        INSERT INTO contact_tags (contact_id, tag_id)
        VALUES ${tag_ids.map((_, i) => `($1, $${i + 2})`).join(',')}
        ON CONFLICT DO NOTHING
      `;
      await pool.query(insertTagsQuery, [contactId, ...tag_ids]);
    }

    res.status(201).send('Contact added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add contact');
  }
});

app.put('/contacts/:id', async (req, res) => {
  const { id } = req.params;
  const { company, first_name, last_name, title, linkedin_url, email, mobile_phone, tag_ids } = req.body;

  try {
    const updateContactQuery = `
      UPDATE contacts SET company=$1, first_name=$2, last_name=$3, title=$4,
      linkedin_url=$5, email=$6, mobile_phone=$7 WHERE id=$8 RETURNING *
    `;
    const result = await pool.query(updateContactQuery, [company, first_name, last_name, title, linkedin_url, email, mobile_phone, id]);

    if (result.rowCount === 0) return res.status(404).send("Contact not found.");

    await pool.query('DELETE FROM contact_tags WHERE contact_id = $1', [id]);

    if (Array.isArray(tag_ids) && tag_ids.length > 0) {
      const insertTagsQuery = `
        INSERT INTO contact_tags (contact_id, tag_id)
        VALUES ${tag_ids.map((_, i) => `($1, $${i + 2})`).join(',')}
        ON CONFLICT DO NOTHING
      `;
      await pool.query(insertTagsQuery, [id, ...tag_ids]);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating contact.");
  }
});

app.delete('/contacts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contact_tags WHERE contact_id = $1', [id]);
    await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
    res.send('Contact deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete contact');
  }
});

// ----------------------
// Tags endpoints
// ----------------------

app.get('/tags', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tags ORDER BY tag_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching tags');
  }
});

app.get('/tags-with-counts', async (req, res) => {
  try {
    const query = `
      SELECT t.tag_id, t.tag_name, COUNT(ct.contact_id) AS contact_count
      FROM tags t
      LEFT JOIN contact_tags ct ON t.tag_id = ct.tag_id
      GROUP BY t.tag_id, t.tag_name
      ORDER BY t.tag_name ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching tags with counts:', err);
    res.status(500).send('Server error fetching tags');
  }
});

app.get('/tags/:tag_id/contacts', async (req, res) => {
  const { tag_id } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    const query = `
      SELECT c.*,
        COALESCE(MAX(t.touched_at), NULL) AS last_touched_at
      FROM contacts c
      INNER JOIN contact_tags ct ON c.id = ct.contact_id
      LEFT JOIN touches t ON c.id = t.contact_id
      WHERE ct.tag_id = $1
      GROUP BY c.id
      ORDER BY c.last_name, c.first_name
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [tag_id, limit, offset]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching contacts for tag:', err);
    res.status(500).send('Failed to fetch contacts');
  }
});

app.post('/tags', async (req, res) => {
  const { tag_name } = req.body;
  if (!tag_name || !tag_name.trim()) return res.status(400).send('Tag name is required');
  try {
    const result = await pool.query(
      'INSERT INTO tags (tag_name) VALUES ($1) RETURNING *',
      [tag_name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).send('Tag name already exists');
    } else {
      console.error(err);
      res.status(500).send('Failed to create tag');
    }
  }
});

app.put('/tags/:tag_id', async (req, res) => {
  const { tag_id } = req.params;
  const { tag_name } = req.body;
  if (!tag_name || !tag_name.trim()) return res.status(400).send('Tag name is required');
  try {
    const result = await pool.query(
      'UPDATE tags SET tag_name = $1 WHERE tag_id = $2 RETURNING *',
      [tag_name.trim(), tag_id]
    );
    if (result.rowCount === 0) return res.status(404).send('Tag not found');
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      res.status(400).send('Tag name already exists');
    } else {
      console.error(err);
      res.status(500).send('Failed to update tag');
    }
  }
});

app.delete('/tags/:tag_id', async (req, res) => {
  const { tag_id } = req.params;
  try {
    await pool.query('DELETE FROM contact_tags WHERE tag_id = $1', [tag_id]);
    const result = await pool.query('DELETE FROM tags WHERE tag_id = $1', [tag_id]);
    if (result.rowCount === 0) return res.status(404).send('Tag not found');
    res.send('Tag deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete tag');
  }
});

// ----------------------
// Contact Tags Assignments
// ----------------------

app.get('/contacts/:id/tags', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT t.tag_id, t.tag_name
       FROM tags t
       INNER JOIN contact_tags ct ON t.tag_id = ct.tag_id
       WHERE ct.contact_id = $1
       ORDER BY t.tag_name ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to fetch contact tags');
  }
});

app.post('/contact-tags/assign', async (req, res) => {
  const { contact_ids, tag_ids } = req.body;

  if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
    return res.status(400).send("contact_ids array is required");
  }
  if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
    return res.status(400).send("tag_ids array is required");
  }

  const values = [];
  const params = [];
  let paramIndex = 1;

  for (const contactId of contact_ids) {
    for (const tagId of tag_ids) {
      params.push(contactId, tagId);
      values.push(`($${paramIndex++}, $${paramIndex++})`);
    }
  }

  const query = `
    INSERT INTO contact_tags (contact_id, tag_id)
    VALUES ${values.join(', ')}
    ON CONFLICT DO NOTHING
  `;

  try {
    await pool.query(query, params);
    res.send('Tags assigned successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to assign tags');
  }
});

app.post('/contact-tags/unassign', async (req, res) => {
  const { contact_ids, tag_ids } = req.body;

  if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
    return res.status(400).send("contact_ids array is required");
  }
  if (!Array.isArray(tag_ids) || tag_ids.length === 0) {
    return res.status(400).send("tag_ids array is required");
  }

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  for (const contactId of contact_ids) {
    for (const tagId of tag_ids) {
      conditions.push(`(contact_id = $${paramIndex++} AND tag_id = $${paramIndex++})`);
      params.push(contactId, tagId);
    }
  }

  const query = `
    DELETE FROM contact_tags
    WHERE ${conditions.join(' OR ')}
  `;

  try {
    await pool.query(query, params);
    res.send('Tags unassigned successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to unassign tags');
  }
});

// ----------------------
// Email + Touches
// ----------------------

app.post('/send-email', async (req, res) => {
  const { to, subject, body } = req.body;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: body
    });
    res.sendStatus(200);
  } catch (err) {
    console.error('Email send error:', err);
    res.status(500).send(err.toString());
  }
});

// ----------------------
// ⭐ UPDATED: Touch creation with thread_id + parent_touch_id
// ----------------------

app.post('/touches', async (req, res) => {
  const { contact_id, touched_at, touch_type, subject, body, metadata, cadence_id, thread_id, parent_touch_id, track_opens, track_clicks } = req.body;

  // #region agent log
  const fs = require('fs');
  const logPath = 'c:\\ReachVue\\.cursor\\debug.log';
  const logEntry = JSON.stringify({location:'Server/index.js:379',message:'POST /touches entry',data:{touch_type,track_opens,track_clicks,hasContactId:!!contact_id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'}) + '\n';
  fs.appendFileSync(logPath, logEntry);
  // #endregion

  if (!contact_id || !touch_type) {
    return res.status(400).send("Missing required fields: contact_id and touch_type");
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO touches
      (contact_id, touched_at, touch_type, subject, body, metadata, created_at, cadence_id, thread_id, parent_touch_id)
      VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9)
      RETURNING *
      `,
      [
        contact_id,
        touched_at,
        touch_type,
        subject,
        body,
        metadata || null,
        cadence_id || null,
        thread_id || null,
        parent_touch_id || null
      ]
    );

    const touch = result.rows[0];

    // #region agent log
    const logEntry2 = JSON.stringify({location:'Server/index.js:407',message:'Touch created, evaluating tracking',data:{touch_id:touch.id,touch_type,track_opens,track_clicks,isEmail:touch_type==='email',hasTouchId:!!touch.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'}) + '\n';
    fs.appendFileSync(logPath, logEntry2);
    // #endregion

    // Return tracking metadata if this is an email and tracking is enabled
    const isEmail = touch_type === "email";
    const hasTrackOpens = track_opens === true;
    const hasTrackClicks = track_clicks === true;
    const hasTouchId = !!touch.id;

    if (isEmail && hasTouchId && (hasTrackOpens || hasTrackClicks)) {
      const emailId = touch.id.toString();
      const tracking = {
        email_id: emailId
      };

      // Add signature for open tracking
      if (hasTrackOpens) {
        tracking.signature = signEmailId(emailId);
      }

      // #region agent log
      const logEntry3 = JSON.stringify({location:'Server/index.js:420',message:'Returning touch with tracking metadata',data:{email_id:emailId,hasOpens:hasTrackOpens,hasClicks:hasTrackClicks,hasSignature:!!tracking.signature},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n';
      fs.appendFileSync(logPath, logEntry3);
      // #endregion

      res.status(201).json({
        ...touch,
        email_id: emailId, // Also include at top level for click tracking
        tracking
      });
    } else {
      // #region agent log
      const logEntry4 = JSON.stringify({location:'Server/index.js:430',message:'Returning touch without tracking',data:{reason:!isEmail?'not email':!hasTouchId?'no touch id':(!hasTrackOpens && !hasTrackClicks)?'no tracking enabled':'unknown'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'}) + '\n';
      fs.appendFileSync(logPath, logEntry4);
      // #endregion
      res.status(201).json(touch);
    }
  } catch (err) {
    console.error('Error inserting touch:', err);
    res.status(500).send('Failed to log touch');
  }
});

// ----------------------
// ⭐ UPDATED paginated touches endpoint
// ----------------------

app.get('/touches', async (req, res) => {
  const { contact_id } = req.query;

  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  if (!contact_id) {
    return res.status(400).send("contact_id is required");
  }

  try {
    const totalResult = await pool.query(
      'SELECT COUNT(*) FROM touches WHERE contact_id = $1',
      [contact_id]
    );
    const total = parseInt(totalResult.rows[0].count, 10);

    const touchesResult = await pool.query(
      `
        SELECT *
        FROM touches
        WHERE contact_id = $1
        ORDER BY touched_at DESC
        LIMIT $2 OFFSET $3
      `,
      [contact_id, limit, offset]
    );

    res.json({
      touches: touchesResult.rows,
      offset,
      limit,
      total,
      hasOlder: offset + limit < total,
      hasNewer: offset > 0
    });

  } catch (err) {
    console.error('Error fetching paginated touches:', err);
    res.status(500).send('Server error fetching touches');
  }
});

// ----------------------
// ⭐ UPDATED: Touch update with thread fields
// ----------------------

app.put('/touches/:id', async (req, res) => {
  const { id } = req.params;
  const { contact_id, touched_at, touch_type, subject, body, metadata, cadence_id, thread_id, parent_touch_id } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE touches SET
        contact_id = $1,
        touched_at = $2,
        touch_type = $3,
        subject = $4,
        body = $5,
        metadata = $6,
        cadence_id = $7,
        thread_id = $8,
        parent_touch_id = $9
      WHERE id = $10
      RETURNING *
      `,
      [
        contact_id,
        touched_at,
        touch_type,
        subject,
        body,
        metadata || null,
        cadence_id || null,
        thread_id || null,
        parent_touch_id || null,
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Touch not found");
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Error updating touch:', err);
    res.status(500).send('Failed to update touch');
  }
});

app.delete('/touches/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM touches WHERE id = $1', [id]);
    res.send('Touch deleted');
  } catch (err) {
    console.error('Error deleting touch:', err);
    res.status(500).send('Failed to delete touch');
  }
});

app.get('/touches/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM touches WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      return res.status(404).send('Touch not found');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching touch by ID:', err);
    res.status(500).send('Server error');
  }
});

// ----------------------

// ----------------------
// Templates Endpoints
// ----------------------

app.get('/templates', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM templates ORDER BY updated_at DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching templates:', err);
    res.status(500).send('Failed to fetch templates');
  }
});

app.get('/templates/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM templates WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).send('Template not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching template by ID:', err);
    res.status(500).send('Server error fetching template');
  }
});

app.post('/templates', async (req, res) => {
  const { user_id, name, type, subject, body, variables } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO templates (user_id, name, type, subject, body, variables, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [user_id || null, name, type, subject, body, variables || []]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating template:', err);
    res.status(500).send('Failed to create template');
  }
});

app.put('/templates/:id', async (req, res) => {
  const { id } = req.params;
  const { name, type, subject, body, variables } = req.body;
  try {
    const result = await pool.query(
      `UPDATE templates
       SET name=$1, type=$2, subject=$3, body=$4, variables=$5, updated_at=NOW()
       WHERE id=$6
       RETURNING *`,
      [name, type, subject, body, variables || [], id]
    );
    if (result.rowCount === 0) return res.status(404).send('Template not found');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating template:', err);
    res.status(500).send('Failed to update template');
  }
});

app.delete('/templates', async (req, res) => {
  const { ids } = req.body; // expects an array of template IDs
  try {
    if (!Array.isArray(ids) || ids.length === 0)
      return res.status(400).send('No template IDs provided');
    await pool.query('DELETE FROM templates WHERE id = ANY($1::uuid[])', [ids]);
    res.send('Templates deleted successfully');
  } catch (err) {
    console.error('Error deleting templates:', err);
    res.status(500).send('Failed to delete templates');
  }
});



// ----------------------- Open/Click Activity Endpoints

app.get("/api/email/:emailId/activity-summary", async (req, res) => {
  const { emailId } = req.params;

  try {
    const { rows } = await pool.query(
      `
      SELECT
        COUNT(*) FILTER (WHERE event_type = 'open')  AS open_count,
        COUNT(*) FILTER (WHERE event_type = 'click') AS click_count,
        MAX(created_at)                              AS last_activity_at
      FROM email_events
      WHERE email_id = $1
      `,
      [emailId]
    );

    const row = rows[0];

    res.json({
      emailId,
      openCount: Number(row.open_count),
      clickCount: Number(row.click_count),
      lastActivityAt: row.last_activity_at,
    });
  } catch (err) {
    console.error("email activity summary error", err);
    res.status(500).json({ error: "Failed to load email activity summary" });
  }
});

app.get("/api/activity", async (req, res) => {
  const emailId = req.query.emailId || null;
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  try {
    const { rows } = await pool.query(
      `
      SELECT
        event_type,
        email_id,
        metadata,
        created_at
      FROM email_events
      WHERE ($1::text IS NULL OR email_id = $1)
      ORDER BY created_at DESC
      LIMIT $2
      `,
      [emailId, limit]
    );

    res.json(rows);
  } catch (err) {
    console.error("activity stream error", err);
    res.status(500).json({ error: "Failed to load activity stream" });
  }
});

app.post("/api/email/activity-summary", async (req, res) => {
  try {
    const { emailIds } = req.body;

    if (!Array.isArray(emailIds) || emailIds.length === 0) {
      return res.status(400).json({ error: "emailIds required" });
    }

    const { rows } = await pool.query(
      `
      SELECT
        email_id,
        COUNT(*) FILTER (WHERE event_type = 'open')  AS open_count,
        COUNT(*) FILTER (WHERE event_type = 'click') AS click_count,
        MAX(created_at)                              AS last_activity_at
      FROM email_events
      WHERE email_id = ANY($1)
      GROUP BY email_id
      `,
      [emailIds]
    );

    res.json(rows);
  } catch (err) {
    console.error("batch activity summary error", err);
    res.status(500).json({ error: "Failed to load batch activity summary" });
  }
});

// Endpoint to sign link data for click tracking
// Signature is calculated by passing "emailId:originalUrl:linkIndex" to signEmailId
app.post("/api/email/sign-link", async (req, res) => {
  try {
    const { email_id, original_url, link_index } = req.body;

    if (!email_id || !original_url || link_index === undefined) {
      return res.status(400).json({ error: "email_id, original_url, and link_index are required" });
    }

    // Format: "emailId:URL being replaced:link index"
    const dataToSign = `${email_id}:${original_url}:${link_index}`;
    const signature = signEmailId(dataToSign);

    res.json({ signature });
  } catch (err) {
    console.error("sign link error", err);
    res.status(500).json({ error: "Failed to sign link" });
  }
});

// Endpoint for Email Signature Tracking
// First endpoing is retrieving the email settings


app.get('/api/user/settings/email', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `
      SELECT
        email_client,
        email_signature_html,
        auto_signature
      FROM users
      WHERE id = $1
      `,
      [CURRENT_USER_ID]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error('Error loading email settings:', err);
    res.status(500).json({ error: 'Failed to load email settings' });
  }
});

app.put('/api/user/settings/email', async (req, res) => {
  try {
    const {
      email_client,
      email_signature_html,
      auto_signature
    } = req.body;

    // Optional light validation (keep it simple)
    if (!email_client) {
      return res.status(400).json({ error: 'email_client is required' });
    }

    await pool.query(
      `
      UPDATE users
      SET
        email_client = $1,
        email_signature_html = $2,
        auto_signature = $3
      WHERE id = $4
      `,
      [
        email_client,
        email_signature_html,
        auto_signature,
        CURRENT_USER_ID
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error saving email settings:', err);
    res.status(500).json({ error: 'Failed to save email settings' });
  }
});

// ----------------------
// Cadences (Phase 1)
// ----------------------

app.post('/cadences', async (req, res) => {
  const { name, description } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).send('Cadence name is required');
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO cadences (name, description, created_at, updated_at)
      VALUES ($1, $2, NOW(), NOW())
      RETURNING *
      `,
      [name.trim(), description || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating cadence:', err);
    res.status(500).send('Failed to create cadence');
  }
});

app.get('/cadences', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM cadences WHERE is_active = true OR is_active IS NULL ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cadences:', err);
    res.status(500).send('Failed to fetch cadences');
  }
});

// DELETE route must come BEFORE more specific routes like /cadences/:cadenceId/steps
app.delete('/cadences/:cadenceId', async (req, res) => {
  const { cadenceId } = req.params;
  
  let client;
  try {
    client = await pool.connect();
  } catch (connectErr) {
    console.error('Failed to get client from pool:', connectErr);
    return res.status(500).send('Failed to connect to database');
  }

  try {
    await client.query('BEGIN');

    // Check if cadence exists
    const checkResult = await client.query(
      `SELECT id, is_active FROM cadences WHERE id = $1`,
      [cadenceId]
    );

    if (checkResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Cadence not found' });
    }

    const currentIsActive = checkResult.rows[0].is_active === true || checkResult.rows[0].is_active === null;
    
    // Update cadence only if it's active or NULL (newly added column)
    // If already inactive, skip update but still process contact memberships (idempotent)
    if (currentIsActive) {
      await client.query(
        `
        UPDATE cadences
        SET is_active = false,
            updated_at = NOW()
        WHERE id = $1
        RETURNING id
        `,
        [cadenceId]
      );
    }

    // End all active contact memberships
    await client.query(
      `
      UPDATE contact_cadences
      SET ended_at = NOW()
      WHERE cadence_id = $1
        AND ended_at IS NULL
      `,
      [cadenceId]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Cadence deleted' });
  } catch (err) {
    try {
      if (client) {
        await client.query('ROLLBACK');
      }
    } catch (rollbackErr) {
      console.error('Rollback error:', rollbackErr);
    }
    console.error('Error deleting cadence:', err);
    res.status(500).send(`Failed to delete cadence: ${err.message}`);
  } finally {
    if (client) {
      client.release();
    }
  }
});

app.post('/cadences/:cadenceId/steps', async (req, res) => {
  const { cadenceId } = req.params;
  const { step_order, day_number, step_label, action_type, action_value } = req.body;

  if (step_order == null || !step_label) {
    return res.status(400).send('step_order and step_label are required');
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO cadence_steps
      (cadence_id, step_order, day_number, step_label, action_type, action_value)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        cadenceId,
        step_order,
        day_number || 0,
        step_label,
        action_type || 'task',
        action_value || null
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error adding cadence step:', err);
    res.status(500).send('Failed to add cadence step');
  }
});

app.put('/cadence-steps/:stepId', async (req, res) => {
  const { stepId } = req.params;
  const { step_order, day_number, step_label, action_type, action_value, is_active } = req.body;

  try {
    const result = await pool.query(
      `
      UPDATE cadence_steps
      SET
        step_order = $1,
        day_number = $2,
        step_label = $3,
        action_type = $4,
        action_value = $5,
        is_active = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
      `,
      [
        step_order,
        day_number,
        step_label,
        action_type,
        action_value,
        is_active !== undefined ? is_active : true,
        stepId
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Cadence step not found');
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating cadence step:', err);
    res.status(500).send('Failed to update cadence step');
  }
});

app.delete('/cadence-steps/:stepId', async (req, res) => {
  const { stepId } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM cadence_steps WHERE id = $1`,
      [stepId]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Cadence step not found');
    }

    res.json({ success: true, message: 'Cadence step deleted' });
  } catch (err) {
    console.error('Error deleting cadence step:', err);
    res.status(500).send('Failed to delete cadence step');
  }
});

app.post('/cadences/:cadenceId/contacts', async (req, res) => {
  const { cadenceId } = req.params;
  const { contact_id } = req.body;

  if (!contact_id) {
    return res.status(400).send('contact_id is required');
  }

  try {
    // Find the first step by day_number (lowest), then step_order (lowest within that day)
    const firstStepResult = await pool.query(
      `
      SELECT step_order
      FROM cadence_steps
      WHERE cadence_id = $1 AND is_active = true
      ORDER BY day_number ASC, step_order ASC
      LIMIT 1
      `,
      [cadenceId]
    );

    const firstStepOrder = firstStepResult.rowCount > 0 ? firstStepResult.rows[0].step_order : 0;

    await pool.query(
      `
      INSERT INTO contact_cadences (
  contact_id,
  cadence_id,
  current_step_order,
  anchor_date
)
VALUES ($1, $2, $3, CURRENT_DATE)
ON CONFLICT DO NOTHING

      `,
      [contact_id, cadenceId, firstStepOrder]
    );

    res.status(201).json({ success: true, message: "Contact added to cadence" });
  } catch (err) {
    console.error('Error adding contact to cadence:', err);
    res.status(500).send('Failed to add contact to cadence');
  }
});

app.post('/cadences/:cadenceId/contacts/bulk', async (req, res) => {
  const { cadenceId } = req.params;
  const { contact_ids } = req.body;

  if (!Array.isArray(contact_ids) || contact_ids.length === 0) {
    return res.status(400).send('contact_ids array is required');
  }

  try {
    // Find the first step by day_number (lowest), then step_order (lowest within that day)
    const firstStepResult = await pool.query(
      `
      SELECT step_order
      FROM cadence_steps
      WHERE cadence_id = $1 AND is_active = true
      ORDER BY day_number ASC, step_order ASC
      LIMIT 1
      `,
      [cadenceId]
    );

    const firstStepOrder = firstStepResult.rowCount > 0 ? firstStepResult.rows[0].step_order : 0;

    await pool.query(
      `
      INSERT INTO contact_cadences (contact_id, cadence_id, current_step_order)
      SELECT unnest($1::int[]), $2, $3
      ON CONFLICT DO NOTHING
      `,
      [contact_ids, cadenceId, firstStepOrder]
    );

    res.sendStatus(201);
  } catch (err) {
    console.error('Error bulk adding contacts to cadence:', err);
    res.status(500).send('Failed to bulk add contacts');
  }
});

app.delete('/contact-cadences/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `
      UPDATE contact_cadences
      SET ended_at = NOW()
      WHERE id = $1 AND ended_at IS NULL
      `,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send('Active contact cadence not found');
    }

    res.send('Contact removed from cadence');
  } catch (err) {
    console.error('Error removing contact from cadence:', err);
    res.status(500).send('Failed to remove contact from cadence');
  }
});

app.put('/contact-cadences/:id/skip-step', async (req, res) => {
  const { id } = req.params; // contact_cadence_id

  try {
    // First, get the current contact_cadence record to find cadence_id and current_step_order
    const contactCadenceResult = await pool.query(
      `SELECT cadence_id, current_step_order FROM contact_cadences WHERE id = $1 AND ended_at IS NULL`,
      [id]
    );

    if (contactCadenceResult.rowCount === 0) {
      return res.status(404).send('Active contact cadence not found');
    }

    const { cadence_id, current_step_order } = contactCadenceResult.rows[0];
    console.log('[SKIP STEP] Current state:', { contact_cadence_id: id, cadence_id, current_step_order });

    // Get all active steps for this cadence, ordered by day_number then step_order
    // This ensures lower day numbers come before higher day numbers
    const stepsResult = await pool.query(
      `
      SELECT id, step_order, day_number, step_label
      FROM cadence_steps
      WHERE cadence_id = $1 AND is_active = true
      ORDER BY day_number ASC, step_order ASC
      `,
      [cadence_id]
    );

    if (stepsResult.rowCount === 0) {
      return res.status(404).send('No active steps found for this cadence');
    }

    const allSteps = stepsResult.rows;
    console.log('[SKIP STEP] All steps (ordered by day_number, step_order):', allSteps.map(s => ({ step_order: s.step_order, day_number: s.day_number, label: s.step_label })));
    
    // Find current step index
    let currentStepIndex = -1;
    if (current_step_order !== null) {
      currentStepIndex = allSteps.findIndex(step => step.step_order === current_step_order);
    }

    console.log('[SKIP STEP] Current step index:', currentStepIndex);

    // Find next step - respect day_number ordering
    let nextStepOrder = null;
    
    if (currentStepIndex === -1) {
      // No current step, move to first step (lowest day_number, lowest step_order)
      nextStepOrder = allSteps[0].step_order;
      console.log('[SKIP STEP] No current step, moving to first:', nextStepOrder);
    } else if (currentStepIndex < allSteps.length - 1) {
      // There's a next step in the sequence (by day_number, then step_order)
      const nextStep = allSteps[currentStepIndex + 1];
      nextStepOrder = nextStep.step_order;
      console.log('[SKIP STEP] Moving to next step:', { 
        from: allSteps[currentStepIndex].step_order, 
        to: nextStepOrder,
        from_day: allSteps[currentStepIndex].day_number,
        to_day: nextStep.day_number
      });
    } else {
      // Already at the last step - stay at current step (don't advance)
      nextStepOrder = current_step_order;
      console.log('[SKIP STEP] Already at last step, staying:', nextStepOrder);
    }

    // Update current_step_order - ONLY for this specific contact_cadence_id
    
    
   
   
    const updateResult = await pool.query(
      `
      UPDATE contact_cadences
      SET
        current_step_order = $1,
        updated_at = NOW()
      WHERE id = $2
        AND ended_at IS NULL
      RETURNING id, contact_id, current_step_order
      `,
      [
        nextStepOrder,
        id
      ]
    );
    
    

    console.log('[SKIP STEP] Update result:', { 
      rowsUpdated: updateResult.rowCount,
      updatedRecord: updateResult.rows[0] 
    });
    
    if (updateResult.rowCount === 0) {
      console.error('[SKIP STEP] No rows updated!', { id, nextStepOrder });
      return res.status(404).send('Contact cadence not found or already ended');
    }

    res.json({ 
      success: true, 
      current_step_order: nextStepOrder,
      message: 'Step advanced successfully' 
    });
  } catch (err) {
    console.error('Error skipping step:', err);
    res.status(500).send('Failed to skip step');
  }
});

app.get('/cadences/:cadenceId/contacts', async (req, res) => {
  const { cadenceId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
  cc.id AS contact_cadence_id,
  c.id AS contact_id,
  c.first_name,
  c.last_name,
  cc.current_step_order,
  cs.step_label,
  cs.day_number,
  cc.anchor_date,
  TO_CHAR(cc.anchor_date + cs.day_number, 'YYYY-MM-DD') AS due_on
FROM contact_cadences cc
JOIN contacts c ON c.id = cc.contact_id
LEFT JOIN cadence_steps cs
  ON cs.cadence_id = cc.cadence_id
 AND cs.step_order = cc.current_step_order
WHERE cc.cadence_id = $1
  AND cc.ended_at IS NULL
ORDER BY c.last_name, c.first_name

      `,
      [cadenceId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cadence contacts:', err);
    res.status(500).send('Failed to fetch cadence contacts');
  }
});

app.get('/cadences/:cadenceId/steps', async (req, res) => {
  const { cadenceId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        id,
        cadence_id,
        step_order,
        day_number,
        step_label,
        action_type,
        action_value,
        is_active,
        created_at,
        updated_at
      FROM cadence_steps
      WHERE cadence_id = $1
        AND is_active = true
      ORDER BY step_order ASC
      `,
      [cadenceId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching cadence steps:', err);
    res.status(500).send('Failed to fetch cadence steps');
  }
});


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});


