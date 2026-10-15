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
- **Column editor:** Rename columns, choose SQL data types, toggle primary-key / NOT NULL constraints, and remove columns.
- **Table management:** Add tables, delete a table from its header, and remove its connected relationships.
- **Shareable rooms:** Open `/room/:id` to collaborate in a separate schema room; copy the room URL to invite others.
- **Presence:** See the collaborators currently connected to the same room.
- **Server-side persistence:** Hocuspocus document lifecycle hooks save binary Yjs state to SQLite and restore it when a room is opened again.
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

**Backend:** Node.js 22.5+, Hocuspocus, SQLite (`node:sqlite`)

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

The server should start on port `1234`, unless your configuration specifies another port. Node.js `22.5+` is required for the built-in SQLite driver. The server creates `collab-server/data/schema-documents.sqlite` automatically.

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

### Rooms and sharing

The root URL opens `/room/main`. Use **New room** to create an isolated room and **Copy room link** to share it. Anyone opening the same `/room/:id` URL joins that schema. Room IDs are identifiers, not access controls: do not put confidential schemas in public rooms until authentication and authorization are implemented.

### Server-side persistence and deployment

SQLite state is saved by the Hocuspocus `onStoreDocument` / `onLoadDocument` hooks. You can override the database file by setting `SQLITE_DATABASE` on the backend, for example:

```env
SQLITE_DATABASE=/var/data/schema-documents.sqlite
```

On a host with ephemeral filesystems, attach a persistent disk and point `SQLITE_DATABASE` at that disk; otherwise the database file may be lost when the service is replaced. SQLite is appropriate for a single backend instance. For multiple backend instances, use a shared database such as Postgres with the Hocuspocus database extension.

### SQL generator tests

The SQL generator is a pure function and has a small Node test suite. The backend also tests SQLite save/restore behavior:

```bash
cd collab-client
npm test

cd ../collab-server
npm test
```

## Current limitations

This is a working project, but it is not yet a production-ready database design platform.

- **Data persistence:** The server persists rooms to SQLite. Durable persistence still depends on the backend host retaining the configured database file; use a persistent disk in production.
- **Authentication and permissions:** There is no complete authentication and room-level authorization system yet. The application should not be treated as a secure private workspace.
- **SQL support:** SQL generation covers common portable types, primary keys, NOT NULL constraints, and simple foreign keys. Generated SQL should be reviewed against your target database engine before use.
- **Reliability:** Reconnection behavior, error handling, and recovery from server failures need more testing.
- **Scaling:** SQLite is a single-instance persistence choice. Horizontal scaling needs shared storage such as Postgres, plus coordinated deployment and authorization.

## Things I'd like to improve

- Add human-readable room names and a room list so people can reopen schemas without keeping a copied URL.
- Add authentication and permissions for shared documents.
- Improve SQL validation and support for different database engines.
- Add multi-client tests for concurrent edits, reconnections, and recovery after backend failures.
- Explore schema version history and change comparisons.

## What I learned

Building this project helped me explore shared state, CRDTs, WebSocket communication, frontend/backend integration, and deploying a real-time application.

It also made me think about an important distinction: synchronizing changes between connected users is not the same as reliably saving those changes for the future.

## Contributing

This project is a learning project, and suggestions or constructive feedback are welcome. Feel free to open an issue to discuss a bug or a possible improvement.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
