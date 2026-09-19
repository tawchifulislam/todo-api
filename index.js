const express = require('express');
const app = express();
const swaggerUi = require('swagger-ui-express');
const openapiDocument = require('./openapi.json');
const PORT = 3001;
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT false
    )
  `);

  const result = await pool.query('SELECT COUNT(*) FROM tasks');
  const count = Number(result.rows[0].count);

  if (count === 0) {
    await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [
      'Buy groceries',
      false,
    ]);
    await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [
      'Walk 1 km',
      true,
    ]);
    await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [
      'Read a book',
      false,
    ]);
  }
}

setupDatabase();

const Database = require('better-sqlite3');
const db = new Database('tasks.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT 0
  )
`);

const count = db.prepare('SELECT COUNT(*) AS count FROM tasks').get().count;

if (count === 0) {
  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  insert.run('Buy groceries', 0);
  insert.run('Walk 1 km', 1);
  insert.run('Read a book', 0);
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
app.use(express.json());

// Stage 1- root and health check endpoints

app.get('/', (req, res) => {
  res.json({ name: 'Task API', version: '1.0', endpoints: ['/tasks'] });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Stage 2- Read: List and Single Task

app.get('/tasks', async (req, res) => {
  const result = await pool.query('SELECT * FROM tasks ORDER BY id');
  res.json(result.rows);
});

app.get('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [
    taskId,
  ]);
  const task = result.rows[0];
  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }
  res.json({ ...task, done: !!task.done });
});

// Stage 3- Create: Add a new task

app.post('/tasks', async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res
      .status(400)
      .json({ error: 'title is required and cannot be empty' });
  }

  const result = await pool.query(
    'INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *',
    [title.trim(), false],
  );

  res.status(201).json(result.rows[0]);
});

// Stage 4- Update & Delete

app.put('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [
    taskId,
  ]);
  const task = result.rows[0];

  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  const { title, done } = req.body;

  if (title === undefined && done === undefined) {
    return res
      .status(400)
      .json({ error: 'request body must include title and/or done' });
  }

  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'title cannot be empty' });
    }
    task.title = title.trim();
  }

  if (done !== undefined) {
    if (typeof done !== 'boolean') {
      return res.status(400).json({ error: 'done must be a boolean' });
    }
    task.done = done;
  }

  await pool.query('UPDATE tasks SET title = $1, done = $2 WHERE id = $3', [
    task.title,
    task.done,
    taskId,
  ]);

  res.json({ ...task, done: !!task.done });
});

app.delete('/tasks/:id', async (req, res) => {
  const taskId = parseInt(req.params.id);
  const result = await pool.query('SELECT * FROM tasks WHERE id = $1', [
    taskId,
  ]);
  const task = result.rows[0];

  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
