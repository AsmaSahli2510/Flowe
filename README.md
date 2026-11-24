<div align="center">
  <img src="frontend/src/assets/images/logoTransparent.png" alt="Flowe logo" width="100" />

  # Flowe

  **A collaborative workspace for planning, organizing, and growing ideas together.**

  A full-stack project management platform combining visual Kanban boards, flexible project views, personal planning, real-time collaboration, and workflow automation.

  **React · Vite · Node.js · Express · MongoDB · Socket.IO**
</div>

---

## Overview

**Flowe** brings projects, people, tasks, and conversations into one organized workspace. Inspired by the flexibility of modern collaborative tools, it combines a garden-inspired visual identity with practical workflows for teams: manage cards in a Kanban board, explore them in a calendar or timeline, coordinate deadlines in a planner, and keep everyone aligned through notifications and chat.

### Highlights

- **Workspaces and projects** — Create collaborative spaces, organize projects, and manage access for team members.
- **Interactive Kanban** — Create, reorder, pin, collapse, color, watch, and archive lists; move cards with drag-and-drop.
- **Rich task cards** — Add descriptions, labels, members, due dates, covers, checklists, attachments, comments, and activity history.
- **Multiple project views** — Work with **Board, Table, Calendar, Timeline, and Dashboard**, all based on the same project data.
- **Time Garden Planner** — Plan tasks using Agenda, Day, Week, Month, or custom time ranges, including scheduling by drag-and-drop.
- **Collaboration in real time** — Exchange messages, track presence, share cards, and receive updates via Socket.IO.
- **Invitations and notifications** — Invite teammates, track pending invitations, receive acceptance alerts, and watch list activity.
- **Workflow automation** — Configure task/list rules and scheduled deadline reminders.
- **Personalized experience** — Use Flowe's pastel color system, Garden navigation, and responsive workspace panels.

> **Project status:** Actively developed. The repository includes unit and targeted logic tests. Run the full browser, database, and multi-user validation checklist before deploying to production.

---

## Technology stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 7, Lucide React, Motion |
| Backend | Node.js 22+, Express 5 |
| Database | MongoDB 7+, Mongoose 8 |
| Authentication | Cookie-based sessions, bcrypt, MongoDB session storage |
| Real-time communication | Socket.IO |
| Email delivery | Nodemailer / SMTP (optional) |
| Testing | Vitest, Testing Library, Node.js test runner, Supertest |
| Development tools | npm, Prettier, Docker Compose (optional) |

---

## Getting started

### Prerequisites

- **Node.js 22.12+** and npm
- **MongoDB 7+**, installed locally or accessible through a MongoDB URI
- **Git** (to clone the repository)
- **Docker Desktop / Docker Engine** *(optional, for local MongoDB)*

### 1. Get the source code

Clone your repository or extract the project ZIP, then open the project root (`Flowe_Kanban/`).

```bash
cd Flowe_Kanban
```

### 2. Start MongoDB

Use your local MongoDB service, or launch the MongoDB container included in the project:

```bash
docker compose up -d mongodb
```

The default connection is `mongodb://127.0.0.1:27017/flowe`.

### 3. Configure the backend

Create `backend/.env` from the provided example:

```bash
# macOS / Linux
cp backend/.env.example backend/.env
```

```powershell
# Windows PowerShell
Copy-Item backend/.env.example backend/.env
```

Edit the file and provide a secure `SESSION_SECRET` (at least 32 characters). Update `MONGODB_URI` if you are not using the default local instance.

```dotenv
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb://127.0.0.1:27017/flowe
SESSION_SECRET=replace-this-with-a-long-random-secret-at-least-32-chars
FRONTEND_URL=http://localhost:5173
PUBLIC_API_URL=http://localhost:4000
```

**Do not commit `.env` files or share credentials.** Optional SMTP and OAuth variables are described in `backend/.env.example`.

### 4. Start the backend

In your first terminal:

```bash
cd backend
npm ci
npm run dev
```

The API starts on **http://localhost:4000**. Check its health endpoint at **http://localhost:4000/api/health**.

### 5. Start the frontend

In a second terminal, from the project root:

```bash
cd frontend
npm ci
npm run dev
```

Open **http://localhost:5173** in your browser. Vite proxies `/api` and `/socket.io` requests to the backend during development.

---

## Application modules

| Module | What you can do |
| --- | --- |
| **Home** | View accessible workspaces, project information, and upcoming deadlines. |
| **Workspace & Gardens** | Navigate between projects, manage members, and personalize the workspace. |
| **Board** | Organize tasks in lists; create, edit, drag, pin, watch, sort, and archive items. |
| **Table** | Review task properties, filter and sort rows, edit values, resize columns, and export CSV. |
| **Calendar** | View scheduled cards by month or week, reschedule by drag-and-drop, and export `.ics`. |
| **Timeline** | Group tasks by list or member, switch time scales, and drag/resize date ranges. |
| **Dashboard** | Explore task metrics through configurable bar, line, and pie charts. |
| **Planner** | Manage planned and unscheduled cards in a separate time-oriented panel. |
| **Automation** | Build event-based actions and scheduled reminder rules. |
| **Chat & Notifications** | Communicate with teammates and receive invitation, activity, and task updates. |

### Workspace invitations

1. A workspace owner opens **Members → Invite** and sends an invitation to an email address.
2. The invitation is associated with that workspace and can be tracked as **Pending**, **Accepted**, or **Expired**.
3. Pending invitations can be resent or revoked by an authorized user.
4. An invited Flowe user can accept the invitation in the application or through an invitation link.
5. Once accepted, the user gains workspace membership and the inviter receives an in-app update.

In-app notifications work for registered users. **Email delivery requires valid SMTP configuration.** Sharing a project URL does not grant access automatically: normal workspace permissions still apply.

### Real-time teamwork

Flowe uses Socket.IO for collaborative updates, messaging, and presence indicators. Member avatars use distinct stable colors; presence indicators distinguish connected and offline members. List watching generates notifications from persisted changes, not from merely opening menus.

---

## Project structure

```text
Flowe_Kanban/
├── frontend/
│   ├── public/                  # Public assets
│   ├── src/
│   │   ├── app/                 # Application setup and routes
│   │   ├── pages/               # Route-level pages
│   │   ├── layouts/             # Navigation and application layouts
│   │   ├── components/ui/       # Shared UI components
│   │   ├── features/
│   │   │   ├── board/            # Kanban and card interactions
│   │   │   ├── planner/          # Time Garden
│   │   │   ├── views/            # Table, Calendar, Timeline, Dashboard
│   │   │   ├── dashboard/        # Home and workspace overview
│   │   │   ├── invitations/      # Incoming invitations
│   │   │   ├── notifications/    # Notification center
│   │   │   ├── automation/       # Automation builder
│   │   │   ├── chat/             # Conversations and presence
│   │   │   └── settings/         # Project settings
│   │   ├── context/             # Authentication state
│   │   ├── services/            # Shared API client
│   │   ├── styles/              # Global styles
│   │   └── assets/              # Brand assets
│   ├── tests/                   # Frontend logic tests
│   └── package.json
├── backend/
│   ├── config/                  # Database and environment validation
│   ├── controllers/             # Request handlers
│   ├── middleware/              # Authentication and authorization
│   ├── models/                  # Mongoose models
│   ├── routes/                  # REST API endpoints
│   ├── services/                # Email, automation, and project services
│   ├── tests/                   # Backend tests
│   ├── .env.example             # Example environment configuration
│   └── package.json
├── compose.yaml                 # Local MongoDB container
└── README.md
```

**Design principle:** route-level pages compose features; feature modules own their UI and behavior; shared elements belong in `components/ui`, and backend responsibilities remain separated into routes, controllers, models, and services.

---

## Available commands

### Frontend (`frontend/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the production frontend |
| `npm run preview` | Preview the production build |
| `npm test` | Run the Vitest suite |
| `npm run test:views` | Run view logic tests |
| `npm run test:planner` | Run Planner logic tests |
| `npm run check:imports` | Verify relative import paths |
| `npm run format` | Format source files with Prettier |
| `npm run format:check` | Check source formatting |

### Backend (`backend/`)

| Command | Description |
| --- | --- |
| `npm run dev` | Start the API with file watching |
| `npm start` | Start the API normally |
| `npm test` | Run the Node.js backend test suite |

### Recommended validation

```bash
# In frontend/
npm run check:imports
npm run test:views
npm run test:planner
npm test
npm run build

# In backend/
npm test
```

Test with **two browser sessions and two user accounts** to verify invitations, member presence, notifications, chat, and simultaneous board edits. Scheduled automations depend on the backend scheduler being active.

---

## Configuration and security

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment (`development` or `production`) |
| `PORT` | Backend port (default `4000`) |
| `MONGODB_URI` | MongoDB database connection |
| `SESSION_SECRET` | Secure key used to sign sessions |
| `FRONTEND_URL` | Frontend origin |
| `PUBLIC_API_URL` | Public API base URL |
| `TRUST_PROXY` | Enable when running behind a trusted reverse proxy |
| `SMTP_*`, `MAIL_FROM` | Optional outbound email configuration |
| `GOOGLE_*`, `MICROSOFT_*` | Optional OAuth provider credentials |

The API includes session-based authentication, authorization middleware, HTTP security headers, request rate limiting, and MongoDB-backed sessions. **Production deployments require additional environment-specific testing and configuration**, including HTTPS, secure cookies, secret management, persistent database backups, and proper reverse-proxy settings.

---

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Frontend loads, but actions fail | Make sure the backend is running on port `4000` and the Vite proxy is active. |
| MongoDB connection error | Check that MongoDB is running and `MONGODB_URI` is correct. |
| Login or session problems | Verify `SESSION_SECRET`, `FRONTEND_URL`, cookies, and backend logs. |
| Socket.IO disconnects | Verify `/socket.io` proxying, backend availability, and session authentication. |
| Invitation emails do not arrive | Configure SMTP credentials; in-app invitations can still be used for registered accounts. |
| Reminders do not trigger | Keep the backend scheduler running and verify rule schedules; configured automation hours use UTC. |
| UI changes are not visible | Restart the development server, refresh the browser, and check the browser console. |

---

## Development guidelines

- Keep the **Flowe visual identity**, reusable design tokens, and consistent component patterns.
- Place code in the corresponding feature module instead of creating large all-in-one pages.
- Use the shared API client and existing authorization rules for persistent changes.
- Test important interactions across **Board, Planner, Calendar, Timeline, and Dashboard**.
- Never commit `node_modules/`, `dist/`, local secrets, or generated files.
- Validate multi-user workflows before merging changes to collaboration or notifications.

---

<div align="center">
  <strong>Flowe</strong> — Organize your work. Grow your ideas. Collaborate naturally.
</div>
