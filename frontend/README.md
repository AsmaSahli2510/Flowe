<div align="center">

# ✦ Flowe

### A calmer space for collaborative project management.

**Plan projects · Organize tasks · Keep teams in sync**

A modern, pastel-inspired workspace built with **React 19** and **Vite 6**, featuring an interactive Kanban board, task management, calendar views, team overview, files, and project analytics.

[Explore the Figma UI](https://www.figma.com/design/mewqufFgXhYrT9434lmd18) · [Getting Started](#getting-started) · [Project Structure](#project-structure)

</div>

---

## Overview

**Flowe** is a front-end prototype for collaborative project organization. It brings tasks, timelines, project activity, and workspace navigation into a cohesive, responsive interface. Its soft color palette, streamlined cards, and custom sidebar aim to make project planning feel approachable without sacrificing clarity.

> **Project status:** Interactive front-end demo. Sample team data, messages, files, and selected dashboard metrics are illustrative. The project does not include a backend or live multi-user synchronization.

## Highlights

- **Kanban workflow:** Organize tasks across stages and move them between columns.
- **Task management:** Create, edit, and delete tasks through the task interface.
- **Multiple project views:** Explore board, calendar, and timeline-oriented project views.
- **Search and filtering:** Find tasks by title and filter high-priority items.
- **Persistent demo tasks:** Save task updates locally in the browser using `localStorage`.
- **Workspace views:** Browse team members, example files, messages, and analytics.
- **Responsive interface:** Navigate through desktop and smaller-screen layouts.
- **Custom UI:** A distinctive sidebar, soft pastel accents, icons, and a two-panel login screen.

## Tech Stack

| Technology | Purpose |
| --- | --- |
| [React 19](https://react.dev/) | Component-based user interface |
| [Vite 6](https://vite.dev/) | Development server and production bundling |
| [React Router 7](https://reactrouter.com/) | Client-side routing |
| [Lucide React](https://lucide.dev/) | Icon library |
| CSS | Styling, layout, and responsive behavior |
| React Context API | Shared application state |
| Browser `localStorage` | Persistence of demo tasks |

## Getting Started

### Prerequisites

- **Node.js 22.12.0 or later**
- **npm** (included with Node.js)

### Installation

1. Clone the repository and enter the project folder:

   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   cd YOUR_REPOSITORY
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open the local URL printed by Vite (typically **http://localhost:5173**).

> Replace `YOUR_USERNAME/YOUR_REPOSITORY` with your GitHub repository path. Run the commands from the directory containing `package.json`.

### Production Build

```bash
npm run build
npm run preview
```

`npm run build` creates the production output in `dist/`. `npm run preview` serves that build locally for verification.

## Available Pages

| Route | Page | Description |
| --- | --- | --- |
| `/login` | Login | Branded sign-in interface (UI demo) |
| `/` | Home | Workspace dashboard and project overview |
| `/my-tasks` | My Tasks | Personal task/project view |
| `/projects` | Projects | Project workflow and tasks |
| `/calendar` | Calendar | Calendar-oriented project view |
| `/team` | Team | Team member overview |
| `/messages` | Messages | Example team conversations and demo input |
| `/files` | Files | Example project file interface |
| `/analytics` | Analytics | Progress and productivity overview |


```

## How It Works

The application uses **React Router** to switch between screens and a shared **`FloweContext`** to coordinate tasks, search queries, filters, modal state, and workspace settings. Task updates are written to `localStorage` under the `flowe-tasks` key, so they persist across page refreshes **in the same browser**.

The interface comes with sample data in `src/data/demoData.js` so you can explore the workflow immediately, without server setup or environment variables.

## Design

Flowe uses a light, pastel-led visual direction with a custom navigation sidebar, rounded cards, subtle accents, and accessible visual grouping. The design includes a split-layout login screen and consistent dashboard components across project pages.

An editable multi-screen Figma reconstruction is available here:

**[Flowe — Complete UI in Figma](https://www.figma.com/design/mewqufFgXhYrT9434lmd18)**

*Note: The Figma file is an initial reconstruction and may not match the running application's details pixel for pixel.*

## Current Limitations

This repository is a **front-end demonstration**, not a production collaboration service:

- The login page is a presentation/demo UI; no authentication service is connected.
- Data is stored locally in the browser, not in a database.
- Messages, team profiles, file entries, and some analytics values use sample content.
- Changes do not synchronize between users, devices, or browsers.
- No backend APIs or external calendar integrations are included.

## Deployment Notes

The project builds to static files with Vite. When deploying to a static hosting platform, enable a **single-page application (SPA) fallback** so direct visits or refreshes on routes such as `/projects` resolve to `index.html`.

## Possible Next Steps

- Add real authentication and protected routes.
- Connect projects, tasks, and users to a database-backed API.
- Implement real-time team messaging and collaboration.
- Enable file uploads and cloud storage.
- Expand automated tests, accessibility checks, and production analytics.

---

<div align="center">

**Flowe** — Make room for great things.

Built with React, Vite, and thoughtful UI design.

</div>
