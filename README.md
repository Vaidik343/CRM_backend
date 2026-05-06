## CRM Backend (Node + Express + Sequelize)

### Requirements
- Node.js 18+
- Postgres running locally

### Environment
Edit `.env`:
- **`DATABASE_URL`**: e.g. `postgres://postgres:pg1234@localhost:5432/CRM`
- **`JWT_SECRET`**: any long random string

Create the database (example using psql):

```sql
CREATE DATABASE "CRM";
```

Optional: seed the first admin user (only if no users exist yet):
- set `SEED_ADMIN=true`
- set `ADMIN_PASSWORD=...` (and optionally name/email/employee id)

### Run

```bash
npm run dev
```

Server runs on `PORT` (default `7011`).

### API (MVP)
- **POST** `/api/auth/login`
- **POST** `/api/users/create` (admin)
- **GET** `/api/users` (admin)
- **POST** `/api/tasks/assign` (admin)
- **GET** `/api/export?type=calls|tasks|work-logs` (admin)
- **POST** `/api/calls`
- **GET** `/api/calls`
- **POST** `/api/work-log`
- **GET** `/api/work-logs`
- **GET** `/api/tasks`
- **PATCH** `/api/tasks/:id`

