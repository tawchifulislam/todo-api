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

app.get('/tasks', (req, res) => {
  const allTasks = db.prepare('SELECT * FROM tasks').all();
  const formatted = allTasks.map(t => ({ ...t, done: !!t.done }));
  res.json(formatted);
});

app.get('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }
  res.json({ ...task, done: !!task.done });
});

// Stage 3- Create: Add a new task

app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === '') {
    return res
      .status(400)
      .json({ error: 'title is required and cannot be empty' });
  }

  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const result = insert.run(title.trim(), 0);

  const newTask = {
    id: result.lastInsertRowid,
    title: title.trim(),
    done: false,
  };

  res.status(201).json(newTask);
});

// Stage 4- Update & Delete

app.put('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

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

  db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(
    task.title,
    task.done ? 1 : 0,
    taskId,
  );

  res.json({ ...task, done: !!task.done });
});

app.delete('/tasks/:id', (req, res) => {
  const taskId = parseInt(req.params.id);
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);

  if (!task) {
    return res.status(404).json({ error: `Task ${taskId} not found` });
  }

  db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
