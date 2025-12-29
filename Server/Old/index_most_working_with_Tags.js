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
    // Join contacts with tags via contact_tags and aggregate tags as JSON array
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

app.post('/contacts', async (req, res) => {
  const { company, first_name, last_name, title, linkedin_url, email, mobile_phone, tag_ids } = req.body;

  try {
    // Insert contact, returning id
    const insertContactQuery = `
      INSERT INTO contacts (company, first_name, last_name, title, linkedin_url, email, mobile_phone)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;
    const contactResult = await pool.query(insertContactQuery, [company, first_name, last_name, title, linkedin_url, email, mobile_phone]);
    const contactId = contactResult.rows[0].id;

    // If tags provided, insert into contact_tags
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

    // Update tags for contact:
    // Delete existing tags and re-insert new tags (if any)
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
    // Delete tags assignment first (foreign key constraint)
    await pool.query('DELETE FROM contact_tags WHERE contact_id = $1', [id]);

    // Delete contact
    await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
    res.send('Contact deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete contact');
  }
});

// ----------------------
// Tags endpoints

// Get all tags
app.get('/tags', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tags ORDER BY tag_name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error fetching tags');
  }
});

// Create a tag
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
      // Unique violation
      res.status(400).send('Tag name already exists');
    } else {
      console.error(err);
      res.status(500).send('Failed to create tag');
    }
  }
});

// Update tag name
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

// Delete tag
app.delete('/tags/:tag_id', async (req, res) => {
  const { tag_id } = req.params;
  try {
    // Remove from contact_tags first (FK constraint)
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
// Contact tags assignment endpoints (optional: get tags for a contact)

// Get tags assigned to a contact
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

// ----------------------
// Email and touches endpoints (unchanged, your original code)

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
