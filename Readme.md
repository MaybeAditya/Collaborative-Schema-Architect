# Collaborative Schema Architect

A real-time database schema editor where multiple people can work on the same design and see each other's changes.

**Live Demo:** [collaborative-schema.vercel.app](https://collaborative-schema.vercel.app/)

## Why I built this

This project started with a suggestion from one of my professors, who had previously worked in the IT industry. He encouraged me to explore a problem beyond the usual college projects: how could developers collaborate more naturally when designing database schemas?

That conversation got me thinking about the gap between designing a database visually, writing the SQL behind it, and keeping everyone on the team in sync when changes happen. I wanted to see whether these pieces could come together in one place.

That idea became **Collaborative Schema Architect**.

I built it as a real-time schema editor where multiple users can work on a shared design, see changes synchronize across connected clients, and generate SQL from the schema. Along the way, I explored Yjs, CRDTs, and WebSockets to understand how collaborative applications handle simultaneous edits without constantly overwriting each other's work.

What started as a nudge from my professor turned into an opportunity to learn more about the engineering behind collaborative tools and turn an idea into a deployed, working project.

## What it does

- **Real-time collaboration:** Changes can be synchronized between users connected to the same document.
- **Visual schema editing:** Design database schemas through a graphical interface.
- **Conflict-free updates:** Uses Yjs to help merge concurrent changes to shared document state.
- **SQL generation:** Converts the schema into SQL statements such as `CREATE TABLE` and relationship definitions.
- **Separate frontend and backend:** The interface and synchronization server run independently.

## How it works

The project has three main parts:

- **React + React Flow:** Renders the interface and schema diagram.
- **Yjs + Hocuspocus:** Manages shared document state and synchronizes updates through WebSockets.
- **Node.js:** Runs the collaboration server that connects clients.

When someone edits a shared schema, Yjs tracks the changes and Hocuspocus helps synchronize the document with other connected users.

The frontend is built with Vite and deployed on Vercel. The backend runs as a separate service.

## Tech stack

**Frontend:** React, Vite, React Flow, JavaScript

**Collaboration:** Yjs, Hocuspocus, WebSockets

**Backend:** Node.js

**Deployment:** Vercel (frontend) and Render (backend)

## Run it locally

You'll need Node.js and npm installed.

### 1. Clone the repository

```bash
git clone https://github.com/MaybeAditya/Collaborative-Schema-Architect.git
cd Collaborative-Schema-Architect
```

### 2. Start the backend

Open a terminal and run:

```bash
cd collab-server
npm install
node server.js
```

The server should start on port `1234`, unless your configuration specifies another port.

### 3. Start the frontend

Open a second terminal from the repository root:

```bash
cd collab-client
npm install
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173`.

Make sure the frontend's collaboration URL points to the backend WebSocket server. For local development, this is typically:

```env
VITE_COLLAB_URL=ws://127.0.0.1:1234
```

For production, configure `VITE_COLLAB_URL` in Vercel to use your actual backend WebSocket URL with `wss://`.

## Current limitations

This is a working project, but it is not yet a production-ready database design platform.

- **Data persistence:** The current collaboration server does not provide guaranteed permanent, server-side document storage. If browser-side IndexedDB persistence is enabled, it can retain document state in that browser, but this is not a substitute for server-side storage.
- **Authentication and permissions:** There is no complete authentication and room-level authorization system yet. The application should not be treated as a secure private workspace.
- **SQL support:** Generated SQL should be reviewed before being used against a real database. Different database engines have different syntax and constraints.
- **Reliability:** Reconnection behavior, error handling, and recovery from server failures need more testing.
- **Scaling:** The current deployment is intended for learning and demonstration, not a large number of concurrent users.

## Things I'd like to improve

- Add server-side persistence so saved schemas can be restored after backend restarts.
- Support creating, saving, and reopening multiple named schemas.
- Add authentication and permissions for shared documents.
- Improve SQL validation and support for different database engines.
- Add tests for concurrent edits, reconnections, and document recovery.
- Explore schema version history and change comparisons.

## What I learned

Building this project helped me explore shared state, CRDTs, WebSocket communication, frontend/backend integration, and deploying a real-time application.

It also made me think about an important distinction: synchronizing changes between connected users is not the same as reliably saving those changes for the future.

## Contributing

This project is a learning project, and suggestions or constructive feedback are welcome. Feel free to open an issue to discuss a bug or a possible improvement.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
