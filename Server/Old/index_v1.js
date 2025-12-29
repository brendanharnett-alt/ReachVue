const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

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

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});