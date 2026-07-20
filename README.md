# Secure Digital Voting Platform

A production-ready, highly secure, and dynamically configurable digital voting platform suitable for college, school, community, club, and corporate elections. 

## Architectural Philosophy
Unlike traditional voting platforms that assume a fixed election format, this platform uses a relational, fully normalized dynamic database schema. **No candidate cards are hardcoded.** Instead, the Election Creator (Admin) selects from predefined candidate fields (e.g., photo, name, party details, manifesto, custom badge) and appends any number of custom dynamic fields (e.g., Blood Group, Semester, Student ID, Employee ID). 

The platform then dynamically renders the Candidate Creation form, structures validation rules on the server, and renders candidate details on glassmorphic card grids based on election settings.

---

## Technical Stack
* **Frontend:** React.js (Vite), React Router (v6), Tailwind CSS (glassmorphism design), Axios, React Hook Form, Framer Motion, React Hot Toast, Recharts.
* **Backend:** Node.js, Express.js.
* **Database & ORM:** PostgreSQL, Prisma ORM.
* **Authentication:** Email & Password, 6-digit OTP verification email, JWT Auth (HTTP-Only Refresh Cookie + short Access Token header), Bcrypt hashing.
* **Security:** PostgreSQL Row Locking, Zod validations, CORS configs, Helmet, and Rate Limiters.

---

## Core Security Features
1. **Concurrent Ballots Row-Locking:** Prevents double-voting race conditions by executing `SELECT * FROM "User" WHERE id = $1 FOR UPDATE` inside a PostgreSQL transaction. Under high concurrency (e.g., spamming multiple concurrent requests), only 1 vote commits; subsequent attempts are rejected.
2. **Voter Approvals:** Verification controls allow admins to toggle voter suspension status or assign administrator privileges.
3. **Private Ballot Eligibility:** Private elections can restrict eligibility to specific email domains (e.g., `student.edu`) or a list of specific voter emails.
4. **Administrative Audit Logs:** Chronological trace logs recording account registration, verification, logins, election status shifts, candidate modifications, and vote talleying, including timestamp and IP tracking.

---

## Local Setup & Installation

### Prerequisite
Ensure you have Node.js (v18+) and PostgreSQL installed.

### 1. Database Setup
1. Create a blank PostgreSQL database.
2. Navigate to `backend/` and rename `.env.example` to `.env`.
3. Set your `DATABASE_URL` in `backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres:password@localhost:5432/digital_voting?schema=public"
   ```

### 2. Install Dependencies
Run npm install in both backend and frontend directories:
```bash
# In backend/
npm install

# In frontend/
npm install
```

### 3. Database Migration
Apply the database migrations to build tables:
```bash
# In backend/
npx prisma db push
# or to record standard migrations:
npx prisma migrate dev --name init
```

### 4. Running the Servers
Start both development servers:
```bash
# In backend/
npm run dev

# In frontend/ (in a separate terminal)
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Platform Bootstrapping Guidelines

> [!IMPORTANT]
> **No Seed Data Rule:**
> To keep the platform empty and fully customizable, **no default admin or users are seeded.**
> To bootstrap the system:
> 1. Register a new user profile at `/register`.
> 2. Check your backend console terminal logs. If SMTP credentials are not configured, **the email verification code (6-digit OTP) will print directly to the terminal console.**
> 3. Verify using that OTP code.
> 4. Log in. **The first registered user on the database is automatically assigned the `ADMIN` role.** All subsequent registrations will default to the standard `USER` role.

---

## Testing Concurrency
To verify that database row-locking prevents concurrent double-voting, configure your `DATABASE_URL` in `backend/.env` and execute:
```bash
# In backend/
node tests/votingConcurrency.test.js
```
The script seeds a temporary voter, triggers 5 concurrent ballot casting requests simultaneously, verifies that exactly 1 request completes while 4 are rejected, and cleans up database entries.