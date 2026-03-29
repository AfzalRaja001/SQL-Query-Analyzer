# SQL Query Analyzer & Optimization Benchmarking System

A reliable, production-quality web-based system for analyzing SQL query performance, visualizing execution plans, benchmarking queries, and providing optimization suggestions using Node.js, Prisma, PostgreSQL, and Next.js.

## Prerequisites

Before getting started, ensure you have the following installed on your local machine:
1. **Node.js**: (LTS version recommended)
2. **PostgreSQL**: (Installed and running as a service)
3. **Database GUI** (Optional but recommended): DBeaver or pgAdmin
4. **Git**: For version control.

## Setup Instructions

Follow these steps to get both the frontend and backend running locally.

### 1. Database Setup
You must configure your local PostgreSQL instance with a specific database and security roles:
1. Connect to your local Postgres server.
2. Create a new database named `queryanalyzer`.
3. Open a SQL query tool on `queryanalyzer` and execute the following script exactly as written to create the securely isolated query executor role:
   ```sql
   CREATE ROLE readonly_user WITH LOGIN PASSWORD 'strong_password';
   GRANT CONNECT ON DATABASE queryanalyzer TO readonly_user;
   GRANT USAGE ON SCHEMA public TO readonly_user;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO readonly_user;
   ```

### 2. Backend Setup (`/server`)
1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Create a `.env` file inside the `server` directory (Note: This file is ignored by Git for security).
   - Add the following variables (replace `YOUR_POSTGRES_PASSWORD` with your actual admin postgres password):
     ```env
     DATABASE_URL="postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/queryanalyzer?schema=public"
     TARGET_DB_URL="postgresql://readonly_user:strong_password@localhost:5432/queryanalyzer?schema=public"
     ```
4. (Future step) Run Prisma Migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
5. Start the backend Node server (once we add the start scripts):
   ```bash
   npm run dev
   ```

### 3. Frontend Setup (`/client`)
1. Open a new terminal and navigate to the `client` directory from the root folder:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the Next.js development server:
   ```bash
   npm run dev
   ```

You can then visit `http://localhost:3000` to view the frontend!
