require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const nodemailer = require('nodemailer');
console.log('SMTP creds:', process.env.EMAIL_USER, !!process.env.EMAIL_PASS);
const transporter = nodemailer.createTransport({
  host:   'smtp.office365.com',   // or your provider’s SMTP host
  port:    587,
  secure:  false,                 // use STARTTLS
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

app.get('/contacts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contacts ORDER BY id ASC');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

app.post('/contacts', async (req, res) => {
  const { company, first_name, last_name, title, linkedin_url, email, mobile_phone } = req.body;
  try {
    await pool.query(
      'INSERT INTO contacts (company, first_name, last_name, title, linkedin_url, email, mobile_phone) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [company, first_name, last_name, title, linkedin_url, email, mobile_phone]
    );
    res.status(201).send('Contact added');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add contact');
  }
});

app.delete('/contacts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contacts WHERE id = $1', [id]);
    res.send('Contact deleted');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete contact');
  }

app.put("/contacts/:id", async (req, res) => {
  const { id } = req.params;
  const { company, first_name, last_name, title, linkedin_url, email, mobile_phone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE contacts SET company = $1, first_name = $2, last_name = $3, title = $4,
       linkedin_url = $5, email = $6, mobile_phone = $7 WHERE id = $8 RETURNING *`,
      [company, first_name, last_name, title, linkedin_url, email, mobile_phone, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Contact not found.");
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating contact.");
  }
});


});

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