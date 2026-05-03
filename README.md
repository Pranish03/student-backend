# SMS Backend

A REST API for a school management system built with Node.js, Express, and MongoDB. Handles authentication, user management, classes, courses, schedules, attendance, resources, submissions, and notices.

---

## Tech Stack

- **Node.js** — runtime
- **Express v5** — web framework
- **MongoDB + Mongoose** — database and ODM
- **Zod** — request validation
- **bcryptjs** — password hashing
- **jsonwebtoken** — JWT generation and verification
- **Nodemailer** — transactional emails via Gmail
- **Multer** — local file uploads
- **cookie-parser** — cookie handling
- **dotenv** — environment variable management

---

## Prerequisites

- Node.js 18+
- A running MongoDB instance (local or Atlas)
- A Gmail account with an app password enabled (for emails)

---

## Getting Started

**1. Clone and install**

```bash
git clone <repo-url>
cd student-backend
npm install
```

**2. Set up environment variables**

Copy `.env.example` to `.env` and fill in the values:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret

GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
```

> `CLOUDINARY_*` variables in the example file are unused — the app stores files locally.

**3. Start the server**

```bash
# Development (with auto-restart)
npm run dev

# Production
npm start
```

The server runs at `http://localhost:5000` by default.

---

## Available Scripts

| Script        | Description                                           |
| ------------- | ----------------------------------------------------- |
| `npm run dev` | Start with `--watch` for auto-restart on file changes |
| `npm start`   | Start normally (production)                           |

---

## Project Structure

```
src/
├── config/
│   └── db.js               # MongoDB connection
├── lib/
│   ├── multer.js           # Multer disk storage setup
│   └── transporter.js      # Nodemailer transporter
├── middlewares/
│   ├── protect.js          # JWT auth middleware
│   ├── authorize.js        # Role-based access control
│   └── validate.js         # Zod request validation middleware
├── modules/                # Feature modules (router + model + schema per module)
│   ├── auth/
│   ├── user/
│   ├── class/
│   ├── course/
│   ├── schedule/
│   ├── attendance/
│   ├── resource/
│   ├── submission/
│   └── notice/
├── templates/              # HTML email templates
│   ├── created.js          # New account email
│   ├── reset.js            # Password reset email
│   ├── success.js          # Password reset success email
│   └── updated.js          # Password updated email
├── utils/
│   ├── cookie.js           # JWT generation and cookie helpers
│   ├── email.js            # sendEmail wrapper
│   └── password.js         # Random password generator
└── index.js                # App entry point, middleware setup, route mounting
```

Each module under `modules/` follows the same structure:

```
modules/user/
├── index.js    # Express router with all route handlers
├── model.js    # Mongoose model and schema
└── schema.js   # Zod validation schemas for that module
```

---

## API Routes

All routes are prefixed with the base path shown below.

### Auth — `/auth`

| Method | Path                     | Access        | Description                   |
| ------ | ------------------------ | ------------- | ----------------------------- |
| POST   | `/login`                 | Guest         | Login and receive auth cookie |
| POST   | `/logout`                | Authenticated | Clear auth cookie             |
| GET    | `/me`                    | Authenticated | Get current user              |
| POST   | `/forgot-password`       | Guest         | Send password reset email     |
| POST   | `/reset-password/:token` | Guest         | Reset password using token    |
| POST   | `/update-password`       | Authenticated | Change own password           |

### Users — `/users`

| Method | Path          | Access         | Description                                |
| ------ | ------------- | -------------- | ------------------------------------------ |
| POST   | `/`           | Admin          | Create a user (student, teacher, or admin) |
| GET    | `/`           | Admin, Teacher | Get all users (filter by `?role=`)         |
| GET    | `/:id`        | Admin, Teacher | Get user by ID                             |
| PATCH  | `/:id`        | Admin          | Update user name or email                  |
| PATCH  | `/toggle/:id` | Admin          | Toggle user active status                  |
| DELETE | `/:id`        | Admin          | Delete user                                |

### Classes — `/classes`

| Method | Path            | Access         | Description                |
| ------ | --------------- | -------------- | -------------------------- |
| POST   | `/`             | Admin          | Create a class             |
| GET    | `/`             | Admin          | Get all classes            |
| GET    | `/my`           | Student        | Get own enrolled class     |
| GET    | `/:id`          | Admin, Teacher | Get class by ID            |
| PATCH  | `/:id`          | Admin          | Update class details       |
| PATCH  | `/:id/students` | Admin          | Enroll students into class |
| PATCH  | `/:id/courses`  | Admin          | Assign courses to class    |
| DELETE | `/:id/students` | Admin          | Remove students from class |
| DELETE | `/:id/courses`  | Admin          | Remove courses from class  |
| DELETE | `/:id`          | Admin          | Delete class               |

### Courses — `/courses`

| Method | Path                  | Access        | Description                             |
| ------ | --------------------- | ------------- | --------------------------------------- |
| POST   | `/`                   | Admin         | Create a course                         |
| GET    | `/`                   | Authenticated | Get all courses (filter by `?teacher=`) |
| GET    | `/:id`                | Authenticated | Get course by ID                        |
| PATCH  | `/:id`                | Admin         | Update course name or code              |
| PATCH  | `/update-teacher/:id` | Admin         | Assign teacher to course                |
| DELETE | `/update-teacher/:id` | Admin         | Remove teacher from course              |
| DELETE | `/:id`                | Admin         | Delete course                           |

### Schedules — `/schedules`

| Method | Path                    | Access        | Description                   |
| ------ | ----------------------- | ------------- | ----------------------------- |
| POST   | `/`                     | Admin         | Create a schedule for a class |
| GET    | `/`                     | Authenticated | Get all schedules             |
| GET    | `/:id`                  | Authenticated | Get schedule by ID            |
| GET    | `/class/:classId`       | Authenticated | Get schedule by class ID      |
| PATCH  | `/:id`                  | Admin         | Replace entire timetable      |
| POST   | `/:id/entries`          | Admin         | Add a timetable entry         |
| PATCH  | `/:id/entries/:entryId` | Admin         | Update a timetable entry      |
| DELETE | `/:id/entries/:entryId` | Admin         | Remove a timetable entry      |
| DELETE | `/:id`                  | Admin         | Delete schedule               |

### Attendance — `/attendances`

| Method | Path           | Access         | Description                                      |
| ------ | -------------- | -------------- | ------------------------------------------------ |
| POST   | `/`            | Teacher        | Record attendance for a course and date          |
| GET    | `/:id`         | Admin, Teacher | Get attendance by course ID (filter by `?date=`) |
| GET    | `/:id/summary` | Admin, Teacher | Get attendance summary per student for a course  |
| GET    | `/my/:id`      | Student        | Get own attendance for a course                  |
| PATCH  | `/:id`         | Teacher        | Update an attendance record                      |
| DELETE | `/:id`         | Teacher        | Delete an attendance record                      |

### Resources — `/resources`

| Method | Path          | Access           | Description                                                     |
| ------ | ------------- | ---------------- | --------------------------------------------------------------- |
| POST   | `/`           | Teacher          | Upload a note or assignment                                     |
| GET    | `/course/:id` | Teacher, Student | Get resources for a course (filter by `?type=note\|assignment`) |
| GET    | `/:id`        | Teacher, Student | Get resource by ID                                              |
| PATCH  | `/:id`        | Teacher          | Update a resource                                               |
| DELETE | `/:id`        | Teacher          | Delete a resource                                               |

### Submissions — `/submissions`

| Method | Path              | Access           | Description                           |
| ------ | ----------------- | ---------------- | ------------------------------------- |
| POST   | `/`               | Student          | Submit an assignment                  |
| GET    | `/assignment/:id` | Teacher, Student | Get all submissions for an assignment |
| GET    | `/:id`            | Teacher, Student | Get submission by ID                  |
| PATCH  | `/:id`            | Student          | Resubmit (replace file)               |
| DELETE | `/:id`            | Student          | Delete own submission                 |

### Notices — `/notices`

| Method | Path   | Access         | Description                             |
| ------ | ------ | -------------- | --------------------------------------- |
| POST   | `/`    | Admin, Teacher | Create a notice                         |
| GET    | `/`    | Authenticated  | Get notices (filtered by viewer's role) |
| GET    | `/:id` | Authenticated  | Get notice by ID                        |
| PATCH  | `/:id` | Admin, Teacher | Update a notice (teachers: own only)    |
| DELETE | `/:id` | Admin, Teacher | Delete a notice (teachers: own only)    |

---

## Middleware

**`protect`** — Verifies the `auth-token` cookie, looks up the user in the database, and attaches them to `req.user`. Returns `401` if the token is missing or invalid.

**`authorize(...roles)`** — Checks that `req.user.role` is one of the allowed roles. Returns `403` if not. Always used after `protect`.

**`validate(schemas)`** — Runs Zod validation against `req.body`, `req.params`, and/or `req.query`. Attaches parsed data to `req.validatedBody`, `req.validatedParams`, and `req.validatedQuery`. Returns `422` with error details on failure.

---

## Authentication

- On login, a signed JWT is placed in an `httpOnly` cookie named `auth-token` with a 7-day expiry
- The cookie is `secure` and `sameSite: none` in production, `lax` in development
- Every protected route reads this cookie via the `protect` middleware

---

## File Uploads

Files are stored locally in the `uploads/resources/` directory using Multer disk storage. The server exposes this directory as a static route at `/uploads`. File URLs are constructed as `http(s)://<host>/uploads/resources/<filename>` and stored in the database. Old files are deleted from disk when a resource is updated or deleted.

> The `uploads/` folder is git-ignored. In production, consider replacing Multer disk storage with cloud storage (e.g. Cloudinary, S3).

---

## Email

Transactional emails are sent via Gmail using Nodemailer. Emails are triggered on:

- Account creation (sends temporary password)
- Password reset request (sends reset link, expires in 10 minutes)
- Successful password reset
- Successful password update

In development, generated passwords and reset tokens are also logged to the console.
