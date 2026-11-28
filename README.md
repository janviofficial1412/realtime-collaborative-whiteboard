# Real-Time Collaborative Whiteboard

A full-stack web application where users can create whiteboards, draw together in real time, and share boards with controlled access permissions.

**Live Application:** https://realtime-collaborative-whiteboard-f-five.vercel.app/

> **Device note:** The application is designed primarily for laptop and desktop use. A larger screen and mouse provide the most comfortable drawing experience. Mobile drawing is not currently the primary supported experience.

---

## Overview

This project started as a simple JavaScript Paint application. It evolved into a collaborative whiteboard after exploring a key question: what if multiple users could work on the same canvas at the same time?

The result combines canvas-based drawing, real-time communication, persistent storage, authentication, and permission-based sharing in one application.

## Features

### Interactive Whiteboard
- Freehand drawing with adjustable brush size and color.
- Eraser tool.
- Rectangle, circle, triangle, and arrow tools.
- Fill color support.
- Text boxes with editing, dragging, and resizing.
- Clear canvas with confirmation.
- Export the board as an image.
- Restore saved drawing content when reopening a board.

### Board Management
- Create and view multiple boards.
- Rename and delete boards.
- Store board content persistently in PostgreSQL.
- Restrict board-management actions to the board owner.

### Real-Time Collaboration
- Synchronize drawing operations using Socket.IO.
- Show live drawing previews.
- Display collaborators' live cursors and identifying labels.
- Synchronize text creation, editing, movement, resizing, and deletion.
- Synchronize canvas-clearing actions.
- Restore existing board content for collaborators joining a board.

### Sharing and Permissions
- Generate unique links to share individual boards.
- **VIEW access:** collaborators can see the board and receive live updates, but cannot make changes.
- **EDIT access:** collaborators can draw and modify board content.
- Revoke sharing links.
- Apply permission checks to protected REST API and Socket.IO operations.
- Switch active collaborators to read-only access when a share link is revoked.

### Authentication and Security
- User registration and login.
- Password hashing with bcrypt.
- Input validation and duplicate-email prevention.
- JWT-based access-token authentication.
- Refresh-token rotation and revocation.
- Hashed refresh-token storage and reuse detection.
- Protected backend routes and authenticated Socket.IO connections.

## Screenshots and Demo

Visit the live application:

**https://realtime-collaborative-whiteboard-f-five.vercel.app/**

You can add screenshots or a short demo recording to this section as the project presentation assets are prepared.

## Technology Stack

| Technology | Role |
|---|---|
| HTML5 | Frontend structure |
| CSS3 | Styling and layout |
| JavaScript | Frontend application logic |
| HTML5 Canvas API | Drawing and rendering |
| Node.js | Backend runtime |
| Express.js | REST API and server |
| PostgreSQL | Persistent relational storage |
| JSONB | Storing board drawing data |
| Socket.IO | Real-time collaboration |
| bcrypt | Password hashing |
| JSON Web Tokens (JWT) | Access-token authentication |
| Refresh tokens | Session renewal and revocation |
| Vercel | Frontend deployment |
| Render | Backend deployment |
| Neon | Hosted PostgreSQL database |

## Architecture

The application uses a client-server architecture.

1. **Frontend:** HTML, CSS, and JavaScript provide the user interface and canvas tools. The frontend communicates with the backend through REST APIs and Socket.IO.
2. **Backend:** Node.js and Express.js handle authentication, board management, authorization, and API requests. Socket.IO manages real-time collaboration.
3. **Database:** PostgreSQL stores users, boards, authentication records, sharing records, and persistent drawing data. Drawing content is stored using JSONB.

### Deployment

| Component | Platform |
|---|---|
| Frontend | Vercel |
| Backend and Socket.IO server | Render |
| PostgreSQL database | Neon |

## Running Locally

### Prerequisites
- Node.js and npm
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/janviofficial1412/realtime-collaborative-whiteboard.git
cd realtime-collaborative-whiteboard
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Configure environment variables

Create a `.env` file in the `backend` directory. Add the database connection settings, authentication secrets, frontend origin, and any other variables required by the backend configuration.

Example database settings:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whiteboard_db
DB_USER=your_postgres_username
DB_PASSWORD=your_postgres_password
```

Use the exact environment-variable names expected by the backend code. Do not commit your `.env` file or expose database credentials, token secrets, or other sensitive values.

### 4. Create the database

Create a PostgreSQL database named `whiteboard_db` (or use the database name configured in your environment):

```sql
CREATE DATABASE whiteboard_db;
```

Apply the database migration files included in the backend project in their intended order. Ensure the backend is configured to connect to this database.

### 5. Start the backend

From the `backend` directory, run the start script defined in `package.json`:

```bash
npm start
```

If the project does not define a start script, start the server using its configured entry point.

### 6. Open the frontend

Open the frontend entry page using a local development server. Configure the frontend API and Socket.IO connection settings to point to your local backend.

The local backend runs at:

```text
http://localhost:3000
```

## Access Permission Matrix

| Action | Board Owner | EDIT Collaborator | VIEW Collaborator |
|---|:---:|:---:|:---:|
| View board | Yes | Yes | Yes |
| Receive real-time updates | Yes | Yes | Yes |
| Draw on canvas | Yes | Yes | No |
| Create or edit text | Yes | Yes | No |
| Move or resize text | Yes | Yes | No |
| Clear canvas | Yes | Yes | No |
| Rename board | Yes | No | No |
| Delete board | Yes | No | No |
| Manage sharing links | Yes | No | No |

Permission-sensitive operations are checked on the backend; frontend control visibility is not the only access-control mechanism.

## Project Structure

The repository is organized into separate frontend and backend applications. The frontend contains the HTML pages, stylesheets, and JavaScript modules for authentication, board management, canvas tools, and real-time communication. The backend contains the Express server, API routes, controllers, middleware, database access, and migrations.

```text
realtime-collaborative-whiteboard/
├── frontend/
│   ├── index.html
│   ├── board-management.html
│   ├── whiteboard.html
│   ├── css/
│   └── js/
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── database/
│   │   └── migrations/
│   ├── server.js
│   ├── db.js
│   └── package.json
├── .gitignore
└── README.md
```

This is a high-level overview; additional modules and files are present in the repository.

## Key Engineering Challenges

### 1. Real-Time Synchronization and Persistence

Drawing operations need to appear immediately for collaborators and remain available after a board is reopened. Socket.IO handles live synchronization, while PostgreSQL stores the board's drawing data for persistence.

### 2. Permission-Based Sharing and Access Revocation

Sharing a board requires more than generating a URL. The backend must distinguish between viewers and editors, validate each protected operation, and handle access changes while a collaborator is connected. The application supports VIEW and EDIT permissions and real-time revocation of active sharing access.

## What I Learned

Building this project provided practical experience with:
- Structuring a full-stack application.
- Designing and integrating REST APIs.
- Working with PostgreSQL and persistent JSONB data.
- Implementing authentication and refresh-token flows.
- Applying backend authorization and permission checks.
- Building real-time features with Socket.IO.
- Debugging frontend, backend, and database integration issues.
- Deploying a full-stack application.

## Author

**Janvi Desai**

- GitHub: https://github.com/janviofficial1412

---

If you try the application, use a laptop or desktop for the intended drawing experience.
