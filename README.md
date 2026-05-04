# QueryLab — SQL Query Analyzer

A full-stack web application for analyzing, benchmarking, and comparing PostgreSQL queries. QueryLab provides real-time execution plans, AI-style optimization suggestions, query history tracking, and side-by-side query comparison — all in a modern, dark-themed UI.

---

## Project Overview

QueryLab connects to your PostgreSQL database and runs queries through a read-only, time-limited proxy that enforces safety. Every query execution is analyzed for performance issues and automatically logged to history. You can save multiple database connections, benchmark query performance over repeated runs, compare two queries head-to-head, and star queries to build a personal favorites list.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| Next.js 16 (App Router) | React framework with server/client component model |
| React 19 | UI rendering with React Compiler enabled |
| TypeScript | Static typing throughout |
| Tailwind CSS v4 | Utility-first styling with OKLch CSS variable theming |
| shadcn/ui | Accessible component primitives (Card, Badge, Button, Skeleton) |
| Monaco Editor | VS Code-grade SQL editor with syntax highlighting |
| Recharts | Benchmark run charts (bar + line) |
| TanStack Query | Server state management and caching |
| Zustand | Client-side state (active connection, query store) |
| Axios | HTTP client for API calls |
| lucide-react | Icon set |

### Backend
| Technology | Purpose |
|---|---|
| Express 5 | HTTP server and REST API |
| TypeScript + ts-node-dev | Type-safe server with hot reload |
| PostgreSQL (`pg`) | Database driver |
| Prisma 7 | ORM for query history and connection metadata |
| node-sql-parser | AST-based SQL analysis for optimization suggestions |
| Helmet | HTTP security headers |
| Morgan | Request logging |
| dotenv | Environment variable management |

---

## Features & Functionality

### SQL Analyzer (`/analyze`)
- Monaco-powered SQL editor with syntax highlighting, hover hints, and autocomplete
- Executes queries safely via a read-only, transaction-wrapped database connection
- Displays results in a paginated table
- Returns an execution plan tree (EXPLAIN ANALYZE)
- Generates optimization suggestions:
  - `SELECT *` detection with column-specific replacement
  - Missing `LIMIT` clause on large result sets
  - Missing index recommendations for columns in `WHERE` clauses
- All executed queries are automatically saved to history

### Benchmark (`/benchmark`)
- Run any SQL query N times (configurable iterations)
- Tracks execution time per run
- Displays a bar chart of individual run times and a line chart of the trend
- Shows average, min, and max execution times
- Highlights performance variance across runs

### Query Comparison (`/compare`)
- Two side-by-side SQL editors (Query A and Query B)
- Runs both queries and compares execution time, total plan cost, and estimated rows
- Declares a winner with percentage difference
- Shows full execution plan trees for both queries

### Query History (`/history`)
- Persistent log of all executed queries (backed by PostgreSQL via Prisma)
- Filter by: All | Slow (>200ms) | Favorites
- Sort by: Newest | Slowest | Fastest
- Star/unstar queries as favorites (optimistic UI update)
- Load-more pagination
- Relative timestamps ("2 min ago", "yesterday", etc.)
- Execution time badges color-coded by performance (green/yellow/red)

### Connection Manager (`/connections`)
- Save named database connections (host, port, database, username, password)
- Passwords are AES-256-GCM encrypted at rest
- Switch the active connection from the sidebar
- Each query execution is routed through the selected connection

---

## Project Structure

```
DBMS Project/
├── client/                  # Next.js frontend
│   ├── src/
│   │   ├── app/             # App Router pages
│   │   │   ├── analyze/
│   │   │   ├── benchmark/
│   │   │   ├── compare/
│   │   │   ├── connections/
│   │   │   └── history/
│   │   ├── components/      # React components
│   │   │   ├── benchmark/
│   │   │   ├── compare/
│   │   │   ├── connections/
│   │   │   ├── history/
│   │   │   ├── layout/      # Sidebar, shell
│   │   │   └── ui/          # shadcn primitives
│   │   └── lib/
│   │       ├── api.ts        # All API functions + TypeScript types
│   │       ├── store.ts      # Zustand store
│   │       └── sqlAnalyser.ts # Client-side SQL hints
│   └── .env.local           # Frontend environment variables
└── server/                  # Express backend
    ├── src/
    │   ├── controllers/     # Route handlers
    │   ├── routes/          # Express routers
    │   ├── services/        # SQL analyzer, connection pool
    │   └── generated/       # Prisma client output
    ├── prisma/
    │   └── schema.prisma    # Database schema
    └── .env                 # Server environment variables
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or accessible remotely)
- Two database users:
  - An **admin user** (e.g. `postgres`) for Prisma migrations
  - A **readonly user** for safe query execution

### Create the readonly user (run in psql)

```sql
CREATE USER readonly_user WITH PASSWORD 'your_password';
GRANT CONNECT ON DATABASE queryanalyzer TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
```

---

## Steps to Run

### 1. Clone the repository

```bash
git clone https://github.com/AfzalRaja001/SQL-Query-Analyzer.git
cd SQL-Query-Analyzer
```

### 2. Set up the server

```bash
cd server
npm install
```

Create `server/.env`:

```env
# Admin connection for Prisma migrations and history persistence
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/queryanalyzer?schema=public"

# Read-only connection for safe query execution
TARGET_DB_URL="postgresql://readonly_user:your_password@localhost:5432/queryanalyzer?schema=public"

# 32-byte hex key for encrypting saved connection passwords
# Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
CONNECTION_ENC_KEY="your_32_byte_hex_key_here"
```

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

Start the server:

```bash
npm run dev
```

The API will be available at `http://localhost:5001`.

### 3. Set up the client

```bash
cd ../client
npm install
```

Create `client/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api/v1
READONLY_DATABASE_URL="postgresql://readonly_user:your_password@localhost:5432/queryanalyzer?schema=public"
```

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

### 4. Open the app

Navigate to `http://localhost:3000/analyze` to run your first query.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/queries/health` | Health check |
| `POST` | `/api/v1/queries/execute` | Execute a SQL query |
| `POST` | `/api/v1/queries/compare` | Compare two SQL queries |
| `GET` | `/api/v1/queries/history` | Fetch query history |
| `PATCH` | `/api/v1/queries/history/:id/favorite` | Toggle favorite |
| `GET` | `/api/v1/connections` | List saved connections |
| `POST` | `/api/v1/connections` | Save a new connection |
| `DELETE` | `/api/v1/connections/:id` | Delete a connection |
| `POST` | `/api/v1/connections/:id/test` | Test a connection |