# Task API

A small **in-memory CRUD API** built with Node.js and Express. It manages a to-do list - you can create, read, update, and delete tasks. Data is stored in memory, so it resets whenever the server restarts (no database yet).

## How to run

```bash
git clone https://github.com/<your-username>/todo-api.git
cd todo-api
npm install
node index.js
```

The server will start on `http://localhost:3000`.

## Endpoints

| Method | Path | Description |
| --- | --- | --- |
| GET | `/` | API name and list of endpoints |
| GET | `/health` | Health check - confirms the server is running |
| GET | `/tasks` | List all tasks |
| GET | `/tasks/:id` | Get a single task |
| POST | `/tasks` | Create a new task |
| PUT | `/tasks/:id` | Update a task (title and/or done) |
| DELETE | `/tasks/:id` | Delete a task |

## Status codes

| Code | When |
| --- | --- |
| 200 | Successful GET / PUT |
| 201 | Task successfully created (POST) |
| 204 | Task successfully deleted |
| 400 | Invalid or incomplete request body |
| 404 | Task id not found |

## Example

```console
$ curl -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" -d '{"title":"Buy milk"}'
HTTP/1.1 201 Created
X-Powered-By: Express
Content-Type: application/json; charset=utf-8
Content-Length: 40

{"id":4,"title":"Buy milk","done":false}
```

## Swagger UI

With the server running, visit `http://localhost:3000/docs` to view and test all endpoints interactively via "Try it out".

![Swagger UI](swagger-screenshot.png)

## Notes

- Data lives only in memory (a plain array) - it's lost on every server restart. Demonstrating this limitation of in-memory storage (without a database).
