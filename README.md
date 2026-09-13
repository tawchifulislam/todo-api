# Task API

A small **in-memory CRUD API** built with Node.js and Express. It manages a to-do list - you can create, read, update, and delete tasks. Data is stored in memory, so it resets whenever the server restarts (no database yet).

## How to run

```bash
git clone https://github.com/tawchifulislam/todo-api.git
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

## AI vs Me

I hand-built the API in `index.js` (Stages 0–6). For Stage 7, I gave an AI the same starting code and asked it to rewrite it in a better way, with the same features. Its version is in `ai-version/`.

**Prompt used:**
> Use node and express make a simple crud for todo-api. use as a example i write down in this chat, make this code far more better way. and data will be in-memory. and i also need swagger ui for try it out. index.js, openapi.json i need this two file. [+ my Stage 0–6 code]

**What the AI did better:**

- Pulled repeated "find task or return 404" logic into one helper function (`findTaskOrFail`) instead of repeating the same code in every route.
- Used a `nextId` counter for new task ids instead of recalculating the max id every time.

**What it changed or added without being asked:**

- Added a catch-all 404 handler for unknown routes - I never asked for this in my prompt.
- Changed `const tasks` to `let tasks` - not necessary for how the array is used, since only `.push()`/`.splice()` are called.

**What my prompt didn't specify:**

- I didn't mention exact error messages, so the AI kept mine as-is (since I gave it my code as an example) instead of inventing its own wording.
- I didn't specify how to generate new ids, so it chose a counter variable instead of my `Math.max(...)` approach.

**One-sentence takeaway:** A more detailed prompt (naming the id-generation rule and saying "no extra routes") would have made the AI's output match mine more closely.
