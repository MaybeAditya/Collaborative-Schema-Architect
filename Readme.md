# Collaborative Schema Architect

> A real-time, distributed database design engine. Features multi-user conflict-free synchronization (CRDTs/Yjs), live Graph-to-SQL compilation, and optimistic UI updates.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-active-success.svg)
![Stack](https://img.shields.io/badge/stack-MERN-blueviolet)

## 🚀 The Core Problem
Designing database schemas in a remote team environment is fragmented. Developers diagram in Miro, write SQL in a separate editor, and manually resolve conflicts when requirements change. 

**Schema Architect** unifies this workflow by treating the "Diagram" as the "Source of Truth." It uses **Conflict-free Replicated Data Types (CRDTs)** to ensure that every node movement, column rename, and relationship connection is synced instantly across all connected clients without race conditions.

## ⚡ Technical Highlights

### 1. Distributed State Management (CRDTs)
Instead of a traditional REST API that saves "snapshots," this system syncs **state vectors**.
* **Library:** `Yjs` for the CRDT implementation.
* **Mechanism:** Uses `Y.Map` for nodes and `Y.Array` for edges.
* **Benefit:** Mathematical guarantee of eventual consistency. If User A renames a table while User B deletes a column, both operations merge deterministically.

### 2. The "Reactive Compiler" Pattern
The system implements a real-time transpiler pipeline:
1.  **Input:** Listen to `Y.Doc` updates (binary changes).
2.  **Process:** Construct a Directed Acyclic Graph (DAG) of the schema.
3.  **Output:** deterministically generate valid `CREATE TABLE` and `FOREIGN KEY` SQL statements.
* *Performance:* The compiler runs optimally on the client-side, ensuring zero latency between visual changes and code generation.

### 3. Architecture
The system follows a strict separation of concerns:

```mermaid
graph LR
    A["Client 1 (React)"] -- "WebSocket (Binary Delta)" --> B(("Hocuspocus Server"))
    C["Client 2 (React)"] -- "WebSocket (Binary Delta)" --> B
    B -- Broadcast --> A
    B -- Broadcast --> C
