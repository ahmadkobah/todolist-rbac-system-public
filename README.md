# To-Do List RBAC System

A REST API for a to-do list application with role-based access control (RBAC). It is built with
Node.js, Express and MongoDB, and it lets users sign up, log in with a JSON Web Token (JWT),
manage their profile and manage tasks, while administrators get wider access.

---

## Table of Contents

1. [Overview](#overview)
2. [Project Status](#project-status)
3. [How It Works](#how-it-works)
4. [Roles and Permissions](#roles-and-permissions)
5. [Features](#features)
6. [Technology Stack](#technology-stack)
7. [Project Structure](#project-structure)
8. [Getting Started](#getting-started)
9. [Configuration](#configuration)
10. [API Reference](#api-reference)
11. [Data Model](#data-model)
12. [Testing](#testing)
13. [Security](#security)
14. [Known Issues](#known-issues)
15. [License](#license)

---

## Overview

### Purpose

This project was created as a summer training project. Its goal is to practise building a
backend in a clean, layered way and to protect the data with authentication (who are you?) and
authorization (what are you allowed to do?).

The application stores users and their tasks. Every task belongs to one user. A normal user
works with their own account, while an administrator can see all tasks and manage other users.

### Intended users

- **Learners and developers** who want an example of a layered Express API with JWT login and
  role checks.
- **Frontend developers** who need a simple task API to build a client against. There is no
  frontend in this repository.

### Design idea

The code follows a three-layer structure (the package name is `3controllevel`):

- **Controller** - reads the HTTP request and writes the HTTP response.
- **Service** - holds the business rules, for example "only the owner or an admin may archive a
  task".
- **Repository** - talks to MongoDB through Mongoose models.

---

## Project Status

The project is a **finished training project**, not a production system. The last code update
was in October 2025. The main flows exist, but some parts are incomplete or do not behave as
intended (see [Known Issues](#known-issues)).

| Area | Status | Notes |
|------|--------|-------|
| Sign up and login with JWT | Working | Token is valid for 7 days |
| Role checks (`user`, `admin`) | Working | Route-level and service-level checks |
| User management (read, update, deactivate, delete) | Working | Owner or admin rules in the service layer |
| Profile image upload | Working | Image is resized to 500 x 500 JPEG and saved on disk |
| Task read, archive and delete | Working | See Known Issues for access gaps |
| Task create and status update | Incomplete | Status values in the validator and the model do not match |
| Forgot / reset password by e-mail | Partly working | Reset link is sent; the reset step has a query bug |
| Send new password by e-mail | Working | Generates a random password and e-mails it |
| Automated tests | Not present | Manual Postman notes only |
| Frontend | Not present | API only |
| Docker / deployment setup | Not present | |

---

## How It Works

### Architecture

```
+------------------+        HTTP / JSON         +-------------------------------+
|  API client      | -------------------------> |  Express server (server.js)   |
|  (Postman, app)  | <------------------------- |  port 3000 by default         |
+------------------+                            +---------------+---------------+
                                                                |
                         +--------------------------------------+
                         |
                         v
  +-------------+   +---------------------+   +------------+   +-----------+   +--------------+
  |  Routes     |-->| Middleware          |-->| Controller |-->| Service   |-->| Repository   |
  |  /api/auth  |   | protect (JWT)       |   |            |   | business  |   | Mongoose     |
  |  /api/users |   | authorize (roles)   |   |            |   | rules     |   | queries      |
  |  /api/tasks |   | express-validator   |   |            |   |           |   |              |
  +-------------+   | multer + sharp      |   +------------+   +-----------+   +------+-------+
                    +---------------------+                                          |
                                                                                     v
                                    +-------------------+                 +-------------------+
                                    | uploads/user/     |                 | MongoDB           |
                                    | (profile images)  |                 | users, tasks      |
                                    +-------------------+                 +-------------------+
```

E-mails for password recovery are sent through Gmail with Nodemailer.

### Request and authorization flow

1. The client calls an endpoint, for example `PATCH /api/tasks/:id/deactivate`.
2. Express matches the route in `routes/taskRoute.js`.
3. The `protect` middleware reads the `Authorization: Bearer <token>` header, verifies the JWT
   with the secret from the environment and loads the user from MongoDB. If this fails, the
   API answers `401`.
4. The `authorize(...roles)` middleware checks that `req.user.role` is one of the allowed roles.
   If not, the API answers `403`.
5. The validator (express-validator) checks the input, for example that `:id` is a valid
   MongoDB ObjectId. Invalid input returns `400` with a list of errors.
6. The controller calls the service. The service applies ownership rules, for example "the
   current user must own the task or be an admin".
7. The repository runs the Mongoose query and returns the document.
8. Errors are thrown as `ApiError(statusCode, message)` and turned into a JSON response by the
   global error middleware. Unknown routes return `404`.

---

## Roles and Permissions

There are two roles, stored in the `role` field of a user: `user` (default) and `admin`.
"Public" means no token is needed.

| Action | Endpoint | Public | user | admin |
|--------|----------|:------:|:----:|:-----:|
| Sign up | `POST /api/auth/signup`, `POST /api/users/signup` | Yes | - | - |
| Log in | `POST /api/auth/login` | Yes | - | - |
| Create user (with optional image) | `POST /api/users` | Yes | - | - |
| Forgot / reset / new password | `POST /api/users/forgotPassword`, `resetPassword/:token`, `sendNewPassword` | Yes | - | - |
| List users | `GET /api/users` | No | Yes | Yes |
| Read one user | `GET /api/users/:id` | No | Yes | Yes |
| Update user / profile image | `PUT /api/users/:id`, `PUT /api/users/:id/profile-image` | No | Own account | Any user |
| Deactivate user (soft delete) | `PATCH /api/users/:id/deactivate` | No | Own account | Any user |
| Delete user (hard delete) | `DELETE /api/users/:id` | No | Own account | Any user |
| Create task | `POST /api/tasks` | No | Yes | Yes |
| List all tasks (filter, sort, paging) | `GET /api/tasks` | No | No | Yes |
| List tasks of a user | `GET /api/tasks/user/:userId` | No | Yes (any user) | Yes |
| Read one task | `GET /api/tasks/:id` | No | Yes (any task) | Yes |
| Update task | `PUT /api/tasks/:id` | No | Yes (any task) | Yes |
| Archive task | `PATCH /api/tasks/:id/deactivate` | No | Own task | Any task |
| Delete task | `DELETE /api/tasks/:id` | No | Yes (any task) | Yes |

"Own account" and "Own task" checks are done in the service layer. Rows marked "any user" or
"any task" have no ownership check in the current code; see [Known Issues](#known-issues).

---

## Features

- **Authentication** - sign up and log in; the server returns a signed JWT that contains the
  user id and role and expires after 7 days.
- **Password hashing** - passwords are hashed with bcryptjs (cost factor 12) in a Mongoose
  `pre("save")` hook.
- **Role-based access control** - `authorize("admin")` and `authorize("user", "admin")` on
  routes, plus owner-or-admin checks in the services.
- **User management** - read, update, soft delete (`isDeleted: true`) and hard delete. The
  e-mail address cannot be changed after sign up.
- **Profile images** - upload with Multer (in memory), resize to 500 x 500 pixels with Sharp,
  save as `uploads/user/user-<uuid>.jpeg` and store the file name in `profileImage`.
- **Task management** - create, read, update, archive (soft delete) and delete tasks. A task
  cannot be moved to another user.
- **Query features for the admin task list** - filtering by any field, `sort`, `fields`
  (field selection), `page` and `limit` (default 5 per page) through `utils/apiFilter.js`.
- **Pagination** - `page` and `limit` (default 10) for user lists and tasks per user.
- **Password recovery by e-mail** - a hashed reset token valid for 1 hour, or a new random
  password sent by e-mail.
- **Input validation** - express-validator rules for users and tasks.
- **Central error handling** - a custom `ApiError` class and one error middleware.
- **Seed script** - imports or deletes sample users and tasks from JSON files.

---

## Technology Stack

| Layer | Technology | Version (package.json) |
|-------|------------|------------------------|
| Runtime | Node.js | not pinned |
| Web framework | Express | ^5.1.0 |
| Database | MongoDB with Mongoose | ^8.16.4 |
| Authentication | jsonwebtoken | ^9.0.2 |
| Password hashing | bcryptjs | ^3.0.2 |
| Validation | express-validator | ^7.2.1 |
| File upload | multer | ^2.0.2 |
| Image processing | sharp | ^0.34.3 |
| E-mail | nodemailer | ^7.0.5 |
| IDs | uuid | ^11.1.0 |
| Configuration | dotenv | ^17.2.0 |
| CORS | cors | ^2.8.5 |
| Dev tools | nodemon, morgan | ^3.1.10, ^1.10.1 |

`http-errors`, `slugify` and `morgan` are installed but not used in the code.

---

## Project Structure

```
todolist-rbac-system/
|-- server.js                     # Entry point: DB connection, middleware, routes, error handling
|-- package.json
|-- package-lock.json
|-- config/
|   `-- database.js               # Alternative DB connection helper (not used by server.js)
|-- routes/
|   |-- authRoute.js              # /api/auth
|   |-- userRoute.js              # /api/users
|   `-- taskRoute.js              # /api/tasks
|-- controllers/
|   |-- authController.js         # signup, login, password recovery
|   |-- userController.js         # user CRUD, image upload and resize
|   `-- taskController.js         # task CRUD and archive
|-- services/
|   |-- userService.js            # user business rules (owner or admin)
|   `-- taskService.js            # task business rules
|-- repositories/
|   |-- userRepository.js         # Mongoose queries for users
|   `-- taskRepository.js         # Mongoose queries for tasks
|-- models/
|   |-- userModel.js
|   `-- taskModel.js
|-- middlewares/
|   |-- authMiddleware.js         # protect (JWT) and authorize (roles)
|   |-- validatorMiddleware.js    # returns express-validator errors
|   |-- imageMulter.js            # Multer memory storage
|   |-- userMiddleware.js         # active-user filter
|   |-- taskMiddleware.js         # task filter and payload check (not used by routes)
|   |-- errorMiddleware.js        # global error handler
|   `-- notFound.js               # 404 handler
|-- utils/
|   |-- apiError.js               # ApiError class
|   |-- apiFilter.js              # filter, sort, fields, paging
|   `-- validator/
|       |-- userValidator.js
|       `-- taskValidator.js
|-- dev/
|   |-- seed.js                   # import and delete helpers
|   |-- seed-caller.js            # command line entry for seeding
|   |-- users.json                # sample users
|   |-- tasks.json                # sample tasks
|   `-- Seeed Test.txt            # seed commands
|-- TaskModule Workflow Map       # text diagram of the task layers
|-- UserModule Workflow Map.txt   # text diagram of the user layers
`-- .gitignore
```

The repository also contains a PNG project summary image. `node_modules`, `.env` and uploaded
profile images (`uploads/`) are not stored in Git; see `.gitignore`.

---

## Getting Started

### Prerequisites

- Node.js and npm (a current LTS version; `sharp` 0.34 needs Node.js 18.17 or newer)
- A MongoDB database (local or MongoDB Atlas)
- A Gmail account with an app password, only if you want to test the e-mail features

### Installation

```bash
git clone https://github.com/ahmadkobah/todolist-rbac-system-public.git
cd todolist-rbac-system-public
npm install
```

`node_modules` is not stored in Git, so `npm install` is required after cloning. It also makes
sure that native packages such as `sharp` match your operating system.

### Configure

Create a `.env` file in the project root with the variables listed in
[Configuration](#configuration). Use your own values.

### Run

```bash
npm start
```

This runs `node server.js`. The server listens on `PORT` (default `3000`), so the API base URL
is `http://localhost:3000/api`. There is no `dev` script; to use the installed nodemon, run
`npx nodemon server.js`.

### Seed sample data (optional)

```bash
node dev/seed-caller.js --import User
node dev/seed-caller.js --import Task
node dev/seed-caller.js --delete User
node dev/seed-caller.js --delete Task
```

The sample tasks in `dev/tasks.json` refer to fixed user ids. They only link to real users if
those ids exist in your database.

---

## Configuration

Settings are read from environment variables with dotenv.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DB_URL` | Yes | MongoDB connection string |
| `JWT_SECRET` | Yes | Secret used to sign and verify JWTs |
| `PORT` | No | HTTP port, default `3000` |
| `MAIL_USER` | For e-mail features | Gmail address that sends password recovery e-mails |
| `MAIL_PASS` | For e-mail features | Gmail app password for that address |

`.env.example` lists all variables. The password reset link is fixed to
`http://localhost:3000/api/users/resetPassword/<token>`.

---

## API Reference

All responses are JSON. Protected routes need the header `Authorization: Bearer <token>`.

### Auth - `/api/auth`

| Method | Path | Auth | Body | Result |
|--------|------|------|------|--------|
| POST | `/signup` | Public | `username`, `email`, `password`, `role` (all required) | `201`, token and user |
| POST | `/login` | Public | `email`, `password` | `200`, token and user |

### Users - `/api/users`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Public | Create a user; optional `profileImage` file (multipart/form-data) |
| POST | `/signup` | Public | Same handler as `/api/auth/signup` |
| POST | `/forgotPassword` | Public | Body `email`; sends a reset link valid for 1 hour |
| POST | `/resetPassword/:token` | Public | Body `password`; sets a new password |
| POST | `/sendNewPassword` | Public | Body `email`; e-mails a new random password |
| GET | `/` | Token | List active users; query `page`, `limit` (default 10) |
| GET | `/:id` | Token | Get one active user (password is not returned) |
| PUT | `/:id` | user, admin | Update own account (admin: any); `email` cannot be changed |
| PUT | `/:id/profile-image` | Token | Upload a new `profileImage` and update the user |
| PATCH | `/:id/deactivate` | user, admin | Soft delete (`isDeleted: true`) |
| DELETE | `/:id` | user, admin | Hard delete; returns `204` |

### Tasks - `/api/tasks`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/` | Token | Create a task; body `userId`, `title`, `dueDate`, optional `description`, `status` |
| GET | `/` | admin | List tasks with filter, `sort`, `fields`, `page`, `limit` (default 5) |
| GET | `/user/:userId` | Token | List active tasks of a user; query `page`, `limit` (default 10) |
| GET | `/:id` | Token | Get one task with owner `username` and `email` |
| PUT | `/:id` | user, admin | Update a task; `userId` cannot be changed |
| PATCH | `/:id/deactivate` | user, admin | Archive a task (owner or admin only) |
| DELETE | `/:id` | user, admin | Soft delete a task; returns `204` |

Example query for the admin list: `GET /api/tasks?status=Completed&sort=dueDate&page=2&limit=10`.

### Error format

```json
{ "status": "error", "message": "You do not have permission to perform this action" }
```

Validation errors return `400` with `{ "status": "fail", "errors": [ ... ] }`.

---

## Data Model

### User (`users` collection)

| Field | Type | Rules |
|-------|------|-------|
| `username` | String | Required, unique, 2 to 40 characters, trimmed |
| `email` | String | Required, unique, lowercase, simple e-mail pattern |
| `password` | String | Required, at least 6 characters, stored as bcrypt hash |
| `profileImage` | String | File name of the image, default empty |
| `role` | String | `user` or `admin`, default `user` |
| `isDeleted` | Boolean | Soft delete flag, default `false` |
| `passwordResetToken` | String | SHA-256 hash of the reset token |
| `passwordResetExpires` | Date | Expiry of the reset token |
| `createdAt`, `updatedAt` | Date | Added by Mongoose |

### Task (`tasks` collection)

| Field | Type | Rules |
|-------|------|-------|
| `userId` | ObjectId (ref `User`) | Required, indexed |
| `title` | String | Required, at most 100 characters |
| `description` | String | Optional, at most 500 characters |
| `dueDate` | Date | Required, indexed |
| `status` | String | Required; one of `Pending`, `In Progress`, `Completed`, `Not Started`, `Pending Review`; indexed |
| `isDeleted` | Boolean | Soft delete flag, default `false` |
| `createdAt`, `updatedAt` | Date | Added by Mongoose |

One user has many tasks. Archiving or deleting a task sets `isDeleted: true` and
`status: "archived"`.

---

## Testing

There are **no automated tests**. `npm test` only prints "no test specified" and exits with an
error. The API was tested by hand with Postman.

---

## Security

What the code does:

- Passwords are hashed with bcryptjs before they are saved.
- Protected routes require a valid JWT; roles are checked with `authorize`.
- Owner-or-admin rules protect user updates, user deletes and task archiving.
- Reset tokens are stored only as a SHA-256 hash and expire after 1 hour.
- User queries in the repository exclude the password field.

Points to address before any real use:

- All credentials (database, JWT secret, e-mail account) are read from environment variables.
  Keep them in a local `.env` file, which `.gitignore` excludes.
- Sign up and `POST /api/users` accept a `role` field, so anyone can create an `admin` account.
- Sign up and login responses include the password hash, and login logs the submitted password
  to the console.
- `protect` does not check `isDeleted`, so a deactivated user can keep using a valid token.
- Image uploads have no file type or size limit.

---

## Known Issues

These points come from reading the code. They were not confirmed by running the application.

1. **Task status values do not match.** The validator and the service use lower-case values
   (`pending`, `in-progress`, `completed`, `archived`), but the model only accepts `Pending`,
   `In Progress`, `Completed`, `Not Started` and `Pending Review`. As a result, creating a task
   through the API, or updating its status, fails model validation. Seeded tasks use the model
   values and are not affected. Archiving writes `archived` without validation.
2. **Missing ownership checks on tasks.** Any logged-in user can read any task, list the tasks
   of any user, update any task and delete any task. Only archiving checks the owner. The
   comment on the delete route says "admin only", but the route allows `user` and `admin`.
3. **`DELETE /api/tasks/:id` does not hard delete.** It calls the same soft delete as archiving.
4. **`GET /api/tasks` also returns archived tasks**, because the filter does not exclude
   `isDeleted: true`.
5. **Password reset query bug.** In `resetPassword`, the expiry condition is built as
   `{ $gt: Date.now() } + 60 * 60 * 1000`, which produces a string instead of a date
   condition. The reset step is therefore expected to fail.
6. **Duplicate `POST /api/users` route.** The first route (image upload, no validation) always
   answers, so the second route with `createUserValidator` is never reached.
7. **Different password rules.** The model requires 6 characters, the validators require 8.
8. **Unused code.** `config/database.js`, `middlewares/taskMiddleware.js`, `verifyToken`,
   `getTasksByTitle` (calls a service method that does not exist), `restoreById`,
   `getTasksByStatus` and `countUserTasks` are not connected to any route. `taskRoute.js`
   imports `Admin` from `mongodb` without using it.
9. **Profile images are not served.** The images are saved on disk, but no static route
   exposes `uploads/`.

---

## License

No license file is included. Private. All rights reserved.

Author: Ahmad Kobah
