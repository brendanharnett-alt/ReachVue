require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const nodemailer = require('nodemailer');
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
  user: 'postgres',
  host: 'localhost',
  database: 'fullcycle',
  password: 'nightclub@1',
  port: 5432,
});

// ----------------------
// Contacts endpoints
// GET contacts with assigned tags included as array
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

// Get a single contact by ID
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
app.get('/tags', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tags ORDER BY tag_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching tags');
  }
});

// *** New endpoint: get tags with contact counts ***
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

// *** New endpoint: get contacts by tag with pagination and last touched date ***
app.get('/tags/:tag_id/contacts', async (req, res) => {
  const { tag_id } = req.params;
  const limit = parseInt(req.query.limit, 10) || 50;   // default 50
  const offset = parseInt(req.query.offset, 10) || 0;  // default 0

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
// Contact tags assignment endpoints
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

// Batch assign tags
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

// Batch unassign tags
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
// Email and touches endpoints (unchanged)

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

app.post('/touches', async (req, res) => {
  const { contact_id, touched_at, touch_type, subject, body, metadata, cadence_id } = req.body;
  if (!contact_id || !touch_type) {
    return res.status(400).send("Missing required fields: contact_id and touch_type");
  }
  try {
    const result = await pool.query(
      `INSERT INTO touches
       (contact_id, touched_at, touch_type, subject, body, metadata, created_at, cadence_id)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7)
       RETURNING *`,
      [contact_id, touched_at, touch_type, subject, body, metadata || null, cadence_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error inserting touch:', err);
    res.status(500).send('Failed to log touch');
  }
});

app.get('/touches', async (req, res) => {
  const { contact_id } = req.query;
  try {
    let query = 'SELECT * FROM touches';
    let params = [];
    if (contact_id) {
      query += ' WHERE contact_id = $1';
      params.push(contact_id);
    }
    query += ' ORDER BY touched_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching touches:', err);
    res.status(500).send('Server error');
  }
});

app.put('/touches/:id', async (req, res) => {
  const { id } = req.params;
  const { contact_id, touched_at, touch_type, subject, body, metadata, cadence_id } = req.body;
  try {
    const result = await pool.query(
      `UPDATE touches SET contact_id = $1, touched_at = $2, touch_type = $3, subject = $4,
       body = $5, metadata = $6, cadence_id = $7 WHERE id = $8 RETURNING *`,
      [contact_id, touched_at, touch_type, subject, body, metadata || null, cadence_id || null, id]
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


app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
